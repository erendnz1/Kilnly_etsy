import re
from typing import Any
from urllib.parse import quote, urlparse, parse_qs, unquote

import requests
from bs4 import BeautifulSoup


USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/151.0.0.0 Safari/537.36"
)

REQUEST_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": (
        "text/html,application/xhtml+xml,"
        "application/xml;q=0.9,image/avif,"
        "image/webp,*/*;q=0.8"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive",
}


# ============================================================
# PUBLIC
# ============================================================

def find_suppliers(
    title: str,
    description: str | None = None,
    image_urls: list[str] | None = None,
) -> list[dict[str, Any]]:

    if not title or not title.strip():
        return []

    # --------------------------------------------------------
    # BUILD SEARCH QUERIES
    # --------------------------------------------------------

    queries = build_search_queries(
        title=title,
        description=description,
    )

    suppliers: list[dict[str, Any]] = []

    # --------------------------------------------------------
    # SEARCH
    # --------------------------------------------------------

    for query in queries:

        results: list[dict[str, Any]] = []

        # ----------------------------------------------------
        # 1. TRY ALIEXPRESS SEARCH
        # ----------------------------------------------------

        try:

            results = search_aliexpress(
                query
            )

        except Exception as error:

            print(
                "AliExpress direct search error:",
                repr(error),
            )

        # ----------------------------------------------------
        # 2. FALLBACK SEARCH ENGINE
        # ----------------------------------------------------

        if not results:

            try:

                print(
                    "Using search engine fallback for:",
                    query,
                )

                results = search_aliexpress_via_search_engine(
                    query
                )

            except Exception as error:

                print(
                    "Search engine supplier error:",
                    repr(error),
                )

                # ----------------------------------------------------
        # ADD + ENRICH RESULTS
        # ----------------------------------------------------

        for result in results:

            result["search_query"] = query

            # AliExpress ürün sayfası anti-bot nedeniyle
            # doğrudan scrape edilmiyor. Arama sonucundan
            # gelen aday ürünü olduğu gibi kullanıyoruz.
            suppliers.append(
                result
            )
    # --------------------------------------------------------
    # DEDUPLICATE
    # --------------------------------------------------------

    suppliers = deduplicate_suppliers(
        suppliers
    )

    # --------------------------------------------------------
    # RANK
    # --------------------------------------------------------

    source_context = f"{title} {description or ''}".strip()

    suppliers = rank_suppliers(
    suppliers=suppliers,
    original_title=source_context,
)

    suppliers = filter_relevant_suppliers(
    suppliers=suppliers,
    original_title=source_context,
    minimum_score=18,
)

    # --------------------------------------------------------
    # RETURN TOP 10
    # --------------------------------------------------------

    return suppliers[:10]


# ============================================================
# SEARCH QUERY GENERATION
# ============================================================


def _detect_product_family(text: str) -> str | None:
    text = (text or '').lower()
    families = {
        'pillow': {'pillow','pillowcase','cushion','cushion cover','throw pillow','pillow cover','yastık','yastık kılıfı','kırlent','kırlent kılıfı'},
        'tshirt': {'t-shirt','tshirt','tee','shirt','tişört'},
        'tote_bag': {'tote bag','canvas bag','shopping bag','bez çanta'},
        'mug': {'mug','coffee mug','cup','kupa','bardak'},
        'phone_case': {'phone case','iphone case','phone cover','telefon kılıfı'},
        'necklace': {'necklace','pendant','kolye','kolye ucu'},
        'bracelet': {'bracelet','bileklik'},
    }
    for family, variants in families.items():
        for variant in variants:
            if re.search(rf'\b{re.escape(variant)}\b', text, flags=re.IGNORECASE):
                return family
    return None


def _is_customizable_product(text: str) -> bool:
    text = (text or '').lower()
    return bool(re.search(
        r'\b(personalized|personalised|custom|customized|customised|personalizable|name|initial|monogram|photo|custom print|photo print|kişiye özel|kişiselleştir|kişiselleştiril|isim|harf|fotoğraf|özelleştir)\b',
        text, flags=re.IGNORECASE,
    ))


def _supplier_intent_queries(title: str, description: str) -> list[str]:
    combined = f'{title} {description}'.strip().lower()
    if not _is_customizable_product(combined):
        return []
    family = _detect_product_family(combined)
    query_map = {
        'pillow': ['blank pillow cover','blank cushion cover','custom pillow cover','sublimation pillowcase'],
        'tshirt': ['blank t shirt','plain t shirt','custom t shirt','sublimation t shirt'],
        'tote_bag': ['blank canvas tote bag','plain tote bag','custom tote bag','sublimation tote bag'],
        'mug': ['blank mug','plain ceramic mug','custom mug','sublimation mug'],
        'phone_case': ['blank phone case','plain phone case','custom phone case','printable phone case'],
        'necklace': ['blank necklace','custom necklace','personalized necklace base','name pendant necklace'],
        'bracelet': ['blank bracelet','custom bracelet','personalized bracelet base'],
    }
    if family in query_map:
        return query_map[family]
    words = re.findall(r'[\w]+(?:[.\'-][\w]+)*', title.lower(), flags=re.UNICODE)
    ignored = {'personalized','personalised','custom','customized','customised','personalizable','name','initial','monogram','photo','etsy'}
    base = [w for w in words if w not in ignored and len(w)>=3]
    if base:
        b=' '.join(base[:4]); return [f'blank {b}',f'custom {b}',f'personalized {b}']
    return []

def build_search_queries(
    title: str,
    description: str | None = None,
) -> list[str]:
    """Build focused marketplace-friendly AliExpress queries.

    The source product determines the search terms. Generic presentation words
    are removed, while concrete product attributes such as material and shape
    are preserved when they are useful for supplier matching.
    """
    title = (title or "").strip()
    description = (description or "").strip()

    if not title:
        return []

    stop_words = {
        "the", "and", "for", "with", "from", "this", "that", "new",
        "best", "sale", "etsy", "shop", "item", "product", "gift",
        "gifts", "shipping", "free", "custom", "personalized",
        "personalised", "made", "use", "used", "perfect", "ideal",
        "home", "decor", "decoration", "aesthetic", "style", "modern",
        "minimalist", "minimal", "mid", "century", "japandi",
        "sky", "blue", "handmade", "eco", "friendly",
        "bir", "ve", "ile", "için", "bu", "ürün", "hediye",
        "özel", "yeni", "satış", "kargo",
    }

    def words(text: str) -> list[str]:
        found = re.findall(
            r"[\w]+(?:[.'-][\w]+)*",
            text.lower(),
            flags=re.UNICODE,
        )

        result: list[str] = []

        for word in found:
            word = word.strip(".-'")

            if len(word) < 3 or word in stop_words:
                continue

            if word not in result:
                result.append(word)

        return result

    title_words = words(title)
    desc_words = words(description)

    combined_lower = f"{title} {description}".lower()

    queries: list[str] = []

    supplier_intent_queries = _supplier_intent_queries(title, description)
    if supplier_intent_queries:
        queries.extend(supplier_intent_queries)

    # --------------------------------------------------------
    # CONCRETE ATTRIBUTES
    # --------------------------------------------------------

    attribute_words: list[str] = []

    attribute_aliases = {
        "wavy": {
            "wavy",
            "wave",
            "ripple",
            "scallop",
            "dalgalı",
            "dalga",
        },
        "ceramic": {
            "ceramic",
            "seramik",
            "clay",
            "kil",
        },
        "wood": {
            "wood",
            "wooden",
            "ahşap",
            "tahta",
        },
        "metal": {
            "metal",
            "iron",
            "steel",
            "metallic",
            "demir",
            "çelik",
        },
        "glass": {
            "glass",
            "cam",
        },
        "stone": {
            "stone",
            "marble",
            "taş",
            "mermer",
        },
    }

    raw_words = set(title_words + desc_words)

    for canonical, variants in attribute_aliases.items():
        if raw_words & variants:
            attribute_words.append(canonical)

    # --------------------------------------------------------
    # INCENSE PRODUCT
    # --------------------------------------------------------

    incense_source = bool(
        re.search(
            r"\b(incense|joss|tütsü|tütsülük)\b",
            combined_lower,
            flags=re.IGNORECASE,
        )
    )

    has_blue = bool(
        re.search(
            r"\b(blue|navy|sky blue|mavi|lacivert)\b",
            combined_lower,
            flags=re.IGNORECASE,
        )
    )

    if incense_source and not supplier_intent_queries:
        if "wavy" in attribute_words and "ceramic" in attribute_words:
            queries.extend([
                "wavy ceramic incense holder",
                "ceramic wavy incense holder",
            ])
        elif "wavy" in attribute_words:
            queries.append("wavy ceramic incense holder")
        elif "ceramic" in attribute_words:
            queries.extend([
                "ceramic incense holder",
                "ceramic incense burner",
            ])
        else:
            queries.extend([
                "incense holder",
                "incense burner",
            ])

        if has_blue:
            queries.insert(0, "blue ceramic wavy incense holder")

        # General query en sona bırakılıyor.
        queries.append("incense holder")
    # --------------------------------------------------------
    # GENERIC PRODUCT
    # --------------------------------------------------------

    elif not supplier_intent_queries:

        if title_words:
            queries.append(
                " ".join(title_words[:5])
            )

        extras = [
            word
            for word in desc_words
            if word not in title_words
        ]

        if title_words and extras:
            queries.append(
                " ".join(
                    (
                        title_words[:4]
                        + extras[:3]
                    )[:7]
                )
            )

        if len(title_words) >= 2:
            queries.append(
                " ".join(title_words[:3])
            )

    # --------------------------------------------------------
    # DEDUPLICATE
    # --------------------------------------------------------

    unique: list[str] = []
    seen: set[str] = set()

    for query in queries:

        query = re.sub(
            r"\s+",
            " ",
            query,
        ).strip()

        key = query.lower()

        if query and key not in seen:
            seen.add(key)
            unique.append(query)

    return unique[:4]


# ============================================================
# SEARCH ENGINE FALLBACK
# ============================================================
# ============================================================
# ALIEXPRESS PRODUCT DETAIL
# ============================================================

def enrich_aliexpress_product(
    supplier: dict[str, Any],
) -> dict[str, Any]:
    """
    AliExpress ürün detay sayfaları x5sec / punish anti-bot
    korumasına takılabildiği için bu serviste doğrudan ürün
    sayfası scraping'i kullanılmıyor.

    Fonksiyon geriye dönük uyumluluk için tutuluyor.
    İleride resmi/API tabanlı ürün detay kaynağı eklenebilir.
    """
    return supplier


def clean_supplier_title(
    title: str,
) -> str | None:

    if not title:
        return None

    title = re.sub(
        r"\s+",
        " ",
        title,
    ).strip()

    # AliExpress arayüz metinlerini temizle
    patterns = [
        r"\s+Ön izlemeyi görüntüle.*$",
        r"\s+Benzer ürünler.*$",
        r"\s+View preview.*$",
        r"\s+Similar items.*$",
    ]

    for pattern in patterns:

        title = re.sub(
            pattern,
            "",
            title,
            flags=re.IGNORECASE,
        )

    # Fiyatın title içine karıştığı durumlarda
    # fiyat sonrasını mümkün olduğunca temizle.
    title = re.sub(
        r"\s+\d[\d\s.,]*\s*(?:TL|TRY|USD|\$|€|EUR)\b.*$",
        "",
        title,
        flags=re.IGNORECASE,
    )

    return title.strip() or None


def parse_float(
    value: Any,
) -> float | None:

    if value is None:
        return None

    try:
        value = str(value).strip()

        match = re.search(
            r"\d+(?:[.,]\d+)?",
            value,
        )

        if not match:
            return None

        return float(
            match.group(0).replace(
                ",",
                ".",
            )
        )

    except (
        ValueError,
        TypeError,
    ):
        return None


def parse_price(
    value: Any,
) -> float | None:

    if value is None:
        return None

    try:

        text = str(value).strip()

        text = re.sub(
            r"[^\d.,]",
            "",
            text,
        )

        if not text:
            return None

        # 12.49
        if (
            "." in text
            and "," not in text
        ):
            return float(text)

        # 12,49
        if (
            "," in text
            and "." not in text
        ):
            return float(
                text.replace(
                    ",",
                    ".",
                )
            )

        # 1.234,56
        if text.rfind(",") > text.rfind("."):

            return float(
                text.replace(
                    ".",
                    "",
                ).replace(
                    ",",
                    ".",
                )
            )

        # 1,234.56
        return float(
            text.replace(
                ",",
                "",
            )
        )

    except (
        ValueError,
        TypeError,
    ):
        return None


def parse_price_from_text(
    text: str,
) -> tuple[float | None, str | None]:

    if not text:
        return None, None

    patterns = [

        # Türkçe
        (
            r"(\d[\d\s.,]*)\s*(TL|TRY)\b",
            "TRY",
        ),

        # USD
        (
            r"\$\s*(\d[\d.,]*)",
            "USD",
        ),

        (
            r"(\d[\d.,]*)\s*(USD)\b",
            "USD",
        ),

        # EUR
        (
            r"€\s*(\d[\d.,]*)",
            "EUR",
        ),

        (
            r"(\d[\d.,]*)\s*(EUR)\b",
            "EUR",
        ),
    ]

    for pattern, currency in patterns:

        match = re.search(
            pattern,
            text,
            re.IGNORECASE,
        )

        if not match:
            continue

        raw_price = match.group(1)

        price = parse_price(
            raw_price
        )

        if price is not None:
            return price, currency

    return None, None


def parse_integer(
    value: Any,
) -> int | None:

    if value is None:
        return None

    try:

        text = str(value)

        text = re.sub(
            r"[^\d]",
            "",
            text,
        )

        if not text:
            return None

        return int(text)

    except (
        ValueError,
        TypeError,
    ):
        return None

def search_aliexpress(
    query: str,
) -> list[dict[str, Any]]:
    encoded_query = quote(query, safe="")

    url = (
        "https://www.aliexpress.com/w/wholesale-"
        f"{encoded_query}.html"
    )

    headers = {
        **REQUEST_HEADERS,
        "Referer": "https://www.aliexpress.com/",
    }

    response = requests.get(
        url,
        headers=headers,
        timeout=20,
        allow_redirects=True,
    )

    print("ALIEXPRESS STATUS:", response.status_code)
    print("ALIEXPRESS FINAL URL:", response.url)
    print("ALIEXPRESS HTML LENGTH:", len(response.text))

    if not response.ok:
        return []

    if _is_bot_protection_page(response.text):
        print("AliExpress direct search blocked.")
        return []

    return parse_aliexpress_results(
        response.text,
        response.url,
    )
def search_aliexpress_via_search_engine(
    query: str,
) -> list[dict[str, Any]]:
    """Search AliExpress through public search engines.

    AliExpress search pages can be blocked by anti-bot protection, so the
    supplier finder uses search engines as a fallback. Multiple engines are
    tried because one engine may return weak/empty results.
    """
    queries = [
        f'site:aliexpress.com/item/ "{query}"',
        f'site:aliexpress.com/item/ {query}',
    ]

    all_results: list[dict[str, Any]] = []

    for search_query in queries:
        encoded_query = quote(search_query, safe="")

        # --------------------------------------------------------
        # BING
        # --------------------------------------------------------
        try:
            bing_url = f"https://www.bing.com/search?q={encoded_query}"
            response = requests.get(
                bing_url,
                headers={**REQUEST_HEADERS, "Referer": "https://www.bing.com/"},
                timeout=20,
                allow_redirects=True,
            )
            print("BING SEARCH STATUS:", response.status_code)
            if response.ok:
                all_results.extend(parse_search_engine_results(response.text))
        except Exception as error:
            print("Bing supplier search error:", repr(error))

        # --------------------------------------------------------
        # GOOGLE
        # --------------------------------------------------------
        try:
            google_url = f"https://www.google.com/search?q={encoded_query}&num=10"
            response = requests.get(
                google_url,
                headers={**REQUEST_HEADERS, "Referer": "https://www.google.com/"},
                timeout=20,
                allow_redirects=True,
            )
            print("GOOGLE SEARCH STATUS:", response.status_code)
            if response.ok:
                all_results.extend(parse_google_search_results(response.text))
        except Exception as error:
            print("Google supplier search error:", repr(error))

        # A useful batch is enough; otherwise continue with the next query.
        if len(all_results) >= 20:
            break

    # Deduplicate by product URL.
    unique: dict[str, dict[str, Any]] = {}
    for result in all_results:
        url = result.get("url")
        if url and url not in unique:
            unique[url] = result

    print("SEARCH ENGINE SUPPLIERS FOUND:", len(unique))
    return list(unique.values())[:30]


def parse_google_search_results(html: str) -> list[dict[str, Any]]:
    """Parse Google's normal organic result cards for AliExpress product URLs."""
    soup = BeautifulSoup(html, "html.parser")
    results: list[dict[str, Any]] = []

    for block in soup.select("div.MjjYud, div.g"):
        anchor = block.find("a", href=True)
        heading = block.find("h3")
        if not anchor or not heading:
            continue

        product_url = _extract_aliexpress_url(anchor.get("href", ""))
        if not product_url:
            continue

        title = clean_supplier_title(heading.get_text(" ", strip=True))
        snippet_node = block.select_one("div.VwiC3b, div[data-sncf], span.aCOpRe")
        snippet = snippet_node.get_text(" ", strip=True) if snippet_node else None

        if any(item["url"] == product_url for item in results):
            continue

        results.append({
            "title": title,
            "url": product_url,
            "image_url": None,
            "description": snippet,
            "price": None,
            "currency": None,
            "sales": None,
            "rating": None,
        })

        if len(results) >= 20:
            break

    return results


# ============================================================
# SEARCH ENGINE PARSER
# ============================================================

def parse_search_engine_results(
    html: str,
) -> list[dict[str, Any]]:

    soup = BeautifulSoup(
        html,
        "html.parser",
    )

    results: list[dict[str, Any]] = []

    def add_result(
        product_url: str,
        title: str | None = None,
        image_url: str | None = None,
        description: str | None = None,
    ):

        if not product_url:
            return

        product_url = _clean_url(
            unquote(product_url)
        )

        if not product_url:
            return

        if any(
            item["url"] == product_url
            for item in results
        ):
            return

        results.append(
            {
                "title": title or None,
                "url": product_url,
                "image_url": image_url,
                "description": description,
                "price": None,
                "currency": None,
                "sales": None,
                "rating": None,
            }
        )

    # ========================================================
    # 1. BING RESULT BLOCKS
    # ========================================================
    # Bing normally stores the result URL in an anchor and the actual result
    # title in an h2. Reading both together gives us a useful product title
    # for relevance ranking instead of relying on anchor text alone.
    for block in soup.select("li.b_algo"):
        anchor = block.find("a", href=True)
        if not anchor:
            continue

        product_url = _extract_aliexpress_url(anchor.get("href", ""))
        if not product_url:
            continue

        heading = block.find("h2")
        title = clean_supplier_title(
            heading.get_text(" ", strip=True)
            if heading
            else None
        )

        image_url = None
        image = block.find("img")
        if image:
            image_url = _clean_image_url(
                image.get("src")
                or image.get("data-src")
                or image.get("data-lazy-src")
                or ""
            )

        snippet_node = block.select_one("div.b_caption p")
        snippet = snippet_node.get_text(" ", strip=True) if snippet_node else None

        add_result(
            product_url=product_url,
            title=title,
            image_url=image_url,
            description=snippet,
        )

        if len(results) >= 20:
            break

    # ========================================================
    # 2. NORMAL LINKS
    # ========================================================

    for anchor in soup.find_all("a"):

        href = anchor.get("href")

        if not href:
            continue

        # ----------------------------------------------------
        # Direct / encoded AliExpress URL
        # ----------------------------------------------------

        product_url = _extract_aliexpress_url(
            href
        )

        if not product_url:

            # HTML içindeki herhangi bir AliExpress
            # product URL'sini ara
            decoded_href = unquote(
                href
            )

            match = re.search(
                r'https?://(?:www\.)?aliexpress\.[a-z.]+/item/[0-9]+\.html',
                decoded_href,
                re.IGNORECASE,
            )

            if match:
                product_url = match.group(0)

        if not product_url:
            continue

        title = anchor.get(
            "title"
        )

        if not title:
            anchor_text = anchor.get_text(
                " ",
                strip=True,
            )

            if 10 <= len(anchor_text) <= 300:
                title = clean_supplier_title(
                    anchor_text
                )

        image_url = None

        image = anchor.find("img")

        if image:

            image_url = (
                image.get("src")
                or image.get("data-src")
                or image.get("data-lazy-src")
            )

            if image_url:
                image_url = _clean_image_url(
                    image_url
                )

        add_result(
            product_url=product_url,
            title=title,
            image_url=image_url,
        )

        if len(results) >= 20:
            break

    # ========================================================
    # 2. DECODED HTML SCAN
    # ========================================================

    if len(results) < 20:

        decoded_html = html

        # Birkaç kez decode et
        for _ in range(3):

            new_html = unquote(
                decoded_html
            )

            if new_html == decoded_html:
                break

            decoded_html = new_html

        patterns = [

            r'https?://(?:www\.)?aliexpress\.[a-z.]+/item/[0-9]+\.html',

            r'https?:\\/\\/(?:www\.)?aliexpress\.[a-z.]+\\/item\\/[0-9]+\.html',

        ]

        for pattern in patterns:

            matches = re.findall(
                pattern,
                decoded_html,
                re.IGNORECASE,
            )

            for match in matches:

                product_url = (
                    match
                    .replace("\\/", "/")
                )

                add_result(
                    product_url=product_url
                )

                if len(results) >= 20:
                    break

            if len(results) >= 20:
                break

    # ========================================================
    # 3. RAW ALIEXPRESS PRODUCT IDS
    # ========================================================

    if len(results) < 20:

        # HTML içerisinde AliExpress URL'si
        # tamamen encode edilmiş olsa bile ID'yi yakala.
        id_patterns = [

            r'aliexpress\.[a-z.]+(?:\\?/|%2F|/)+item(?:\\?/|%2F|/)+([0-9]+)',

            r'/item/([0-9]+)\.html',

            r'%2Fitem%2F([0-9]+)%2Ehtml',

        ]

        for pattern in id_patterns:

            matches = re.findall(
                pattern,
                decoded_html,
                re.IGNORECASE,
            )

            for product_id in matches:

                product_url = (
                    f"https://www.aliexpress.com/item/"
                    f"{product_id}.html"
                )

                add_result(
                    product_url=product_url
                )

                if len(results) >= 20:
                    break

            if len(results) >= 20:
                break

    # ========================================================
    # DEBUG
    # ========================================================

    print(
        "SEARCH ENGINE PRODUCTS FOUND:",
        len(results),
    )

    for item in results[:10]:

        print(
            "SUPPLIER URL:",
            item["url"],
        )

    return results
def _extract_aliexpress_url(
    href: str,
) -> str | None:

    if not href:
        return None

    candidate = href.strip()

    # ========================================================
    # DECODE
    # ========================================================

    for _ in range(5):

        candidate = (
            candidate
            .replace("\\/", "/")
            .replace("\\u002F", "/")
        )

        decoded = unquote(
            candidate
        )

        if decoded == candidate:
            break

        candidate = decoded

    # ========================================================
    # DIRECT ALIEXPRESS URL
    # ========================================================

    match = re.search(
        r'https?://(?:www\.)?aliexpress\.[a-z.]+/item/[0-9]+\.html',
        candidate,
        re.IGNORECASE,
    )

    if match:

        return _clean_url(
            match.group(0)
        )

    # ========================================================
    # ALIEXPRESS URL INSIDE REDIRECT
    # ========================================================

    match = re.search(
        r'aliexpress\.[a-z.]+/item/[0-9]+\.html',
        candidate,
        re.IGNORECASE,
    )

    if match:

        return _clean_url(
            "https://www."
            + match.group(0)
        )

    # ========================================================
    # QUERY PARAMETERS
    # ========================================================

    try:

        parsed = urlparse(
            candidate
        )

        params = parse_qs(
            parsed.query
        )

        for key in (
            "u",
            "url",
            "q",
        ):

            for value in params.get(
                key,
                [],
            ):

                decoded_value = value

                for _ in range(5):

                    new_value = unquote(
                        decoded_value
                    )

                    if new_value == decoded_value:
                        break

                    decoded_value = new_value

                match = re.search(
                    r'https?://(?:www\.)?aliexpress\.[a-z.]+/item/[0-9]+\.html',
                    decoded_value,
                    re.IGNORECASE,
                )

                if match:

                    return _clean_url(
                        match.group(0)
                    )

    except Exception:
        pass

    # ========================================================
    # PRODUCT ID FALLBACK
    # ========================================================

    match = re.search(
        r'aliexpress\.[a-z.]+.*?/item/([0-9]+)',
        candidate,
        re.IGNORECASE,
    )

    if match:

        return (
            "https://www.aliexpress.com/item/"
            f"{match.group(1)}.html"
        )

    return None


# ============================================================
# BOT PROTECTION DETECTION
# ============================================================

def _is_bot_protection_page(
    html: str,
) -> bool:

    if not html:
        return False

    lowered = html.lower()

    # Gerçek AliExpress blok sayfasını
    # daha güçlü sinyallerle tespit et.
    strong_protection_terms = [
        "_____tmd_____",
        "/punish",
        "x5sec",
        "access denied",
        "security verification",
    ]

    # Tek başına "robot" veya "captcha" kelimesi
    # yeterli değildir. AliExpress'in normal HTML/JS
    # içerisinde bu kelimeler bulunabilir.
    strong_matches = sum(
        1
        for term in strong_protection_terms
        if term in lowered
    )

    return strong_matches >= 2
# ============================================================
# ALIEXPRESS PARSER
# ============================================================

def parse_aliexpress_results(
    html: str,
    base_url: str,
) -> list[dict[str, Any]]:

    soup = BeautifulSoup(
        html,
        "html.parser",
    )

    results: list[dict[str, Any]] = []

    # ========================================================
    # HELPER
    # ========================================================

    def add_product(
        product_url: str,
        title: str | None = None,
        image_url: str | None = None,
    ):

        product_url = _clean_url(
            unquote(product_url),
            base_url=base_url,
        )

        if not product_url:
            return

        if any(
            item["url"] == product_url
            for item in results
        ):
            return

        results.append(
            {
                "title": title.strip()
                if title
                else None,

                "url": product_url,

                "image_url": image_url,

                "price": None,

                "currency": None,

                "sales": None,

                "rating": None,
            }
        )

    # ========================================================
    # 1. BING RESULT BLOCKS
    # ========================================================
    # Bing normally stores the result URL in an anchor and the actual result
    # title in an h2. Reading both together gives us a useful product title
    # for relevance ranking instead of relying on anchor text alone.
    for block in soup.select("li.b_algo"):
        anchor = block.find("a", href=True)
        if not anchor:
            continue

        product_url = _extract_aliexpress_url(anchor.get("href", ""))
        if not product_url:
            continue

        heading = block.find("h2")
        title = clean_supplier_title(
            heading.get_text(" ", strip=True)
            if heading
            else None
        )

        image_url = None
        image = block.find("img")
        if image:
            image_url = _clean_image_url(
                image.get("src")
                or image.get("data-src")
                or image.get("data-lazy-src")
                or ""
            )

        add_product(
            product_url=product_url,
            title=title,
            image_url=image_url,
        )

        if len(results) >= 20:
            break

    # ========================================================
    # 2. NORMAL LINKS
    # ========================================================

    for anchor in soup.find_all("a"):

        href = anchor.get("href")

        if not href:
            continue

        product_url = _extract_aliexpress_url(
            href
        )

        if not product_url:
            continue

        title = anchor.get("title")

        if title:
            title = clean_supplier_title(title)

        # Anchor metni çok uzunsa AliExpress'in UI metnini
        # ürün başlığı sanma.
        if not title:
            anchor_text = anchor.get_text(
                " ",
                strip=True,
            )

            if 10 <= len(anchor_text) <= 300:
                title = clean_supplier_title(
                    anchor_text
                )

        image_url = None

        image = anchor.find("img")

        if image:

            image_url = (
                image.get("src")
                or image.get("data-src")
                or image.get("data-lazy-src")
            )

            if image_url:
                image_url = _clean_image_url(
                    image_url
                )

        add_product(
            product_url=product_url,
            title=title,
            image_url=image_url,
        )

        if len(results) >= 30:
            return results

    # ========================================================
    # 2. SCRIPT / JSON DATA
    # ========================================================

    decoded_html = html

    for _ in range(5):

        new_html = unquote(
            decoded_html
        )

        if new_html == decoded_html:
            break

        decoded_html = new_html

    # ========================================================
    # 3. FIND PRODUCT URLs
    # ========================================================

    url_patterns = [

        r'https?://(?:www\.)?aliexpress\.[a-z.]+/item/[0-9]+\.html',

        r'https?:\\/\\/(?:www\.)?aliexpress\.[a-z.]+\\/item\\/[0-9]+\.html',

        r'aliexpress\.[a-z.]+/item/[0-9]+\.html',

        r'aliexpress\.[a-z.]+\\/item\\/[0-9]+\.html',

    ]

    for pattern in url_patterns:

        matches = re.findall(
            pattern,
            decoded_html,
            re.IGNORECASE,
        )

        for match in matches:

            product_url = (
                match
                .replace(
                    "\\/",
                    "/",
                )
            )

            if not product_url.startswith(
                "http"
            ):

                product_url = (
                    "https://www."
                    + product_url
                )

            add_product(
                product_url=product_url
            )

            if len(results) >= 30:
                return results

    # ========================================================
    # 4. PRODUCT ID FALLBACK
    # ========================================================

    if len(results) < 10:

        id_patterns = [

            r'aliexpress\.[a-z.]+.{0,200}?/item/([0-9]+)',

            r'aliexpress\.[a-z.]+.{0,200}?\\/item\\/([0-9]+)',

            r'aliexpress\.[a-z.]+.{0,200}?%2Fitem%2F([0-9]+)',

        ]

        for pattern in id_patterns:

            matches = re.findall(
                pattern,
                decoded_html,
                re.IGNORECASE,
            )

            for product_id in matches:

                product_url = (
                    "https://www.aliexpress.com/item/"
                    f"{product_id}.html"
                )

                add_product(
                    product_url=product_url
                )

                if len(results) >= 30:
                    return results

    # ========================================================
    # 5. SCRIPT TAG PRODUCT DATA
    # ========================================================

    for script in soup.find_all("script"):

        content = script.string

        if not content:
            content = script.get_text()

        if not content:
            continue

        content = unquote(content)

        # Product URL + nearby title
        url_matches = re.finditer(
            r'https?://(?:www\.)?aliexpress\.[a-z.]+/item/[0-9]+\.html',
            content,
            re.IGNORECASE,
        )

        for match in url_matches:

            product_url = match.group(0)

            start = max(
                0,
                match.start() - 1000,
            )

            end = min(
                len(content),
                match.end() + 1000,
            )

            nearby = content[
                start:end
            ]

            title = None

            title_match = re.search(
                r'"title"\s*:\s*"([^"]{10,300})"',
                nearby,
                re.IGNORECASE,
            )

            if title_match:

                title = (
                    title_match
                    .group(1)
                    .replace(
                        "\\u0026",
                        "&",
                    )
                )

            add_product(
                product_url=product_url,
                title=title,
            )

            if len(results) >= 30:
                return results

    # ========================================================
    # DEBUG
    # ========================================================

    print(
        "ALIEXPRESS PRODUCTS FOUND:",
        len(results),
    )

    for item in results[:10]:

        print(
            "ALIEXPRESS PRODUCT:",
            item["url"],
        )

    return results

# ============================================================
# DEDUPLICATION
# ============================================================

def deduplicate_suppliers(
    suppliers: list[dict[str, Any]],
) -> list[dict[str, Any]]:

    unique: dict[
        str,
        dict[str, Any]
    ] = {}

    for supplier in suppliers:

        url = supplier.get(
            "url"
        )

        if not url:

            continue

        normalized = _clean_url(
            url
        )

        if not normalized:

            continue

        normalized = normalized.split(
            "?",
            1
        )[0]

        if normalized not in unique:

            supplier["url"] = normalized

            unique[normalized] = supplier

    return list(
        unique.values()
    )


# ============================================================
# RELEVANCE FILTER
# ============================================================

def filter_relevant_suppliers(
    suppliers: list[dict[str, Any]],
    original_title: str,
    minimum_score: int = 18,
) -> list[dict[str, Any]]:
    """Keep only suppliers that match the actual product identity and key attributes."""

    source = (original_title or "").lower()
    source_semantic = _semantic_tokens(source)
    source_family = _detect_product_family(source)
    source_is_customizable = _is_customizable_product(source)

    is_incense = bool(
        source_semantic
        & {"incense", "joss", "tütsü", "tütsülük"}
    )

    source_has_wavy = bool(
        source_semantic
        & {"wavy", "wave", "ripple", "scallop", "dalgalı", "dalga"}
    )

    source_has_ceramic = bool(
        source_semantic
        & {"ceramic", "seramik", "clay", "kil"}
    )

    source_has_blue = bool(
        re.search(
            r"\b(blue|navy|sky blue|mavi|lacivert)\b",
            source,
            flags=re.IGNORECASE,
        )
    )

    filtered: list[dict[str, Any]] = []

    negative_terms = {
        "mosquito", "repellent", "sivrisinek", "kovucu",
        "tea", "teapot", "çay", "demlik",
        "buddha", "statue", "heykel",
        "vase", "vazo",
        "lamp", "lantern", "lamba", "fener",
        "diffuser", "difüzör",
        "candle", "mum",
        "wax", "balmumu",
        "essential",
        "jewelry", "takı",
        "flower", "çiçek",
        "ashtray", "küllük",
    }

    for supplier in suppliers:
        score = int(supplier.get("match_score", 0) or 0)

        title = (supplier.get("title") or "").strip()
        description = (supplier.get("description") or "").strip()

        if not title:
            continue

        evidence_text = f"{title} {description}".lower()
        evidence_semantic = _semantic_tokens(evidence_text)
        evidence_tokens = set(_tokenize(evidence_text))

        if score < minimum_score:
            continue

        if source_family:
            family_terms = {
                "pillow": {"pillow", "pillowcase", "cushion", "yastık", "kırlent"},
                "tshirt": {"t-shirt", "tshirt", "tee", "shirt", "tişört"},
                "tote_bag": {"tote", "canvas", "bag", "bez", "çanta"},
                "mug": {"mug", "cup", "kupa", "bardak"},
                "phone_case": {"phone", "case", "cover", "iphone", "kılıf"},
                "necklace": {"necklace", "pendant", "kolye"},
                "bracelet": {"bracelet", "bileklik"},
            }
            if not evidence_semantic & family_terms.get(source_family, set()):
                continue

        # Clearly wrong product types are never accepted.
        if evidence_tokens & negative_terms:
            continue

        if is_incense and not source_is_customizable:
            has_incense = bool(
                evidence_semantic
                & {"incense", "joss", "tütsü", "tütsülük"}
            )

            has_holder = bool(
                evidence_semantic
                & {"holder", "burner", "brülör", "tutucu", "ashcatcher"}
            )

            # Product identity is mandatory.
            if not has_incense or not has_holder:
                continue

            # For this source, ceramic and wavy are key product attributes,
            # not optional bonuses.
            if source_has_ceramic and not (
                evidence_semantic & {"ceramic", "seramik", "clay", "kil"}
            ):
                continue

            if source_has_wavy and not (
                evidence_semantic
                & {"wavy", "wave", "ripple", "scallop", "dalgalı", "dalga"}
            ):
                continue

            # Blue is a strong attribute, but marketplace titles often omit color.
            # Do not hard-reject on missing blue; only reward it when present.
            if source_has_blue and re.search(
                r"\b(blue|navy|sky blue|mavi|lacivert)\b",
                evidence_text,
                flags=re.IGNORECASE,
            ):
                supplier["match_score"] = min(
                    100,
                    int(supplier.get("match_score", 0) or 0) + 8,
                )

        filtered.append(supplier)

    return filtered

# ============================================================
# RANKING
# ============================================================

def rank_suppliers(
    suppliers: list[dict[str, Any]],
    original_title: str,
) -> list[dict[str, Any]]:
    """Rank supplier candidates by product identity first, attributes second."""

    source_text = (
        original_title or ""
    ).lower()

    source_semantic = _semantic_tokens(
        source_text
    )
    source_family = _detect_product_family(source_text)
    source_is_customizable = _is_customizable_product(source_text)

    generic = {
        "the",
        "and",
        "for",
        "with",
        "from",
        "new",
        "best",
        "sale",
        "etsy",
        "shop",
        "item",
        "product",
        "gift",
        "gifts",
        "home",
        "decor",
        "decoration",
        "aesthetic",
        "style",
        "modern",
        "minimalist",
        "minimal",
        "mid",
        "century",
        "japandi",
        "handmade",
        "hand",
        "sculpted",
        "eco",
        "friendly",
        "sky",
        "blue",
        "beautiful",
        "small",
        "space",
        "scented",
    }

    concept_groups = {
        "pillow": {"pillow", "pillowcase", "cushion", "cover", "yastık", "kırlent"},
        "tshirt": {"t-shirt", "tshirt", "tee", "shirt", "tişört"},
        "tote_bag": {"tote", "canvas", "bag", "bez", "çanta"},
        "mug": {"mug", "cup", "kupa", "bardak"},
        "phone_case": {"phone", "case", "cover", "iphone", "kılıf"},
        "necklace": {"necklace", "pendant", "kolye"},
        "bracelet": {"bracelet", "bileklik"},
        "customizable": {"blank", "plain", "custom", "personalized", "personalised", "customizable", "customised", "sublimation", "printing", "printable"},
        "incense": {
            "incense",
            "joss",
            "tütsü",
            "tütsülük",
        },

        "holder": {
            "holder",
            "burner",
            "brülör",
            "tutucu",
            "ashcatcher",
        },

        "ceramic": {
            "ceramic",
            "seramik",
            "clay",
            "kil",
        },

        "wavy": {
            "wavy",
            "wave",
            "ripple",
            "scallop",
            "dalgalı",
            "dalga",
        },
        "blue": {
            "blue",
            "navy",
            "sky",
            "mavi",
            "lacivert",
        },
    }

    source_concepts: set[str] = set()

    for concept, variants in concept_groups.items():

        if (
            source_semantic
            & variants
        ):
            source_concepts.add(
                concept
            )

    for supplier in suppliers:

        title = (
            supplier.get("title")
            or ""
        )

        description = (
            supplier.get("description")
            or ""
        )

        evidence_text = (
            f"{title} {description}"
        ).lower()

        evidence_semantic = _semantic_tokens(
            evidence_text
        )

        query_semantic = _semantic_tokens(
            supplier.get(
                "search_query"
            )
            or ""
        )

        score = 0.0

        # ====================================================
        # SUPPLIER PRODUCT FAMILY
        # ====================================================

        if source_family:
            family_match = bool(
                evidence_semantic & concept_groups.get(source_family, set())
            )
            score += 45 if family_match else -40

        if source_is_customizable and (
            evidence_semantic & concept_groups["customizable"]
        ):
            score += 18

        # ====================================================
        # PRODUCT IDENTITY
        # ====================================================

        if "incense" in source_concepts:

            if (
                evidence_semantic
                & concept_groups["incense"]
            ):
                score += 35
            else:
                score -= 35

        if "holder" in source_concepts:

            if (
                evidence_semantic
                & concept_groups["holder"]
            ):
                score += 35
            else:
                score -= 30

        # ====================================================
        # MATERIAL
        # ====================================================

        if "ceramic" in source_concepts:

            if (
                evidence_semantic
                & concept_groups["ceramic"]
            ):
                score += 15

        # ====================================================
        # SHAPE
        # ====================================================

        if "wavy" in source_concepts:

            if (
                evidence_semantic
                & concept_groups["wavy"]
            ):
                score += 15

        # ====================================================
        # COLOR
        # ====================================================

        if "blue" in source_concepts:

            if (
                evidence_semantic
                & concept_groups["blue"]
            ):
                score += 8

        # ====================================================
        # EXTRA EXACT TERMS
        # ====================================================

        signal_words = {
            token
            for token in source_semantic
            if token not in generic
            and token not in {
                "incense",
                "joss",
                "tütsü",
                "tütsülük",

                "holder",
                "burner",
                "brülör",
                "tutucu",
                "ashcatcher",

                "ceramic",
                "seramik",
                "clay",
                "kil",

                "wavy",
                "wave",
                "ripple",
                "scallop",
                "dalgalı",
                "dalga",
            }
        }

        if signal_words:

            exact_overlap = len(
                signal_words
                & evidence_semantic
            )

            score += min(
                10,
                exact_overlap * 3,
            )

            query_overlap = len(
                signal_words
                & query_semantic
            )

            score += min(
                5,
                query_overlap * 2,
            )

        # ====================================================
        # WRONG PRODUCT PENALTY
        # ====================================================

        negative_terms = {
            "mosquito",
            "repellent",
            "sivrisinek",
            "kovucu",

            "tea",
            "teapot",
            "çay",
            "demlik",

            "buddha",
            "statue",
            "heykel",

            "vase",
            "vazo",

            "lamp",
            "lantern",
            "lamba",
            "fener",

            "diffuser",
            "difüzör",

            "candle",
            "mum",

            "wax",
            "balmumu",

            "essential",

            "jewelry",
            "takı",
        }

        negative_hits = (
            set(
                _tokenize(
                    evidence_text
                )
            )
            & negative_terms
        )

        score -= min(
            45,
            len(negative_hits) * 20,
        )

        supplier["match_score"] = max(
            0,
            min(
                100,
                int(
                    round(score)
                ),
            ),
        )

        final_score = supplier[
            "match_score"
        ]

        supplier[
            "supplier_confidence"
        ] = (
            "high"
            if final_score >= 70
            else "medium"
            if final_score >= 45
            else "low"
        )

    return sorted(
        suppliers,
        key=lambda item: item.get(
            "match_score",
            0,
        ),
        reverse=True,
    )

# ============================================================
# TOKENIZER
# ============================================================

def _tokenize(text: str) -> list[str]:
    return [
        word
        for word in re.findall(
            r"[\w]+(?:[.'-][\w]+)*",
            (text or "").lower(),
            flags=re.UNICODE,
        )
        if len(word) >= 3
    ]


def _semantic_tokens(
    text: str,
) -> set[str]:
    """Normalize meaningful marketplace product terms."""

    raw = set(
        _tokenize(text)
    )

    normalized = set(raw)

    aliases = {
        "pillow": {"pillow", "pillowcase", "cushion", "yastık", "kırlent"},
        "tshirt": {"t-shirt", "tshirt", "tee", "shirt", "tişört"},
        "tote_bag": {"tote", "canvas", "bag", "bez", "çanta"},
        "mug": {"mug", "cup", "kupa", "bardak"},
        "phone_case": {"phone", "case", "cover", "iphone", "kılıf"},
        "necklace": {"necklace", "pendant", "kolye"},
        "bracelet": {"bracelet", "bileklik"},
        "customizable": {"blank", "plain", "custom", "personalized", "personalised", "customizable", "customised", "sublimation", "printing", "printable"},
        "incense": {
            "incense",
            "joss",
            "tütsü",
            "tütsülük",
        },

        "holder": {
            "holder",
            "tutucu",
            "tütsülük",
            "brülör",
            "burner",
            "ashcatcher",
        },

        "burner": {
            "burner",
            "brülör",
        },

        "ceramic": {
            "ceramic",
            "seramik",
        },

        "clay": {
            "clay",
            "kil",
        },

        "wavy": {
            "wavy",
            "wave",
            "ripple",
            "scallop",
            "dalgalı",
            "dalga",
        },
        "blue": {
            "blue",
            "navy",
            "sky",
            "mavi",
            "lacivert",
        },
    }

    for canonical, variants in aliases.items():

        if raw & variants:

            normalized.add(
                canonical
            )

            normalized.update(
                variants
            )

    return normalized


# ============================================================
# URL CLEANING
# ============================================================

def _clean_url(
    url: str,
    base_url: str | None = None,
) -> str | None:

    if not url:

        return None

    url = url.strip()

    # --------------------------------------------------------
    # Escaped characters
    # --------------------------------------------------------

    url = url.replace(
        "\\u002F",
        "/",
    )

    url = url.replace(
        "\\/",
        "/",
    )

    url = url.replace(
        "\\",
        "",
    )

    url = url.strip(
        " \t\r\n\"'"
    )

    # --------------------------------------------------------
    # Protocol relative
    # --------------------------------------------------------

    if url.startswith(
        "//"
    ):

        url = (
            "https:"
            + url
        )

    # --------------------------------------------------------
    # Relative URL
    # --------------------------------------------------------

    elif (
        url.startswith("/")
        and base_url
    ):

        url = (
            base_url.rstrip("/")
            + url
        )

    # --------------------------------------------------------
    # Validate protocol
    # --------------------------------------------------------

    if not url.startswith(
        (
            "http://",
            "https://",
        )
    ):

        return None

    # --------------------------------------------------------
    # Decode HTML entities
    # --------------------------------------------------------

    url = (
        url.replace(
            "&amp;",
            "&",
        )
        .replace(
            "&quot;",
            '"',
        )
    )

    # --------------------------------------------------------
    # Only product URLs
    # --------------------------------------------------------

    if not re.search(
        r"aliexpress\.[a-z.]+/item/",
        url,
        re.IGNORECASE,
    ):

        return None

    # --------------------------------------------------------
    # Remove query
    # --------------------------------------------------------

    url = url.split(
        "?",
        1
    )[0]

    # --------------------------------------------------------
    # Remove fragment
    # --------------------------------------------------------

    url = url.split(
        "#",
        1
    )[0]

    # --------------------------------------------------------
    # Remove trailing slash
    # --------------------------------------------------------

    url = url.rstrip(
        "/"
    )

    return url


# ============================================================
# IMAGE URL CLEANING
# ============================================================

def _clean_image_url(
    url: str,
) -> str | None:

    if not url:

        return None

    url = url.strip()

    url = url.replace(
        "\\u002F",
        "/",
    )

    url = url.replace(
        "\\/",
        "/",
    )

    url = url.replace(
        "\\",
        "",
    )

    if url.startswith(
        "//"
    ):

        url = (
            "https:"
            + url
        )

    if not url.startswith(
        (
            "http://",
            "https://",
        )
    ):

        return None

    return url


# ============================================================
# DEBUG ALIEXPRESS PRODUCT PAGE
# ============================================================

def debug_aliexpress_product(
    product_url: str,
) -> dict[str, Any]:

    headers = {
        **REQUEST_HEADERS,
        "Referer": "https://www.aliexpress.com/",
    }

    result = {
        "url": product_url,
        "status": None,
        "final_url": None,
        "html_length": 0,
        "has_og_title": False,
        "has_og_image": False,
        "has_description": False,
        "has_product_json": False,
        "product_ids_found": 0,
        "sample_title": None,
        "sample_image": None,
        "page_title": None,
        "html_preview": None,
        "blocked": False,
    }

    try:
        response = requests.get(
            product_url,
            headers=headers,
            timeout=20,
            allow_redirects=True,
        )

        html = response.text

        result["status"] = response.status_code
        result["final_url"] = str(response.url)
        result["html_length"] = len(html)

        soup = BeautifulSoup(
            html,
            "html.parser",
        )

        # PAGE TITLE + HTML PREVIEW
        result["page_title"] = (
            soup.title.get_text(
                " ",
                strip=True,
            )
            if soup.title
            else None
        )

        # İlk 1000 karakteri debug amacıyla döndür.
        result["html_preview"] = html[:1000]

        # AliExpress ürün sayfası anti-bot / punish
        # sayfasına yönlendirilmişse bunu açıkça belirt.
        result["blocked"] = _is_bot_protection_page(
            html
        )

        # OG TITLE
        og_title = soup.find(
            "meta",
            attrs={"property": "og:title"},
        )

        if og_title:
            result["has_og_title"] = True
            result["sample_title"] = og_title.get(
                "content"
            )

        # OG IMAGE
        og_image = soup.find(
            "meta",
            attrs={"property": "og:image"},
        )

        if og_image:
            result["has_og_image"] = True
            result["sample_image"] = og_image.get(
                "content"
            )

        # DESCRIPTION
        description = soup.find(
            "meta",
            attrs={"property": "og:description"},
        )

        if not description:
            description = soup.find(
                "meta",
                attrs={"name": "description"},
            )

        result["has_description"] = (
            description is not None
        )

        # PRODUCT JSON
        for script in soup.find_all("script"):

            content = (
                script.string
                or script.get_text()
                or ""
            )

            lowered = content.lower()

            if any(
                key in lowered
                for key in [
                    "productid",
                    "product_id",
                    "sku",
                    "aliexpress",
                ]
            ):
                result["has_product_json"] = True
                break

        # PRODUCT IDS
        decoded_html = html

        for _ in range(5):

            decoded = unquote(decoded_html)

            if decoded == decoded_html:
                break

            decoded_html = decoded

        product_ids = set(
            re.findall(
                r"(?:/item/|%2Fitem%2F)(\d+)",
                decoded_html,
                re.IGNORECASE,
            )
        )

        result["product_ids_found"] = len(
            product_ids
        )

        print(
            "ALIEXPRESS DEBUG:",
            result,
        )

        return result

    except Exception as error:

        result["error"] = repr(error)

        print(
            "ALIEXPRESS DEBUG ERROR:",
            repr(error),
        )

        return result