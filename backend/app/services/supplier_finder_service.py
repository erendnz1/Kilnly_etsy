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

    suppliers = rank_suppliers(
        suppliers=suppliers,
        original_title=title,
    )

    # --------------------------------------------------------
    # RETURN TOP 10
    # --------------------------------------------------------

    return suppliers[:10]


# ============================================================
# SEARCH QUERY GENERATION
# ============================================================

def build_search_queries(
    title: str,
    description: str | None = None,
) -> list[str]:

    text = (
        f"{title} {description or ''}"
    ).lower()

    stop_words = {
        "for",
        "with",
        "and",
        "the",
        "this",
        "that",
        "women",
        "woman",
        "men",
        "man",
        "new",
        "best",
        "hot",
        "sale",
        "fashion",
        "gift",
        "gifts",
        "etsy",
        "free",
        "shipping",
        "custom",
        "personalized",
        "personalised",
    }

    words = re.findall(
    r"[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*",
    text,
)

    keywords: list[str] = []

    for word in words:

        if len(word) < 3:
            continue

        if word in stop_words:
            continue

        if word not in keywords:
            keywords.append(word)

    keywords = keywords[:12]

    queries: list[str] = []

    # --------------------------------------------------------
    # MAIN QUERY
    # --------------------------------------------------------

    if len(keywords) >= 2:

        queries.append(
            " ".join(keywords[:6])
        )

    # --------------------------------------------------------
    # SHORT QUERY
    # --------------------------------------------------------

    if len(keywords) >= 3:

        queries.append(
            " ".join(keywords[:4])
        )

    # --------------------------------------------------------
    # PRODUCT-SPECIFIC QUERY
    # --------------------------------------------------------

    product_terms = _detect_product_terms(
        text
    )

    if product_terms:

        queries.append(
            " ".join(product_terms)
        )

    # --------------------------------------------------------
    # REMOVE DUPLICATES
    # --------------------------------------------------------

    unique_queries: list[str] = []

    for query in queries:

        query = query.strip()

        if not query:
            continue

        if query not in unique_queries:

            unique_queries.append(
                query
            )

    return unique_queries[:3]


# ============================================================
# PRODUCT TERM DETECTION
# ============================================================

def _detect_product_terms(
    text: str,
) -> list[str]:

    product_groups = [

        [
            "moissanite",
            "necklace",
            "silver",
        ],

        [
            "name",
            "necklace",
            "personalized",
        ],

        [
            "ring",
            "zirconia",
        ],

        [
            "earrings",
            "jewelry",
        ],

        [
            "bracelet",
            "jewelry",
        ],

        [
            "backpack",
            "personalized",
        ],
    ]

    for group in product_groups:

        if all(
            term in text
            for term in group
        ):
            return group

    return []


# ============================================================
# ALIEXPRESS DIRECT SEARCH
# ============================================================

def search_aliexpress(
    query: str,
) -> list[dict[str, Any]]:

    encoded_query = quote(
        query,
        safe="",
    )

    url = (
        "https://www.aliexpress.com/w/wholesale-"
        f"{encoded_query}.html"
    )

    headers = {
        **REQUEST_HEADERS,
        "Referer": (
            "https://www.aliexpress.com/"
        ),
    }

    response = requests.get(
        url,
        headers=headers,
        timeout=20,
        allow_redirects=True,
    )

    print(
        "ALIEXPRESS STATUS:",
        response.status_code,
    )

    print(
        "ALIEXPRESS FINAL URL:",
        response.url,
    )

    print(
        "ALIEXPRESS HTML LENGTH:",
        len(response.text),
    )

    if not response.ok:

        return []

    # --------------------------------------------------------
    # BOT PROTECTION
    # --------------------------------------------------------

    if _is_bot_protection_page(
        response.text
    ):

        print(
            "AliExpress direct search blocked."
        )

        return []

    # --------------------------------------------------------
    # PARSE
    # --------------------------------------------------------

    return parse_aliexpress_results(
        response.text,
        response.url,
    )


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
def search_aliexpress_via_search_engine(
    query: str,
) -> list[dict[str, Any]]:

    search_query = (
        f"site:aliexpress.com/item/ {query}"
    )

    encoded_query = quote(
        search_query,
        safe="",
    )

    # --------------------------------------------------------
    # BING
    # --------------------------------------------------------

    url = (
        "https://www.bing.com/search"
        f"?q={encoded_query}"
    )

    headers = {
        **REQUEST_HEADERS,
        "Referer": "https://www.bing.com/",
    }

    response = requests.get(
        url,
        headers=headers,
        timeout=20,
        allow_redirects=True,
    )

    print(
        "SEARCH ENGINE STATUS:",
        response.status_code,
    )

    print(
        "SEARCH ENGINE URL:",
        response.url,
    )

    if not response.ok:

        return []

    return parse_search_engine_results(
        response.text
    )


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
                "price": None,
                "currency": None,
                "sales": None,
                "rating": None,
            }
        )

    # ========================================================
    # 1. NORMAL LINKS
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
                r'https?://(?:www\.)?aliexpress\.com/item/[0-9]+\.html',
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

            r'https?://(?:www\.)?aliexpress\.com/item/[0-9]+\.html',

            r'https?:\\/\\/(?:www\.)?aliexpress\.com\\/item\\/[0-9]+\.html',

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

            r'aliexpress\.com(?:\\?/|%2F|/)+item(?:\\?/|%2F|/)+([0-9]+)',

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
        r'https?://(?:www\.)?aliexpress\.com/item/[0-9]+\.html',
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
        r'aliexpress\.com/item/[0-9]+\.html',
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
                    r'https?://(?:www\.)?aliexpress\.com/item/[0-9]+\.html',
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
        r'aliexpress\.com.*?/item/([0-9]+)',
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
    # 1. NORMAL LINKS
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

        r'https?://(?:www\.)?aliexpress\.com/item/[0-9]+\.html',

        r'https?:\\/\\/(?:www\.)?aliexpress\.com\\/item\\/[0-9]+\.html',

        r'aliexpress\.com/item/[0-9]+\.html',

        r'aliexpress\.com\\/item\\/[0-9]+\.html',

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

            r'aliexpress\.com.{0,200}?/item/([0-9]+)',

            r'aliexpress\.com.{0,200}?\\/item\\/([0-9]+)',

            r'aliexpress\.com.{0,200}?%2Fitem%2F([0-9]+)',

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
            r'https?://(?:www\.)?aliexpress\.com/item/[0-9]+\.html',
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
# RANKING
# ============================================================

def rank_suppliers(
    suppliers: list[dict[str, Any]],
    original_title: str,
) -> list[dict[str, Any]]:

    original_words = set(
        _tokenize(
            original_title
        )
    )

    for supplier in suppliers:

        supplier_title = (
            supplier.get("title")
            or ""
        )

        supplier_query = (
            supplier.get(
                "search_query"
            )
            or ""
        )

        supplier_words = set(
            _tokenize(
                supplier_title
            )
        )

        # ----------------------------------------------------
        # TITLE MATCH
        # ----------------------------------------------------

        if supplier_words:

            intersection = (
                original_words
                & supplier_words
            )

            score = int(
                (
                    len(intersection)
                    / max(
                        len(original_words),
                        1,
                    )
                )
                * 100
            )

            score = max(
                50,
                min(
                    score,
                    95,
                ),
            )

        # ----------------------------------------------------
        # SEARCH QUERY MATCH
        # ----------------------------------------------------

        else:

            query_words = set(
                _tokenize(
                    supplier_query
                )
            )

            intersection = (
                original_words
                & query_words
            )

            if intersection:

                score = int(
                    (
                        len(intersection)
                        / max(
                            len(original_words),
                            1,
                        )
                    )
                    * 100
                )

                # Arama sorgusu zaten orijinal üründen
                # üretildiği için sorgu eşleşmesine küçük
                # bir güven tabanı ver, fakat artık herkese
                # sabit 90 verme.
                score = max(
                    55,
                    min(
                        score,
                        88,
                    ),
                )

            else:

                score = 45

        supplier[
            "match_score"
        ] = score

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

def _tokenize(
    text: str,
) -> list[str]:

    return [
        word
        for word in re.findall(
            r"[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*",
            text.lower(),
        )
        if len(word) >= 3
    ]


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
        r"aliexpress\.com/item/",
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