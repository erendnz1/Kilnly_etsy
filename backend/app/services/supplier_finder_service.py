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
        # ADD RESULTS
        # ----------------------------------------------------

        for result in results:

            result["search_query"] = query

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
        r"[a-zA-Z0-9]+",
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

    # ========================================================
    # 1. BING NORMAL SEARCH RESULTS
    # ========================================================

    for result in soup.select(
        "li.b_algo"
    ):

        anchor = result.select_one(
            "h2 a"
        )

        if not anchor:
            anchor = result.find(
                "a"
            )

        if not anchor:
            continue

        href = anchor.get(
            "href"
        )

        if not href:
            continue

        title = anchor.get_text(
            " ",
            strip=True,
        )

        product_url = (
            _extract_aliexpress_url(
                href
            )
        )

        # ----------------------------------------------------
        # Bazı Bing sonuçlarında AliExpress URL'si
        # href yerine result HTML'inin içerisinde olabilir.
        # ----------------------------------------------------

        if not product_url:

            result_html = str(
                result
            )

            product_url = (
                _extract_aliexpress_url(
                    result_html
                )
            )

        if not product_url:
            continue

        # ----------------------------------------------------
        # DUPLICATE
        # ----------------------------------------------------

        if any(
            item["url"] == product_url
            for item in results
        ):
            continue

        # ----------------------------------------------------
        # IMAGE
        # ----------------------------------------------------

        image_url = None

        image = result.find(
            "img"
        )

        if image:

            image_url = (
                image.get("src")
                or image.get(
                    "data-src"
                )
                or image.get(
                    "data-lazy-src"
                )
            )

        if image_url:

            image_url = (
                _clean_image_url(
                    image_url
                )
            )

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

        if len(results) >= 20:
            break

    # ========================================================
    # 2. TÜM LINKLERİ İKİNCİ KEZ KONTROL ET
    # ========================================================

    if len(results) < 10:

        for anchor in soup.find_all(
            "a"
        ):

            href = anchor.get(
                "href"
            )

            if not href:
                continue

            product_url = (
                _extract_aliexpress_url(
                    href
                )
            )

            if not product_url:
                continue

            if any(
                item["url"] == product_url
                for item in results
            ):
                continue

            title = anchor.get_text(
                " ",
                strip=True,
            )

            image_url = None

            image = anchor.find(
                "img"
            )

            if image:

                image_url = (
                    image.get("src")
                    or image.get(
                        "data-src"
                    )
                    or image.get(
                        "data-lazy-src"
                    )
                )

            if image_url:

                image_url = (
                    _clean_image_url(
                        image_url
                    )
                )

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

            if len(results) >= 20:
                break

    # ========================================================
    # 3. RAW HTML URL SEARCH
    # ========================================================

    if len(results) < 10:

        # Önce HTML decode et
        decoded_html = unquote(
            html
        )

        patterns = [

            # Normal URL
            r'https?://(?:www\.)?aliexpress\.com/item/[0-9]+\.html',

            # Encoded URL
            r'https?%3A%2F%2F(?:www\.)?aliexpress\.com%2Fitem%2F[0-9]+%2Ehtml',

            # Escaped slash
            r'https?:\\/\\/(?:www\.)?aliexpress\.com\\/item\\/[0-9]+\.html',

        ]

        for pattern in patterns:

            matches = re.findall(
                pattern,
                html,
                re.IGNORECASE,
            )

            for match in matches:

                product_url = _clean_url(
                    unquote(match)
                )

                if not product_url:
                    continue

                if any(
                    item["url"]
                    == product_url
                    for item in results
                ):
                    continue

                results.append(
                    {
                        "title": None,
                        "url": product_url,
                        "image_url": None,
                        "price": None,
                        "currency": None,
                        "sales": None,
                        "rating": None,
                    }
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

# ============================================================
# EXTRACT ALIEXPRESS URL
# ============================================================

def _extract_aliexpress_url(
    href: str,
) -> str | None:

    if not href:
        return None

    href = href.strip()

    # --------------------------------------------------------
    # HTML / escaped characters
    # --------------------------------------------------------

    href = (
        href
        .replace(
            "\\/",
            "/",
        )
        .replace(
            "\\u002F",
            "/",
        )
    )

    # --------------------------------------------------------
    # Direct
    # --------------------------------------------------------

    direct = _clean_url(
        href
    )

    if direct:
        return direct

    # --------------------------------------------------------
    # Decode multiple times
    # --------------------------------------------------------

    candidate = href

    for _ in range(4):

        try:

            decoded = unquote(
                candidate
            )

        except Exception:

            break

        if decoded == candidate:
            break

        candidate = decoded

        direct = _clean_url(
            candidate
        )

        if direct:
            return direct

    # --------------------------------------------------------
    # Search inside href
    # --------------------------------------------------------

    match = re.search(
        r'https?://(?:www\.)?aliexpress\.com/item/[0-9]+\.html',
        candidate,
        re.IGNORECASE,
    )

    if match:

        direct = _clean_url(
            match.group(0)
        )

        if direct:
            return direct

    # --------------------------------------------------------
    # Query parameters
    # --------------------------------------------------------

    try:

        parsed = urlparse(
            href
        )

        params = parse_qs(
            parsed.query
        )

        for key in (
            "u",
            "url",
            "q",
        ):

            values = params.get(
                key,
                [],
            )

            for value in values:

                candidate = unquote(
                    value
                )

                for _ in range(4):

                    decoded = unquote(
                        candidate
                    )

                    if (
                        decoded
                        == candidate
                    ):
                        break

                    candidate = decoded

                direct = _clean_url(
                    candidate
                )

                if direct:
                    return direct

    except Exception:

        pass

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

    protection_terms = [
        "_____tmd_____",
        "/punish",
        "x5sec",
        "verify you are human",
        "robot",
        "captcha",
        "security verification",
        "access denied",
    ]

    return any(
        term in lowered
        for term in protection_terms
    )


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

    results: list[
        dict[str, Any]
    ] = []

    # --------------------------------------------------------
    # SCRIPT DATA
    # --------------------------------------------------------

    for script in soup.find_all(
        "script"
    ):

        content = script.string

        if not content:

            content = script.get_text()

        if not content:

            continue

        matches = re.findall(
            r'https?://(?:www\.)?aliexpress\.com/item/[^"\']+',
            content,
            re.IGNORECASE,
        )

        for product_url in matches:

            product_url = _clean_url(
                product_url
            )

            if not product_url:

                continue

            if any(
                item["url"] == product_url
                for item in results
            ):

                continue

            results.append(
                {
                    "title": None,
                    "url": product_url,
                    "image_url": None,
                    "price": None,
                    "currency": None,
                    "sales": None,
                    "rating": None,
                }
            )

            if len(results) >= 30:

                return results

    # --------------------------------------------------------
    # LINK FALLBACK
    # --------------------------------------------------------

    for anchor in soup.find_all(
        "a"
    ):

        href = anchor.get(
            "href"
        )

        if not href:

            continue

        if "/item/" not in href:

            continue

        product_url = _clean_url(
            href,
            base_url=base_url,
        )

        if not product_url:

            continue

        # ----------------------------------------------------
        # TITLE
        # ----------------------------------------------------

        title = anchor.get(
            "title"
        )

        if not title:

            title = anchor.get_text(
                " ",
                strip=True,
            )

        if not title:

            image = anchor.find(
                "img"
            )

            if image:

                title = (
                    image.get("alt")
                    or None
                )

        if title:

            title = title.strip()

        # ----------------------------------------------------
        # IMAGE
        # ----------------------------------------------------

        image_url = None

        image = anchor.find(
            "img"
        )

        if image:

            image_url = (
                image.get("src")
                or image.get(
                    "data-src"
                )
                or image.get(
                    "data-lazy-src"
                )
            )

        if image_url:

            image_url = _clean_image_url(
                image_url
            )

        # ----------------------------------------------------
        # DUPLICATE
        # ----------------------------------------------------

        if any(
            item["url"] == product_url
            for item in results
        ):

            continue

        results.append(
            {
                "title": title,
                "url": product_url,
                "image_url": image_url,
                "price": None,
                "currency": None,
                "sales": None,
                "rating": None,
            }
        )

        if len(results) >= 30:

            break

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

                score = max(
                    50,
                    min(
                        score,
                        90,
                    ),
                )

            else:

                score = 50

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
            r"[a-zA-Z0-9]+",
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