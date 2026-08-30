import json
import re
from typing import Any
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright


USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/151.0.0.0 Safari/537.36"
)


# ============================================================
# MAIN
# ============================================================

def fetch_product_from_url(
    url: str,
) -> dict[str, Any]:

    url = (
        url
        .strip()
        .replace("\\", "")
    )

    if not url:
        raise ValueError(
            "Product URL cannot be empty."
        )

    if not re.match(
        r"^https?://",
        url,
        re.IGNORECASE,
    ):
        raise ValueError(
            "Invalid URL. URL must start with http:// or https://."
        )

    # ========================================================
    # FETCH WITH PLAYWRIGHT
    # ========================================================

    try:

        with sync_playwright() as p:

            browser = p.chromium.launch(
                headless=True,
            )

            context = browser.new_context(
                user_agent=USER_AGENT,
                viewport={
                    "width": 1440,
                    "height": 900,
                },
                locale="en-US",
                extra_http_headers={
                    "Accept-Language": (
                        "en-US,en;q=0.9,tr;q=0.8"
                    ),
                },
            )

            page = context.new_page()

            page.goto(
                url,
                wait_until="domcontentloaded",
                timeout=60000,
            )

            # Give AliExpress JavaScript time
            # to render product information.
            page.wait_for_timeout(
                5000
            )
            if "/punish" in page.url.lower():
              raise RuntimeError(
        "AliExpress bot protection page detected."
    )
            # Trigger lazy-loaded content/images.
            page.evaluate(
                """
                window.scrollTo(
                    0,
                    document.body.scrollHeight
                );
                """
            )

            page.wait_for_timeout(
                2000
            )

            # Scroll back to top.
            page.evaluate(
                """
                window.scrollTo(
                    0,
                    0
                );
                """
            )

            page.wait_for_timeout(
                1000
            )

            html = page.content()
            final_url = page.url

            context.close()
            browser.close()

    except Exception as error:

        raise RuntimeError(
            f"Could not fetch product page: {error}"
        ) from error

    if not html:
        raise RuntimeError(
            "AliExpress returned an empty page."
        )

    soup = BeautifulSoup(
        html,
        "html.parser",
    )

    # ========================================================
    # DATA SOURCES
    # ========================================================

    json_ld_product = (
        _extract_product_json_ld(
            soup
        )
    )

    page_data = (
        _extract_next_data(
            soup
        )
    )

    # ========================================================
    # TITLE
    # ========================================================

    title = _get_meta_content(
        soup,
        "og:title",
    )

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

    if (
        not title
        and json_ld_product
    ):

        title = (
            json_ld_product.get(
                "name"
            )
        )

    if not title:

        title_tag = soup.find(
            "title"
        )

        if title_tag:

            title = title_tag.get_text(
                strip=True
            )

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
            description
            .strip()
            .lower()
        )

        invalid_descriptions = {
            "smarter shopping, better living!",
            "aliexpress.com",
            "smarter shopping, better living! aliexpress.com",
        }

        if (
            normalized_description
            in invalid_descriptions
        ):

            description = None

    if (
        not description
        and json_ld_product
    ):

        description = (
            json_ld_product.get(
                "description"
            )
        )

    if not description:

        description = (
            _find_value_recursive(
                page_data,
                [
                    "description",
                    "productDescription",
                    "productDesc",
                    "detail",
                ],
            )
        )

    # ========================================================
    # PRICE
    # ========================================================

    price = None
    currency = None

    # 1. JSON-LD
    if json_ld_product:

        price, currency = (
            _extract_price(
                json_ld_product
            )
        )

    # 2. NEXT / PAGE DATA
    if price is None:

        price, currency = (
            _extract_price_recursive(
                page_data
            )
        )

    # 3. META
    if price is None:

        price, currency = (
            _extract_price_from_html(
                soup
            )
        )

    # 4. RAW HTML
    if price is None:

        price, currency = (
            _extract_price_from_raw_html(
                html
            )
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

    # JSON-LD
    if json_ld_product:

        images.extend(
            _extract_images(
                json_ld_product,
                final_url,
            )
        )

    # Metadata
    images.extend(
        _extract_images_from_metadata(
            soup,
            final_url,
        )
    )

    # Page data
    images.extend(
        _extract_images_from_page_data(
            page_data,
            final_url,
        )
    )

    # Raw HTML
    images.extend(
        _extract_images_from_raw_html(
            html,
            final_url,
        )
    )

    # ========================================================
    # IMAGE CLEANING
    # ========================================================

    unique_images: list[str] = []

    for image in images:

        if not image:
            continue

        image = str(
            image
        ).strip()

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

        if _is_thumbnail_image(
            image
        ):
            continue

        if image not in unique_images:

            unique_images.append(
                image
            )

    # ========================================================
    # FALLBACK IMAGES FROM IMG TAGS
    # ========================================================

    if not unique_images:

        for img in soup.find_all(
            "img"
        ):

            image_url = (
                img.get("src")
                or img.get("data-src")
                or img.get(
                    "data-original"
                )
                or img.get(
                    "data-lazy-src"
                )
            )

            if not image_url:
                continue

            image_url = (
                str(
                    image_url
                )
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

            if _is_thumbnail_image(
                image_url
            ):
                continue

            if (
                image_url
                not in unique_images
            ):

                unique_images.append(
                    image_url
                )

            if len(
                unique_images
            ) >= 15:
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

        description = (
            description[:10000]
        )

    # ========================================================
    # RETURN
    # ========================================================

    final_images = (
        unique_images[:15]
    )

    return {
        "url": final_url,
        "title": title,
        "description": description,
        "price": price,
        "currency": currency,
        "brand": brand,
        "images": final_images,
        "image_count": len(
            final_images
        ),
    }


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
        "_80x80.",
        "_50x50.",
        "_40x40.",
        "_60x60.",
        "_30x30.",
        "_70x70.",
        "/80x80.",
        "/50x50.",
        "/40x40.",
        "/60x60.",
    ]

    return any(
        pattern in lower_url
        for pattern in thumbnail_patterns
    )


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

        r'https?://ae-pic-a1\.aliexpress-media\.com/[^"\'\\\s]+',

        r'https?://ae-pic-a1\.alicdn\.com/[^"\'\\\s]+',

        r'https?://ae01\.alicdn\.com/[^"\'\\\s]+',
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