import json
import re
import requests
from typing import Any
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

try:
    from app.config import settings
except ImportError:  # pragma: no cover - keeps the module importable in isolation
    settings = None


USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/151.0.0.0 Safari/537.36"
)


def _normalize_source_url(url: str) -> str:
    """Remove marketplace tracking/query parameters before fetching."""
    parsed = urlparse(url.strip())
    host = (parsed.hostname or "").lower()

    # Etsy listing pages work best without the large tracking/query string
    # copied from browser links (ref, logging_key, content_source, etc.).
    if host == "etsy.com" or host.endswith(".etsy.com"):
        return parsed._replace(query="", fragment="").geturl()

    return parsed._replace(fragment="").geturl()


def _is_etsy_url(url: str) -> bool:
    host = (urlparse(url).hostname or "").lower()
    return host == "etsy.com" or host.endswith(".etsy.com")


def _extract_etsy_listing_id(url: str) -> str | None:
    """Extract the numeric Etsy listing id from a public listing URL."""
    path = urlparse(url).path
    match = re.search(r"/listing/(\d+)(?:/|$)", path, flags=re.IGNORECASE)
    return match.group(1) if match else None


def _etsy_api_key() -> str:
    """Build Etsy's x-api-key value from the existing CraftPilot settings."""
    if settings is None:
        return ""

    key = getattr(settings, "etsy_api_key", None)
    secret = getattr(settings, "etsy_shared_secret", None)

    if not key or not secret:
        return ""

    return f"{key}:{secret}"


def _extract_etsy_product_via_api(source_url: str) -> dict[str, Any] | None:
    """Fetch a public Etsy listing through Etsy Open API instead of scraping Etsy."""
    listing_id = _extract_etsy_listing_id(source_url)
    if not listing_id:
        return None

    api_key = _etsy_api_key()
    if not api_key:
        print("Etsy API fallback unavailable: missing etsy_api_key/etsy_shared_secret.")
        return None

    endpoint = f"https://api.etsy.com/v3/application/listings/{listing_id}"

    try:
        response = requests.get(
            endpoint,
            headers={
                "x-api-key": api_key,
                "Accept": "application/json",
                "User-Agent": USER_AGENT,
            },
            params={
                "includes": "Images,Translations",
            },
            timeout=20,
        )

        if not response.ok:
            print(
                "Etsy listing API failed:",
                response.status_code,
                response.text[:500],
            )
            return None

        data = response.json()
        if not isinstance(data, dict):
            return None

        title = data.get("title")
        description = data.get("description")
        currency = data.get("currency_code")

        # Etsy listing prices are returned as an integer amount/divisor pair.
        price_data = data.get("price")
        price = None
        if isinstance(price_data, dict):
            amount = price_data.get("amount")
            divisor = price_data.get("divisor") or 1
            if amount is not None:
                try:
                    price = float(amount) / float(divisor)
                except (TypeError, ValueError, ZeroDivisionError):
                    price = None

        images: list[str] = []
        api_images = data.get("images")
        if isinstance(api_images, list):
            for image in api_images:
                if not isinstance(image, dict):
                    continue

                candidates = [
                    image.get("url_fullxfull"),
                    image.get("url_570xN"),
                    image.get("url_760xN"),
                    image.get("url_300x300"),
                    image.get("url_170x135"),
                ]

                for candidate in candidates:
                    if not candidate:
                        continue
                    normalized = _normalize_image_url(str(candidate))
                    if normalized and not _is_thumbnail_image(normalized):
                        if normalized not in images:
                            images.append(normalized)
                        break

        if not title and not description and price is None and not images:
            return None

        return {
            "url": source_url,
            "title": _clean_text(str(title or "")),
            "description": _clean_text(str(description or "")),
            "price": price,
            "currency": currency,
            "brand": None,
            "images": images[:15],
            "image_count": min(len(images), 15),
        }

    except Exception as error:
        print("Etsy listing API fallback failed:", repr(error))
        return None


# ============================================================
# GENERIC SOURCE HELPERS
# ============================================================

def _is_generic_site_title(title: str | None, url: str) -> bool:
    if not title:
        return True
    cleaned = re.sub(r"\s+", " ", str(title)).strip().lower()
    host = re.sub(r"^www\.", "", (urlparse(url).hostname or "").lower())
    generic_titles = {
        "etsy.com", "etsy", "aliexpress.com", "aliexpress",
        "amazon.com", "amazon", "ebay", "ebay.com",
    }
    return cleaned in generic_titles or (bool(host) and cleaned == host)


def _page_looks_like_product(page_html: str, page_url: str) -> bool:
    if not page_html:
        return False
    try:
        soup = BeautifulSoup(page_html, "html.parser")
        og = soup.find("meta", attrs={"property": "og:title"})
        title = og.get("content") if og else None
        if _is_generic_site_title(title, page_url):
            title = None
        if title and len(str(title).strip()) >= 8:
            return True
        if soup.find("script", attrs={"type": "application/ld+json"}):
            return True
        if soup.find("meta", attrs={"property": "product:price:amount"}):
            return True
        lowered = page_html.lower()
        return any(
            marker in lowered
            for marker in (
                "productid", "product_id", "itemid", "sku",
                '"@type":"product"', '"@type": "product"',
                "pricecurrency", "product:price",
            )
        )
    except Exception:
        return False


def _extract_reader_product(
    content: str,
    source_url: str,
) -> dict[str, Any] | None:
    """Parse Jina Reader markdown/JSON into the common product shape.

    Etsy pages are often returned as clean markdown with the listing title,
    description, price and image links even when direct HTTP access is 403.
    """
    if not content:
        return None

    raw = content
    try:
        data = json.loads(content)
        if isinstance(data, dict):
            nested = data.get("data")
            if isinstance(nested, dict):
                content = str(nested.get("content") or "")
            else:
                content = str(data.get("content") or data.get("text") or "")
    except Exception:
        pass

    if not content.strip():
        return None

    text = re.sub(r"\r\n?", "\n", content).strip()

    images: list[str] = []
    for image in re.findall(
        r"!\[[^\]]*\]\((https?://[^)\s]+)",
        text,
        flags=re.IGNORECASE,
    ):
        image = image.strip().replace("\\/", "/")
        if image and image not in images and not _is_thumbnail_image(image):
            images.append(image)

    title = None

    # Prefer a real H1/H2. Etsy Reader output normally exposes the listing
    # title this way.
    for pattern in (
        r"(?m)^#\s+(.+?)\s*$",
        r"(?m)^##\s+(.+?)\s*$",
    ):
        for match in re.finditer(pattern, text):
            candidate = re.sub(r"\s+", " ", match.group(1)).strip()
            candidate = re.sub(r"^\[[^]]+\]\s*", "", candidate)
            if (
                8 <= len(candidate) <= 300
                and not _is_generic_site_title(candidate, source_url)
                and candidate.lower() not in {"product details", "description"}
            ):
                title = candidate
                break
        if title:
            break

    if not title:
        # Try common reader labels such as "Title: ...".
        for line in text.splitlines():
            m = re.match(r"^\s*(?:title|item title|product title)\s*:\s*(.+)$", line, flags=re.I)
            if m:
                candidate = re.sub(r"\s+", " ", m.group(1)).strip()
                if not _is_generic_site_title(candidate, source_url):
                    title = candidate
                    break

    if not title and _is_etsy_url(source_url):
        # Last-resort Etsy URL slug -> human title. This is only used when
        # Reader omitted the heading; it does not invent product facts.
        path = urlparse(source_url).path
        m = re.search(r"/listing/\d+/([^/?#]+)", path, flags=re.I)
        if m:
            slug = m.group(1)
            candidate = re.sub(r"[-_]+", " ", slug).strip()
            candidate = re.sub(r"\s+", " ", candidate)
            if candidate and not _is_generic_site_title(candidate, source_url):
                title = candidate.title()

    price = None
    currency = None
    # Prefer values close to an explicit price label to avoid picking a random
    # number such as a review count or dimension.
    labelled_patterns = [
        r"(?i)(?:price|our price|sale price|now)\s*[:\-]?\s*([$€£])\s*([0-9][0-9,]*(?:\.[0-9]+)?)",
        r"(?i)(?:price|our price|sale price|now)\s*[:\-]?\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s*(USD|EUR|GBP|TRY|TL)\b",
    ]
    for pattern in labelled_patterns:
        match = re.search(pattern, text)
        if not match:
            continue
        if match.group(1) in {"$", "€", "£"}:
            currency = {"$": "USD", "€": "EUR", "£": "GBP"}[match.group(1)]
            raw_price = match.group(2)
        else:
            currency = "TRY" if match.group(2).upper() == "TL" else match.group(2).upper()
            raw_price = match.group(1)
        price = _parse_price(raw_price)
        if price is not None:
            break

    if price is None:
        patterns = [
            (r"([$€£])\s*([0-9][0-9,]*(?:\.[0-9]+)?)", True),
            (r"\b(USD|EUR|GBP|TRY|TL)\s*([0-9][0-9,]*(?:\.[0-9]+)?)", False),
            (r"([0-9][0-9,]*(?:\.[0-9]+)?)\s*(USD|EUR|GBP|TRY|TL)\b", False),
        ]
        for pattern, symbol_pattern in patterns:
            match = re.search(pattern, text, flags=re.IGNORECASE)
            if not match:
                continue
            if symbol_pattern:
                currency = {"$": "USD", "€": "EUR", "£": "GBP"}.get(match.group(1))
                raw_price = match.group(2)
            elif match.group(1).upper() in {"USD", "EUR", "GBP", "TRY", "TL"}:
                currency = "TRY" if match.group(1).upper() == "TL" else match.group(1).upper()
                raw_price = match.group(2)
            else:
                currency = "TRY" if match.group(2).upper() == "TL" else match.group(2).upper()
                raw_price = match.group(1)
            price = _parse_price(raw_price)
            if price is not None:
                break

    stop_markers = (
        "shipping and return policies",
        "delivery and return policies",
        "meet your seller",
        "faqs",
        "you may also like",
        "related searches",
        "sign in",
        "register",
    )

    description_lines: list[str] = []
    started = False
    for line in text.splitlines():
        clean = re.sub(r"^\s*[#>*\-]+\s*", "", line).strip()
        if not clean or clean.startswith("!["):
            continue

        lower = clean.lower()
        if title and clean == title:
            started = True
            continue

        # Reader output may put a Description heading before the actual copy.
        if lower in {"description", "item details", "about this item", "details"}:
            started = True
            continue

        if any(marker in lower for marker in stop_markers):
            if started:
                break
            continue

        # Drop obvious navigation/utility lines before we have reached listing
        # content. Keep normal prose and listing facts after the title.
        if not started:
            if _is_etsy_url(source_url) and lower in {
                "etsy", "search", "cart", "favorites", "help", "home & living"
            }:
                continue
            if len(clean) < 12:
                continue
            # Once we see a long natural-language line, treat it as content.
            if len(clean.split()) >= 5:
                started = True
            else:
                continue

        description_lines.append(clean)

    description = _clean_text(" ".join(description_lines))
    if title and description.startswith(title):
        description = description[len(title):].strip(" -:")
    if len(description) > 10000:
        description = description[:10000]

    # If Reader returned JSON/metadata instead of a usable article, do not
    # silently turn a generic site page into a fake product.
    if _is_generic_site_title(title, source_url):
        title = None

    if not title and not description and price is None and not images:
        return None

    return {
        "url": source_url,
        "title": title or "",
        "description": description,
        "price": price,
        "currency": currency,
        "brand": None,
        "images": images[:15],
        "image_count": min(len(images), 15),
    }


def _fetch_with_reader(source_url: str) -> dict[str, Any] | None:
    try:
        response = requests.get(
            "https://r.jina.ai/" + source_url,
            headers={
                "User-Agent": USER_AGENT,
                "Accept": "text/plain,text/markdown,text/html,*/*;q=0.8",
            },
            timeout=45,
        )
        if not response.ok:
            print("Reader fallback status:", response.status_code)
            return None
        return _extract_reader_product(response.text, source_url)
    except Exception as error:
        print("Reader fallback failed:", repr(error))
        return None


# ============================================================
# MAIN
# ============================================================

def fetch_product_from_url(
    url: str,
) -> dict[str, Any]:

    url = url.strip().replace("\\", "")

    if not url:
        raise ValueError("Product URL cannot be empty.")

    if not re.match(r"^https?://", url, re.IGNORECASE):
        raise ValueError(
            "Invalid URL. URL must start with http:// or https://."
        )

    original_url = url
    url = _normalize_source_url(url)

    html: str | None = None
    final_url = url
    fetch_errors: list[str] = []

    def _looks_like_block_page(page_html: str, page_url: str) -> bool:
        if not page_html:
            return True

        current_url = (page_url or "").lower()

        url_markers = [
            "/punish",
            "/captcha",
            "/challenge",
            "/security-verification",
        ]

        if any(marker in current_url for marker in url_markers):
            return True

        try:
            soup_check = BeautifulSoup(page_html, "html.parser")

            for tag in soup_check.find_all(
                ["script", "style", "noscript"]
            ):
                tag.decompose()

            visible_text = soup_check.get_text(
                " ",
                strip=True,
            ).lower()

            strong_phrases = [
                "verify you are human",
                "verify you're human",
                "please verify you are human",
                "please verify you're human",
                "robot check",
                "access denied",
                "security verification",
                "unusual traffic",
                "automated access",
                "too many requests",
            ]

            matched = sum(
                phrase in visible_text
                for phrase in strong_phrases
            )

            return matched >= 2

        except Exception:
            return False

    def _has_product_signals(page_html: str) -> bool:
        if not page_html:
            return False

        try:
            soup_check = BeautifulSoup(
                page_html,
                "html.parser",
            )

            if soup_check.find(
                "meta",
                attrs={"property": "og:title"},
            ):
                return True

            if soup_check.find(
                "meta",
                attrs={"property": "og:image"},
            ):
                return True

            for script in soup_check.find_all(
                "script",
                attrs={"type": "application/ld+json"},
            ):
                script_text = script.get_text(
                    " ",
                    strip=True,
                ).lower()

                if "product" in script_text:
                    return True

            lower_html = page_html.lower()

            return any(
                marker in lower_html
                for marker in [
                    "producttitle",
                    "productid",
                    "product_id",
                    "itemid",
                    "sku_id",
                    "skuid",
                    "saleprice",
                    "discountprice",
                    "currentprice",
                    "gallery",
                ]
            )

        except Exception:
            return False

    # Etsy listing pages may return 403 to direct HTML clients. For Etsy
    # listings, prefer the official Open API because CraftPilot already has
    # the required API key/shared secret in its settings. This avoids scraping
    # Etsy pages and gives us structured title/description/price/images.
    if _is_etsy_url(url):
        print("Etsy URL detected; trying Etsy Open API first.")
        api_result = _extract_etsy_product_via_api(url)
        if api_result and (
            api_result.get("title")
            or api_result.get("description")
            or api_result.get("images")
        ):
            return api_result
        fetch_errors.append("Etsy Open API did not return usable listing data.")

    # --------------------------------------------------------
    # 1. NORMAL HTTP FETCH
    # --------------------------------------------------------
    try:
        response = requests.get(
            url,
            headers={
                "User-Agent": USER_AGENT,
                "Accept-Language": "en-US,en;q=0.9,tr;q=0.8",
                "Accept": (
                    "text/html,application/xhtml+xml,"
                    "application/xml;q=0.9,*/*;q=0.8"
                ),
                "Referer": (
                    "https://www.google.com/"
                    if ("aliexpress." in url.lower() or _is_etsy_url(url))
                    else url
                ),
                "Connection": "keep-alive",
            },
            timeout=30,
            allow_redirects=True,
        )

        response.raise_for_status()

        candidate_html = response.text
        candidate_url = response.url

        if candidate_html and not _looks_like_block_page(
            candidate_html,
            candidate_url,
        ):
            html = candidate_html
            final_url = candidate_url

            if _has_product_signals(candidate_html):
                print("HTTP fetch found product signals.")
            else:
                print(
                    "HTTP fetch returned a non-blocked page; "
                    "letting the extraction layer inspect it."
                )
        else:
            fetch_errors.append(
                "HTTP fetch returned an empty or security/challenge page."
            )

    except Exception as error:
        fetch_errors.append(
            f"HTTP fetch failed: {error}"
        )

    # A successful HTTP response can still be only a marketplace
    # homepage/generic page. Do not send that to the AI.
    if html and not _page_looks_like_product(html, final_url):
        print("HTTP fetch returned low-quality/non-product page; trying browser.")
        html = None

    # --------------------------------------------------------
    # 2. PLAYWRIGHT FALLBACK
    # --------------------------------------------------------
    if not html:
        browser = None
        context = None

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)

                context = browser.new_context(
                    user_agent=USER_AGENT,
                    viewport={
                        "width": 1440,
                        "height": 900,
                    },
                    locale="en-US",
                    extra_http_headers={
                        "Accept-Language": "en-US,en;q=0.9,tr;q=0.8",
                        "Referer": "https://www.google.com/",
                    },
                )

                page = context.new_page()

                page.goto(
                    url,
                    wait_until="domcontentloaded",
                    timeout=60000,
                )

                page.wait_for_timeout(3000)

                current_url = page.url
                candidate_html = page.content()

                if not _looks_like_block_page(
                    candidate_html,
                    current_url,
                ):
                    html = candidate_html
                    final_url = current_url
                    print("Browser fetch returned a usable page.")
                else:
                    fetch_errors.append(
                        "Browser fetch reached an anti-bot/security page."
                    )

                context.close()
                browser.close()
                context = None
                browser = None

        except Exception as error:
            fetch_errors.append(
                f"Browser fetch failed: {error}"
            )

            try:
                if context:
                    context.close()
            except Exception:
                pass

            try:
                if browser:
                    browser.close()
            except Exception:
                pass

    if html and not _page_looks_like_product(html, final_url):
        print("Browser fetch returned low-quality/non-product page; trying reader.")
        html = None

    # --------------------------------------------------------
    # 3. UNIVERSAL READER FALLBACK
    # --------------------------------------------------------
    if not html:
        reader_result = _fetch_with_reader(url)
        if reader_result:
            return reader_result

    if not html:
        detail = " | ".join(fetch_errors)

        raise RuntimeError(
            "Could not fetch product page. "
            + (
                detail
                if detail
                else "No usable page content was returned."
            )
        )

    soup = BeautifulSoup(
        html,
        "html.parser",
    )

    # ========================================================
    # DATA SOURCES
    # ========================================================

    json_ld_product = _extract_product_json_ld(soup)
    page_data = _extract_next_data(soup)

    # ========================================================
    # TITLE
    # ========================================================

    title = _get_meta_content(
        soup,
        "og:title",
    )

    if _is_generic_site_title(title, final_url):
        title = None

    if not title:
        title = _find_value_recursive(
            page_data,
            [
                "title",
                "productTitle",
                "subject",
                "name",
            ],
        )

    if not title and json_ld_product:
        title = json_ld_product.get("name")

    if not title:
        title_tag = soup.find("title")

        if title_tag:
            title = title_tag.get_text(
                strip=True
            )

            if _is_generic_site_title(title, final_url):
                title = None

    # ========================================================
    # DESCRIPTION
    # ========================================================

    description = _get_meta_content(
        soup,
        "og:description",
    )

    if not description:
        description = _get_meta_content(
            soup,
            "description",
        )

    if description:
        normalized_description = (
            description.strip().lower()
        )

        invalid_descriptions = {
            "smarter shopping, better living!",
            "aliexpress.com",
            "smarter shopping, better living! aliexpress.com",
            "etsy.com",
            "etsy",
        }

        if normalized_description in invalid_descriptions:
            description = None

    if not description and json_ld_product:
        description = json_ld_product.get(
            "description"
        )

    if not description:
        description = _find_value_recursive(
            page_data,
            [
                "description",
                "productDescription",
                "productDesc",
                "detail",
            ],
        )

    # ========================================================
    # PRICE
    # ========================================================

    price = None
    currency = None

    if json_ld_product:
        price, currency = _extract_price(
            json_ld_product
        )

    if price is None:
        price, currency = _extract_price_recursive(
            page_data
        )

    if price is None:
        price, currency = _extract_price_from_html(
            soup
        )

    if price is None:
        price, currency = _extract_price_from_raw_html(
            html
        )

    # ========================================================
    # BRAND
    # ========================================================

    brand = None

    if json_ld_product:
        brand = _extract_brand(
            json_ld_product
        )

    if not brand:
        brand = _find_value_recursive(
            page_data,
            [
                "brand",
                "brandName",
            ],
        )

    # ========================================================
    # IMAGES
    # ========================================================

    images: list[str] = []

    if json_ld_product:
        images.extend(
            _extract_images(
                json_ld_product,
                final_url,
            )
        )

    images.extend(
        _extract_images_from_metadata(
            soup,
            final_url,
        )
    )

    images.extend(
        _extract_images_from_page_data(
            page_data,
            final_url,
        )
    )

    images.extend(
        _extract_images_from_raw_html(
            html,
            final_url,
        )
    )

    unique_images: list[str] = []
    seen_image_keys: set[str] = set()

    for image in images:
        if not image:
            continue

        image = (
            str(image)
            .strip()
            .replace("\\/", "/")
            .replace("\\u002F", "/")
            .replace("\\", "")
        )

        image = urljoin(
            final_url,
            image,
        )

        if not image.startswith(
            (
                "http://",
                "https://",
            )
        ):
            continue

        if _is_thumbnail_image(image):
            continue

        image_key = _normalize_image_url(image)

        if not image_key:
            continue

        if image_key in seen_image_keys:
            continue

        seen_image_keys.add(image_key)
        unique_images.append(image)

    # ========================================================
    # FALLBACK IMAGES FROM IMG TAGS
    # ========================================================

    if not unique_images:
        for img in soup.find_all("img"):
            image_url = (
                img.get("src")
                or img.get("data-src")
                or img.get("data-original")
                or img.get("data-lazy-src")
            )

            if not image_url:
                continue

            image_url = (
                str(image_url)
                .strip()
                .replace("\\/", "/")
                .replace("\\u002F", "/")
                .replace("\\", "")
            )

            image_url = urljoin(
                final_url,
                image_url,
            )

            if not image_url.startswith(
                (
                    "http://",
                    "https://",
                )
            ):
                continue

            if _is_thumbnail_image(image_url):
                continue

            image_key = _normalize_image_url(
                image_url
            )

            if not image_key:
                continue

            if image_key in seen_image_keys:
                continue

            seen_image_keys.add(image_key)
            unique_images.append(image_url)

            if len(unique_images) >= 15:
                break

    # ========================================================
    # CLEAN TEXT
    # ========================================================

    title = _clean_product_title(
        title,
        final_url,
    )

    description = _clean_text(
        description
    )

    brand = _clean_text(
        brand
    )

    if len(description) > 10000:
        description = description[:10000]

    final_images = unique_images[:15]

    result = {
        "url": final_url,
        "title": title,
        "description": description,
        "price": price,
        "currency": currency,
        "brand": brand,
        "images": final_images,
        "image_count": len(final_images),
    }

    if not any(
        [
            result["title"],
            result["description"],
            result["price"] is not None,
            result["image_count"] > 0,
        ]
    ):
        raise RuntimeError(
            "Product page was fetched, but no usable product "
            "information could be extracted."
        )

    return result



# ============================================================
# META
# ============================================================

def _get_meta_content(
    soup: BeautifulSoup,
    name: str,
) -> str | None:

    tag = soup.find(
        "meta",
        attrs={
            "property": name
        },
    )

    if not tag:

        tag = soup.find(
            "meta",
            attrs={
                "name": name
            },
        )

    if not tag:
        return None

    content = tag.get(
        "content"
    )

    if not content:
        return None

    return str(
        content
    ).strip()


# ============================================================
# JSON-LD
# ============================================================

def _extract_product_json_ld(
    soup: BeautifulSoup,
) -> dict[str, Any] | None:

    scripts = soup.find_all(
        "script",
        attrs={
            "type": "application/ld+json"
        },
    )

    for script in scripts:

        raw = (
            script.string
            or script.get_text()
        )

        if not raw:
            continue

        try:

            data = json.loads(
                raw
            )

        except (
            json.JSONDecodeError,
            TypeError,
        ):
            continue

        product = (
            _find_product_object(
                data
            )
        )

        if product:
            return product

    return None


def _find_product_object(
    data: Any,
) -> dict[str, Any] | None:

    if isinstance(
        data,
        dict,
    ):

        item_type = data.get(
            "@type"
        )

        if (
            item_type == "Product"
            or (
                isinstance(
                    item_type,
                    list,
                )
                and "Product"
                in item_type
            )
        ):

            return data

        graph = data.get(
            "@graph"
        )

        if isinstance(
            graph,
            list,
        ):

            for item in graph:

                result = (
                    _find_product_object(
                        item
                    )
                )

                if result:
                    return result

        for value in data.values():

            if isinstance(
                value,
                (
                    dict,
                    list,
                ),
            ):

                result = (
                    _find_product_object(
                        value
                    )
                )

                if result:
                    return result

    elif isinstance(
        data,
        list,
    ):

        for item in data:

            result = (
                _find_product_object(
                    item
                )
            )

            if result:
                return result

    return None


# ============================================================
# NEXT DATA
# ============================================================

def _extract_next_data(
    soup: BeautifulSoup,
) -> Any:

    script = soup.find(
        "script",
        id="__NEXT_DATA__",
    )

    if not script:
        return {}

    raw = (
        script.string
        or script.get_text()
    )

    if not raw:
        return {}

    try:

        return json.loads(
            raw
        )

    except (
        json.JSONDecodeError,
        TypeError,
    ):

        return {}


# ============================================================
# RECURSIVE SEARCH
# ============================================================

def _find_value_recursive(
    data: Any,
    keys: list[str],
) -> Any:

    if isinstance(
        data,
        dict,
    ):

        for key in keys:

            if key not in data:
                continue

            value = data[key]

            if value not in (
                None,
                "",
                [],
                {},
            ):

                return value

        for value in data.values():

            if isinstance(
                value,
                (
                    dict,
                    list,
                ),
            ):

                result = (
                    _find_value_recursive(
                        value,
                        keys,
                    )
                )

                if result not in (
                    None,
                    "",
                    [],
                    {},
                ):

                    return result

    elif isinstance(
        data,
        list,
    ):

        for item in data:

            result = (
                _find_value_recursive(
                    item,
                    keys,
                )
            )

            if result not in (
                None,
                "",
                [],
                {},
            ):

                return result

    return None


# ============================================================
# PRICE
# ============================================================

def _extract_price(
    product: dict[str, Any],
) -> tuple[
    float | None,
    str | None,
]:

    offers = product.get(
        "offers"
    )

    if isinstance(
        offers,
        list,
    ):

        offers = (
            offers[0]
            if offers
            else None
        )

    if not isinstance(
        offers,
        dict,
    ):

        return None, None

    price = offers.get(
        "price"
    )

    currency = (
        offers.get(
            "priceCurrency"
        )
        or offers.get(
            "currency"
        )
    )

    return (
        _parse_price(
            price
        ),
        currency,
    )


def _extract_price_recursive(
    data: Any,
) -> tuple[
    float | None,
    str | None,
]:

    if isinstance(
        data,
        dict,
    ):

        price_keys = [
            "price",
            "salePrice",
            "discountPrice",
            "minPrice",
            "maxPrice",
            "formattedPrice",
            "finalPrice",
            "originalPrice",
            "promotionPrice",
            "discountedPrice",
            "currentPrice",
        ]

        currency_keys = [
            "currency",
            "currencyCode",
            "priceCurrency",
            "currencySymbol",
        ]

        for key in price_keys:

            if key not in data:
                continue

            value = data[key]

            parsed = _parse_price(
                value
            )

            if parsed is None:
                continue

            found_currency = None

            for currency_key in currency_keys:

                currency_value = data.get(
                    currency_key
                )

                if currency_value:

                    found_currency = (
                        str(
                            currency_value
                        ).strip()
                    )

                    break

            return (
                parsed,
                found_currency,
            )

        for value in data.values():

            if isinstance(
                value,
                (
                    dict,
                    list,
                ),
            ):

                price, currency = (
                    _extract_price_recursive(
                        value
                    )
                )

                if price is not None:

                    return (
                        price,
                        currency,
                    )

    elif isinstance(
        data,
        list,
    ):

        for item in data:

            price, currency = (
                _extract_price_recursive(
                    item
                )
            )

            if price is not None:

                return (
                    price,
                    currency,
                )

    return None, None


def _extract_price_from_html(
    soup: BeautifulSoup,
) -> tuple[
    float | None,
    str | None,
]:

    currency = (
        _get_meta_content(
            soup,
            "product:price:currency",
        )
    )

    price_meta_names = [
        "product:price:amount",
        "og:price:amount",
        "price",
        "sale_price",
        "salePrice",
        "amount",
        "current_price",
    ]

    for name in price_meta_names:

        value = (
            _get_meta_content(
                soup,
                name,
            )
        )

        parsed = _parse_price(
            value
        )

        if parsed is not None:

            return (
                parsed,
                currency,
            )

    return None, currency


def _extract_price_from_raw_html(
    html: str,
) -> tuple[
    float | None,
    str | None,
]:

    if not html:
        return None, None

    patterns = [

        r'"price"\s*:\s*"([0-9]+(?:[.,][0-9]+)?)"',
        r'"price"\s*:\s*([0-9]+(?:[.,][0-9]+)?)',

        r'"salePrice"\s*:\s*"([0-9]+(?:[.,][0-9]+)?)"',
        r'"salePrice"\s*:\s*([0-9]+(?:[.,][0-9]+)?)',

        r'"discountPrice"\s*:\s*"([0-9]+(?:[.,][0-9]+)?)"',
        r'"discountPrice"\s*:\s*([0-9]+(?:[.,][0-9]+)?)',

        r'"minPrice"\s*:\s*"([0-9]+(?:[.,][0-9]+)?)"',
        r'"minPrice"\s*:\s*([0-9]+(?:[.,][0-9]+)?)',

        r'"finalPrice"\s*:\s*"([0-9]+(?:[.,][0-9]+)?)"',
        r'"finalPrice"\s*:\s*([0-9]+(?:[.,][0-9]+)?)',

        r'"currentPrice"\s*:\s*"([0-9]+(?:[.,][0-9]+)?)"',
        r'"currentPrice"\s*:\s*([0-9]+(?:[.,][0-9]+)?)',
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            html,
            flags=re.IGNORECASE,
        )

        if not match:
            continue

        price = _parse_price(
            match.group(1)
        )

        if price is None:
            continue

        currency = None

        currency_match = re.search(
            r'"(?:currency|currencyCode|priceCurrency)"\s*:\s*"([^"]+)"',
            html,
            flags=re.IGNORECASE,
        )

        if currency_match:

            currency = (
                currency_match.group(1)
                .strip()
            )

        return (
            price,
            currency,
        )

    return None, None


def _parse_price(
    value: Any,
) -> float | None:

    if value is None:
        return None

    if isinstance(
        value,
        (
            int,
            float,
        ),
    ):

        return float(value)

    text = str(
        value
    ).strip()

    if not text:
        return None

    text = re.sub(
        r"[^\d.,]",
        " ",
        text,
    ).strip()

    match = re.search(
        r"\d+(?:[.,]\d+)?",
        text,
    )

    if not match:
        return None

    number = match.group(
        0
    )

    if (
        "," in number
        and "." in number
    ):

        if (
            number.rfind(",")
            > number.rfind(".")
        ):

            number = (
                number
                .replace(
                    ".",
                    "",
                )
                .replace(
                    ",",
                    ".",
                )
            )

        else:

            number = number.replace(
                ",",
                "",
            )

    elif "," in number:

        parts = number.split(",")

        if (
            len(parts) == 2
            and len(parts[1]) <= 2
        ):

            number = (
                parts[0]
                + "."
                + parts[1]
            )

        else:

            number = number.replace(
                ",",
                "",
            )

    try:

        return float(
            number
        )

    except ValueError:

        return None


# ============================================================
# BRAND
# ============================================================

def _extract_brand(
    product: dict[str, Any],
) -> str | None:

    brand = product.get(
        "brand"
    )

    if isinstance(
        brand,
        str,
    ):

        return brand.strip()

    if isinstance(
        brand,
        dict,
    ):

        name = brand.get(
            "name"
        )

        if name:

            return str(
                name
            ).strip()

    return None


# ============================================================
# IMAGES
# ============================================================

def _is_thumbnail_image(
    url: str,
) -> bool:

    if not url:
        return True

    lower_url = url.lower()

    thumbnail_patterns = [
        "_20x20",
        "_30x30",
        "_40x40",
        "_48x48",
        "_50x50",
        "_60x60",
        "_70x70",
        "_80x80",
        "_100x100",
        "_120x120",
        "_150x150",
        "_160x160",
        "_180x180",
        "_200x200",
        "_220x220",
        "_240x240",
        "_300x300",

        "/20x20",
        "/30x30",
        "/40x40",
        "/48x48",
        "/50x50",
        "/60x60",
        "/70x70",
        "/80x80",
        "/100x100",
        "/120x120",
        "/150x150",
        "/160x160",
        "/180x180",
        "/200x200",
        "/220x220",
        "/240x240",
        "/300x300",
    ]

    if any(
        pattern in lower_url
        for pattern in thumbnail_patterns
    ):
        return True

    # URL içerisinde açıkça WxH boyutu varsa
    dimension_match = re.search(
        r"/([0-9]+)x([0-9]+)(?:/|\.|_|$)",
        lower_url,
    )

    if dimension_match:

        width = int(
            dimension_match.group(1)
        )

        height = int(
            dimension_match.group(2)
        )

        # Çok küçük görseller
        if width < 300 or height < 300:
            return True

        # Banner / aşırı ince görseller
        ratio = max(
            width,
            height,
        ) / max(
            1,
            min(width, height),
        )

        if ratio > 4:
            return True

    if lower_url.endswith(
        (
            ".svg",
            ".ico",
        )
    ):
        return True

    if "avatar" in lower_url:
        return True

    if "icon" in lower_url:
        return True

    return False
def _normalize_image_url(
    url: str,
) -> str:
    if not url:
        return ""

    url = str(url).strip()

    # Query parameters image identity'yi değiştirmiyor.
    url = url.split("?", 1)[0]

    # AliExpress thumbnail suffix
    url = re.sub(
        r"_[0-9]+x[0-9]+.*$",
        "",
        url,
        flags=re.IGNORECASE,
    )

    # AVIF/WebP gibi format suffix'leri
    url = re.sub(
        r"\.(avif|webp)$",
        "",
        url,
        flags=re.IGNORECASE,
    )

    return url.lower() 

def _extract_images(
    product: dict[str, Any],
    base_url: str,
) -> list[str]:

    raw_images = product.get(
        "image"
    )

    if not raw_images:
        return []

    if isinstance(
        raw_images,
        str,
    ):

        raw_images = [
            raw_images
        ]

    if not isinstance(
        raw_images,
        list,
    ):

        return []

    images = []

    for image in raw_images:

        if not isinstance(
            image,
            str,
        ):
            continue

        image = (
            image
            .replace(
                "\\/",
                "/",
            )
            .replace(
                "\\",
                "",
            )
        )

        image = urljoin(
            base_url,
            image,
        )

        if (
            _is_thumbnail_image(
                image
            )
        ):
            continue

        if image not in images:

            images.append(
                image
            )

    return images


def _extract_images_from_metadata(
    soup: BeautifulSoup,
    base_url: str,
) -> list[str]:

    images = []

    for meta in soup.find_all(
        "meta"
    ):

        property_name = (
            meta.get(
                "property"
            )
            or meta.get(
                "name"
            )
            or ""
        ).lower()

        if "image" not in property_name:
            continue

        content = meta.get(
            "content"
        )

        if not content:
            continue

        image = (
            str(content)
            .strip()
            .replace(
                "\\/",
                "/",
            )
            .replace(
                "\\",
                "",
            )
        )

        image = urljoin(
            base_url,
            image,
        )

        if (
            _is_thumbnail_image(
                image
            )
        ):
            continue

        if image not in images:

            images.append(
                image
            )

    return images


def _extract_images_from_page_data(
    data: Any,
    base_url: str,
) -> list[str]:

    images = []

    def walk(
        value: Any,
    ):

        if isinstance(
            value,
            dict,
        ):

            for key, item in value.items():

                key_lower = str(
                    key
                ).lower()

                if (
                    "image"
                    in key_lower
                    or "picture"
                    in key_lower
                    or "gallery"
                    in key_lower
                    or "skuimage"
                    in key_lower
                ):

                    _collect_image_values(
                        item,
                        images,
                        base_url,
                    )

                if isinstance(
                    item,
                    (
                        dict,
                        list,
                    ),
                ):

                    walk(
                        item
                    )

        elif isinstance(
            value,
            list,
        ):

            for item in value:

                walk(
                    item
                )

    walk(
        data
    )

    return images


def _extract_images_from_raw_html(
    html: str,
    base_url: str,
) -> list[str]:

    images = []

    if not html:
        return images

    patterns = [
        r'https?://ae-pic-a1\.aliexpress-media\.com/[^"\'\\\s<]+',
        r'https?://ae-pic-a1\.alicdn\.com/[^"\'\\\s<]+',
        r'https?://ae01\.alicdn\.com/[^"\'\\\s<]+',
    ]

    for pattern in patterns:

        matches = re.findall(
            pattern,
            html,
            flags=re.IGNORECASE,
        )

        for image in matches:

            image = (
                image
                .replace(
                    "\\/",
                    "/",
                )
                .replace(
                    "\\u002F",
                    "/",
                )
                .replace(
                    "\\",
                    "",
                )
            )

            # HTML / JavaScript kalıntılarını temizle
            image = (
                image
                .replace(
                    "&quot;",
                    "",
                )
                .replace(
                    "&amp;",
                    "&",
                )
                .strip(
                    "\"'()[]{};,"
                )
            )

            image = urljoin(
                base_url,
                image,
            )

            if _is_thumbnail_image(
                image
            ):
                continue

            if image not in images:
                images.append(
                    image
                )

    return images


def _collect_image_values(
    value: Any,
    images: list[str],
    base_url: str,
):

    if isinstance(
        value,
        str,
    ):

        value = (
            value
            .strip()
            .replace(
                "\\/",
                "/",
            )
            .replace(
                "\\u002F",
                "/",
            )
            .replace(
                "\\",
                "",
            )
        )

        if (
            value.startswith(
                "http://"
            )
            or value.startswith(
                "https://"
            )
            or value.startswith(
                "//"
            )
        ):

            image = urljoin(
                base_url,
                value,
            )

            if (
                not _is_thumbnail_image(
                    image
                )
                and image not in images
            ):

                images.append(
                    image
                )

    elif isinstance(
        value,
        list,
    ):

        for item in value:

            _collect_image_values(
                item,
                images,
                base_url,
            )

    elif isinstance(
        value,
        dict,
    ):

        for item in value.values():

            _collect_image_values(
                item,
                images,
                base_url,
            )


# ============================================================
# TEXT
# ============================================================

def _clean_text(
    value: Any,
) -> str:

    if value is None:
        return ""

    value = str(
        value
    )

    value = re.sub(
        r"\s+",
        " ",
        value,
    )

    return value.strip()


def _clean_product_title(
    title: Any,
    url: str,
) -> str:

    title = _clean_text(
        title
    )

    if not title:
        return ""

    if "aliexpress" in url.lower():

        title = re.sub(
            r"\s*[-|]\s*AliExpress.*$",
            "",
            title,
            flags=re.IGNORECASE,
        )

        title = re.sub(
            r"\s*[-|]\s*AliExpress\s*\d+\s*$",
            "",
            title,
            flags=re.IGNORECASE,
        )

    # Ignore generic AliExpress error titles.
    invalid_titles = {
        "404",
        "404 page",
        "page not found",
        "aliexpress",
    }

    if title.lower().strip() in invalid_titles:
        return ""

    return title.strip()