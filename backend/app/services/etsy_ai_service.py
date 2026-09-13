import base64
import io
import json
import logging
import os
import re
import time
import requests
from groq import Groq
from huggingface_hub import InferenceClient
from dotenv import load_dotenv
from app.config import settings

load_dotenv()
logger = logging.getLogger(__name__)

groq_client = Groq(
    api_key=settings.groq_api_key
)


# ============================================================
# HELPERS
# ============================================================

def _clean_json_response(response_text: str) -> str:
    """
    AI response içinden JSON'u temizler.
    Markdown code block gelirse kaldırır.
    """

    response_text = response_text.strip()

    if response_text.startswith("```"):
        if response_text.startswith("```json"):
            response_text = response_text[len("```json"):].strip()
        else:
            response_text = response_text[len("```"):].strip()

        if response_text.endswith("```"):
            response_text = response_text[:-3].strip()

    json_start = response_text.find("{")
    json_end = response_text.rfind("}")

    if json_start == -1 or json_end == -1:
        raise ValueError(
            "AI did not return a valid JSON object."
        )

    return response_text[
        json_start:json_end + 1
    ]


def _clean_tags(tags: list[str]) -> list[str]:
    """
    Etsy tag kurallarına uygun tag listesi.

    - boş tag yok
    - maksimum 20 karakter
    - duplicate yok
    - maksimum 13 tag
    """

    cleaned_tags: list[str] = []
    seen: set[str] = set()

    for tag in tags:
        if not isinstance(tag, str):
            continue

        tag = tag.strip()

        if not tag:
            continue

        if len(tag) > 20:
            continue

        normalized = tag.lower()

        if normalized in seen:
            continue

        seen.add(normalized)
        cleaned_tags.append(tag)

        if len(cleaned_tags) == 13:
            break

    return cleaned_tags


def _validate_score(value) -> int:
    """
    AI score değerini güvenli şekilde 0-100 aralığında integer yapar.
    """

    try:
        score = int(value)
    except (TypeError, ValueError):
        return 0

    return max(0, min(100, score))


def _clean_string_list(value) -> list[str]:
    """
    AI tarafından dönen string listelerini temizler.
    """

    if not isinstance(value, list):
        return []

    return [
        item.strip()
        for item in value
        if isinstance(item, str)
        and item.strip()
    ]


def _normalize_text(text: str | None) -> str:
    """
    Karşılaştırmalar için metni normalize eder.
    """

    if not text:
        return ""

    return re.sub(
        r"\s+",
        " ",
        text.lower().strip(),
    )

def _remove_invalid_image_analysis(
    items: list[str],
    has_images: bool,
) -> list[str]:
    if not has_images:
        return items

    invalid_patterns = [
        "no image",
        "no images",
        "image url",
        "image urls",
        "missing image",
        "missing images",
        "add image",
        "add images",
        "include image",
        "include images",
        "image url provided",
        "image urls provided",
    ]

    cleaned = []

    for item in items:
        normalized = _normalize_text(item)

        if any(
            pattern in normalized
            for pattern in invalid_patterns
        ):
            continue

        cleaned.append(item)

    return cleaned
# ============================================================
# SCORE CALCULATIONS
# ============================================================

def _calculate_tag_score(
    tags: list[str],
) -> int:
    """
    Tag skorunu deterministik olarak hesaplar.
    """

    if not tags:
        return 0

    valid_tags = [
        tag
        for tag in tags
        if isinstance(tag, str)
        and tag.strip()
    ]

    if not valid_tags:
        return 0

    score = 0

    # --------------------------------------------------------
    # TAG COUNT
    # --------------------------------------------------------

    tag_count = min(len(valid_tags), 13)

    if tag_count >= 13:
        score += 30
    elif tag_count >= 10:
        score += 27
    elif tag_count >= 7:
        score += 23
    elif tag_count >= 5:
        score += 18
    elif tag_count >= 3:
        score += 12
    else:
        score += 6

    # --------------------------------------------------------
    # VALID TAG LENGTH
    # --------------------------------------------------------

    valid_length_count = sum(
        1
        for tag in valid_tags
        if len(tag) <= 20
    )

    length_ratio = (
        valid_length_count / len(valid_tags)
    )

    score += round(
        length_ratio * 25
    )

    # --------------------------------------------------------
    # UNIQUE TAGS
    # --------------------------------------------------------

    normalized = [
        tag.lower().strip()
        for tag in valid_tags
    ]

    unique_count = len(set(normalized))

    unique_ratio = (
        unique_count / len(normalized)
    )

    score += round(
        unique_ratio * 20
    )

    # --------------------------------------------------------
    # KEYWORD VARIETY
    # --------------------------------------------------------

    words: set[str] = set()

    for tag in valid_tags:
        for word in re.findall(
            r"[a-z0-9]+",
            tag.lower(),
        ):
            if len(word) >= 3:
                words.add(word)

    if len(words) >= 12:
        score += 25
    elif len(words) >= 9:
        score += 21
    elif len(words) >= 6:
        score += 17
    elif len(words) >= 4:
        score += 12
    elif len(words) >= 2:
        score += 7
    else:
        score += 3

    return max(
        0,
        min(100, score),
    )


def _calculate_title_score(
    title: str,
) -> int:
    """
    Başlık skorunu temel yapısal kurallarla hesaplar.
    """

    if not title or not title.strip():
        return 0

    title = title.strip()

    words = re.findall(
        r"[a-zA-Z0-9]+",
        title,
    )

    if not words:
        return 0

    score = 55

    # --------------------------------------------------------
    # TITLE LENGTH
    # --------------------------------------------------------

    if 40 <= len(title) <= 140:
        score += 15
    elif 25 <= len(title) <= 160:
        score += 10
    elif len(title) < 20:
        score -= 15

    # --------------------------------------------------------
    # WORD COUNT
    # --------------------------------------------------------

    if 5 <= len(words) <= 15:
        score += 10
    elif len(words) >= 4:
        score += 5

    # --------------------------------------------------------
    # REPETITION
    # --------------------------------------------------------

    normalized_words = [
        word.lower()
        for word in words
    ]

    unique_ratio = (
        len(set(normalized_words))
        / len(normalized_words)
    )

    if unique_ratio >= 0.85:
        score += 10
    elif unique_ratio >= 0.70:
        score += 5
    else:
        score -= 5

    # --------------------------------------------------------
    # PUNCTUATION / READABILITY
    # --------------------------------------------------------

    if title.count("-") <= 2:
        score += 5

    if not re.search(
        r"[!?]{2,}",
        title,
    ):
        score += 5

    return max(
        0,
        min(100, score),
    )


def _calculate_description_score(
    description: str | None,
) -> int:
    """
    Description skorunu temel içerik/yapı kurallarıyla hesaplar.
    """

    if not description or not description.strip():
        return 0

    description = description.strip()

    score = 50

    # --------------------------------------------------------
    # LENGTH
    # --------------------------------------------------------

    if len(description) >= 500:
        score += 20
    elif len(description) >= 300:
        score += 15
    elif len(description) >= 150:
        score += 10
    elif len(description) >= 80:
        score += 5

    # --------------------------------------------------------
    # STRUCTURE
    # --------------------------------------------------------

    if "\n" in description:
        score += 10

    description_lower = description.lower()

    if (
        "material" in description_lower
        or "materials" in description_lower
        or "malzeme" in description_lower
        or "malzemeler" in description_lower
    ):
        score += 5

    if (
        "stone" in description_lower
        or "details" in description_lower
        or "taş" in description_lower
        or "detay" in description_lower
    ):
        score += 5

    # --------------------------------------------------------
    # SENTENCE STRUCTURE
    # --------------------------------------------------------

    sentences = re.split(
        r"[.!?]+",
        description,
    )

    meaningful_sentences = [
        sentence.strip()
        for sentence in sentences
        if sentence.strip()
    ]

    if len(meaningful_sentences) >= 3:
        score += 5

    # --------------------------------------------------------
    # READABILITY
    # --------------------------------------------------------

    if not re.search(
        r"\s{2,}",
        description,
    ):
        score += 5

    return max(
        0,
        min(100, score),
    )


# ============================================================
# LISTING ANALYSIS
# ============================================================

def analyze_etsy_listing(
    title: str,
    description: str | None,
    tags: list[str],
    language: str = "en",
) -> dict:

    if language not in {"tr", "en"}:
        language = "en"

    language_name = (
        "Turkish"
        if language == "tr"
        else "English"
    )

    normalized_tags = _clean_tags(tags)

    # --------------------------------------------------------
    # DETERMINISTIC SCORES
    # --------------------------------------------------------

    title_score = _calculate_title_score(
        title
    )

    description_score = _calculate_description_score(
        description
    )

    tag_score = _calculate_tag_score(
        normalized_tags
    )

    seo_score = round(
        (
            title_score * 0.35
            + description_score * 0.30
            + tag_score * 0.35
        )
    )

    # --------------------------------------------------------
    # AI ONLY GENERATES EXPLANATIONS
    # --------------------------------------------------------

    prompt = f"""
You are an expert Etsy SEO listing auditor.

Analyze the Etsy listing below.

The numeric scores have already been calculated by the
application.

DO NOT generate scores.

Your job is ONLY to provide:

- strengths
- issues
- missing_information
- recommendations

OUTPUT LANGUAGE:
{language_name}

LISTING TITLE:
{title}

LISTING DESCRIPTION:
{description or ""}

LISTING TAGS:
{json.dumps(normalized_tags, ensure_ascii=False)}

============================================================
ACCURACY RULES
============================================================

- Use ONLY information explicitly present.
- Never invent product attributes.
- Never invent dimensions.
- Never invent materials.
- Never invent colors.
- Never invent shipping details.
- Never invent certifications.
- Never invent personalization.
- The word "initial" alone does NOT prove personalization.
- Do not claim a keyword is missing if it already exists.
- Do not report duplicate tags unless they are actually
  duplicated or clearly redundant.
- Do not recommend unsupported keywords.
- Do not create artificial issues just to fill the response.

============================================================
STRENGTHS
============================================================

Provide 2-4 genuine strengths.

============================================================
ISSUES
============================================================

Provide only concrete issues.

If there are no major issues, return fewer items.

============================================================
MISSING INFORMATION
============================================================

Only mention genuinely missing product information.

============================================================
RECOMMENDATIONS
============================================================

Provide 2-5 actionable recommendations ONLY when they would
materially improve the Etsy listing.

Every recommendation MUST correspond to a specific weakness,
missing product fact, or objectively measurable listing issue.

IMPORTANT:

Recommendations must be based ONLY on verified source
information and the generated Etsy listing.

Do NOT create recommendations based on assumptions,
industry habits, generic Etsy checklists, or information that
is simply unavailable from the source.

============================================================
WHAT A VALID RECOMMENDATION LOOKS LIKE
============================================================

A recommendation is valid when it addresses a concrete issue.

Examples:

- If the title does not contain an important VERIFIED product
  keyword, recommend improving the title.

- If tags are missing important VERIFIED keywords, recommend
  improving the tags.

- If the description does not clearly communicate a VERIFIED
  product fact, recommend adding that fact.

- If important product dimensions are missing and dimensions
  are materially relevant to the product, recommend adding
  verified dimensions.

- If material information is missing and material is important
  for this product, recommend adding the verified material.

- If the source provides a price but the Etsy listing does not
  contain it, recommend adding the source price.

============================================================
DO NOT MAKE GENERIC RECOMMENDATIONS
============================================================

Do NOT recommend:

- adding shipping information
- adding shipping costs
- adding return policies
- adding warranties
- adding processing times
- adding handling times
- adding seller information
- adding shop policies
- adding packaging information
- adding care instructions
- adding installation instructions
- adding certifications
- adding manufacturing information
- adding handmade status

unless the source explicitly provides relevant information
that should be included in the listing.

Do NOT recommend adding information merely because it is
normally useful on Etsy.

============================================================
IMAGE RULES
============================================================

The source scraper provides the available image URLs.

IMAGE COUNT and IMAGE AVAILABILITY are authoritative.

If IMAGE COUNT > 0:

- Do NOT recommend uploading images.
- Do NOT recommend adding images.
- Do NOT say that images are missing.
- Do NOT recommend replacing images.
- Do NOT recommend improving image quality or resolution.

The URL analyzer does not perform visual quality analysis.

Therefore, image quality, resolution, composition, variety,
background quality, or product presentation must NOT be used
as a weakness or recommendation in this analysis.

Visual recommendations belong to the separate Visual AI
Analysis feature.

============================================================
MISSING INFORMATION VS RECOMMENDATIONS
============================================================

Do not turn every missing piece of information into a
recommendation.

For example:

Missing:
"dimensions"

does NOT automatically mean:

"Add dimensions."

Only recommend adding dimensions if dimensions are genuinely
important for this specific product and their absence would
materially affect the listing.

Similarly:

Missing:
"weight"

does NOT automatically mean:

"Add product weight."

Only recommend it when weight is materially relevant to the
specific product.

============================================================
NO DUPLICATE RECOMMENDATIONS
============================================================

Do not repeat the same issue in different wording.

If an item is already identified in "missing_information",
only mention it in "recommendations" when there is a clear
action the seller should take.

Recommendations should be concise and actionable.

============================================================
RECOMMENDATION COUNT
============================================================

Return 2-5 recommendations ONLY if at least 2 meaningful
recommendations exist.

If fewer than 2 meaningful recommendations exist, return only
the recommendations that are genuinely justified.

Do NOT invent additional recommendations just to reach 2-5.

If the listing is already strong and no meaningful action is
needed, return:

[]

============================================================
FINAL RULE
============================================================

The purpose of recommendations is to help the seller improve
the generated Etsy listing.

Do NOT produce a generic Etsy optimization checklist.

Every recommendation must answer:

"What specific problem exists in this listing, and what
specific action would improve it?"

If there is no clear problem, do not recommend anything.

Return ONLY valid JSON.

Return exactly:

{{
  "strengths": [],
  "issues": [],
  "missing_information": [],
  "recommendations": []
}}
"""

    response = groq_client.chat.completions.create(
        model=settings.groq_model,
        temperature=0,
        response_format={
            "type": "json_object"
        },
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an Etsy SEO explanation assistant. "
                    f"Always respond in {language_name}. "
                    "Do not generate scores. "
                    "Do not invent product information."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )

    response_text = (
        response.choices[0].message.content
    )

    if not response_text:
        raise ValueError(
            "Empty AI response."
        )

    try:
        result = json.loads(
            _clean_json_response(
                response_text
            )
        )

    except json.JSONDecodeError as error:
        logger.error(
            "Invalid AI JSON response: %s",
            response_text,
        )

        raise ValueError(
            "AI returned invalid JSON."
        ) from error

    if not isinstance(result, dict):
        raise ValueError(
            "AI response is not a JSON object."
        )

    return {
        "seo_score": seo_score,
        "title_score": title_score,
        "description_score": description_score,
        "tag_score": tag_score,
        "strengths": _clean_string_list(
            result.get("strengths")
        ),
        "issues": _clean_string_list(
            result.get("issues")
        ),
        "missing_information": _clean_string_list(
            result.get("missing_information")
        ),
        "recommendations": _clean_string_list(
            result.get("recommendations")
        ),
    }


# ============================================================
# VISUAL ANALYSIS
# ============================================================
# ============================================================
# IDENTIFY PRODUCT FROM IMAGE
# ============================================================

def identify_product_from_image(
    image_url: str,
    language: str = "en",
) -> dict:
    """
    Ürün görselini analiz eder ve supplier araması için
    kullanılabilecek ürün bilgilerini üretir.

    Bu fonksiyon görsel kalite analizi yapmaz.
    Amacı ürünün ne olduğunu anlamak ve arama sorgusu
    oluşturmaktır.
    """

    if not image_url:
        raise ValueError(
            "Image URL is required."
        )

    if language not in {"tr", "en"}:
        language = "en"

    language_name = (
        "Turkish"
        if language == "tr"
        else "English"
    )

    # --------------------------------------------------------
    # AI PROMPT
    # --------------------------------------------------------

    prompt_content = [
        {
            "type": "text",
            "text": f"""
You are a product identification assistant for an
e-commerce supplier finder.

Analyze the provided product image.

OUTPUT LANGUAGE:
{language_name}

Your goal is to identify what kind of product is shown
and create a useful search query that can be used to
find similar products on AliExpress.

============================================================
IMPORTANT ACCURACY RULES
============================================================

Only use information that is visually observable.

Do NOT invent:

- exact materials
- exact dimensions
- exact weight
- brand
- certifications
- product specifications
- product origin
- seller information

If a material is visually suggested but cannot be confirmed,
use a cautious description.

For example:

Good:
"silver-colored necklace"

Bad:
"925 sterling silver necklace"

unless 925 / sterling silver is actually visible or
provided by the image.

============================================================
PRODUCT IDENTIFICATION
============================================================

Identify:

- product type
- visible style
- visible design characteristics
- visible color
- visible shape
- visible pattern
- other useful visual characteristics

============================================================
SUPPLIER SEARCH QUERY
============================================================

Create a concise English search query suitable for
AliExpress.

The query should:

- describe the actual product
- include useful visible characteristics
- avoid unsupported specifications
- avoid brand names
- avoid marketing language
- avoid unnecessary words

Example:

"dainty silver name necklace"

or:

"minimalist heart pendant necklace"

Do NOT create extremely long queries.

============================================================
RETURN ONLY JSON
============================================================

Return exactly:

{{
  "title": "",
  "product_type": "",
  "description": "",
  "search_query": "",
  "visual_attributes": []
}}
""",
        },
        {
            "type": "image_url",
            "image_url": {
                "url": image_url,
            },
        },
    ]

    # --------------------------------------------------------
    # AI REQUEST
    # --------------------------------------------------------

    response = groq_client.chat.completions.create(
        model="qwen/qwen3.6-27b",
        temperature=0,
        max_completion_tokens=768,
        reasoning_effort="none",
        response_format={
            "type": "json_object"
        },
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a deterministic product "
                    "identification assistant. "
                    f"Always respond in {language_name}. "
                    "Never invent product specifications."
                ),
            },
            {
                "role": "user",
                "content": prompt_content,
            },
        ],
    )

    response_text = (
        response.choices[0].message.content
    )

    if not response_text:
        raise ValueError(
            "Empty AI product identification response."
        )

    # --------------------------------------------------------
    # PARSE JSON
    # --------------------------------------------------------

    try:
        result = json.loads(
            _clean_json_response(
                response_text
            )
        )

    except json.JSONDecodeError as error:

        logger.error(
            "Invalid product identification response: %s",
            response_text,
        )

        raise ValueError(
            "AI returned invalid product identification JSON."
        ) from error

    if not isinstance(result, dict):
        raise ValueError(
            "AI product identification response "
            "is not a JSON object."
        )

    # --------------------------------------------------------
    # CLEAN VALUES
    # --------------------------------------------------------

    title = str(
        result.get("title")
        or ""
    ).strip()

    product_type = str(
        result.get("product_type")
        or ""
    ).strip()

    description = str(
        result.get("description")
        or ""
    ).strip()

    search_query = str(
        result.get("search_query")
        or ""
    ).strip()

    visual_attributes = _clean_string_list(
        result.get("visual_attributes")
    )

    # --------------------------------------------------------
    # FALLBACK SEARCH QUERY
    # --------------------------------------------------------

    if not search_query:

        parts = [
            title,
            product_type,
        ]

        parts.extend(
            visual_attributes[:4]
        )

        search_query = " ".join(
            part.strip()
            for part in parts
            if part and part.strip()
        )

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not search_query:
        raise ValueError(
            "Could not generate a product search query."
        )

    return {
        "title": title,
        "product_type": product_type,
        "description": description,
        "search_query": search_query,
        "visual_attributes": visual_attributes,
    }
def analyze_etsy_images(
    image_urls: list[str],
    language: str = "en",
) -> dict:

    if language not in {"tr", "en"}:
        language = "en"

    language_name = (
        "Turkish"
        if language == "tr"
        else "English"
    )

    images = image_urls[:2]

    if not images:
        return {
            "visual_score": 0,
            "main_image_score": 0,
            "composition_score": 0,
            "product_visibility_score": 0,
            "background_score": 0,
            "strengths": [],
            "issues": [],
            "recommendations": [],
        }

    prompt_content = [
        {
            "type": "text",
            "text": f"""
Analyze the provided Etsy product images.

OUTPUT LANGUAGE:
{language_name}

Use ONLY visually observable information.

IMPORTANT:
- Do not infer product specifications.
- Do not invent materials.
- Do not invent product dimensions.
- Do not invent product features.
- Do not identify personalization unless it is visually obvious.
- Do not describe details that cannot be clearly seen.
- Do not create artificial problems.

Return ONLY valid JSON.

Use integer scores from 0 to 100.

Return exactly:

{{
  "visual_score": 0,
  "main_image_score": 0,
  "composition_score": 0,
  "product_visibility_score": 0,
  "background_score": 0,
  "strengths": [],
  "issues": [],
  "recommendations": []
}}
""",
        }
    ]

    for index, image_url in enumerate(images):

        prompt_content.append(
            {
                "type": "text",
                "text": f"IMAGE {index + 1}:",
            }
        )

        prompt_content.append(
            {
                "type": "image_url",
                "image_url": {
                    "url": image_url,
                },
            }
        )

    response = groq_client.chat.completions.create(
        model="qwen/qwen3.6-27b",
        temperature=0,
        max_completion_tokens=1024,
        reasoning_effort="none",
        response_format={
            "type": "json_object"
        },
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a deterministic Etsy visual "
                    "optimization expert. "
                    f"Always respond in {language_name}. "
                    "Only describe visually observable information."
                ),
            },
            {
                "role": "user",
                "content": prompt_content,
            },
        ],
    )

    response_text = (
        response.choices[0].message.content
    )

    if not response_text:
        raise ValueError(
            "Empty AI image analysis response."
        )

    try:
        result = json.loads(
            _clean_json_response(
                response_text
            )
        )

    except json.JSONDecodeError as error:
        logger.error(
            "Invalid AI image JSON response: %s",
            response_text,
        )

        raise ValueError(
            "AI returned invalid image analysis JSON."
        ) from error

    if not isinstance(result, dict):
        raise ValueError(
            "AI image response is not a JSON object."
        )

    return {
        "visual_score": _validate_score(
            result.get("visual_score")
        ),
        "main_image_score": _validate_score(
            result.get("main_image_score")
        ),
        "composition_score": _validate_score(
            result.get("composition_score")
        ),
        "product_visibility_score": _validate_score(
            result.get("product_visibility_score")
        ),
        "background_score": _validate_score(
            result.get("background_score")
        ),
        "strengths": _clean_string_list(
            result.get("strengths")
        ),
        "issues": _clean_string_list(
            result.get("issues")
        ),
        "recommendations": _clean_string_list(
            result.get("recommendations")
        ),
    }


# ============================================================
# LISTING OPTIMIZATION
# ============================================================

def optimize_etsy_listing(
    title: str,
    description: str | None,
    tags: list[str],
    language: str = "en",
) -> dict:

    if language not in {"tr", "en"}:
        language = "en"

    language_name = (
        "Turkish"
        if language == "tr"
        else "English"
    )

    current_tags = _clean_tags(tags)

    prompt = f"""
You are an expert Etsy listing optimization assistant.

Improve the existing Etsy listing.

Use ONLY the information explicitly provided.

============================================================
LANGUAGE
============================================================

OUTPUT LANGUAGE:
{language_name}

The optimized title, description, tags and changes
MUST ALL be written in {language_name}.

============================================================
CURRENT LISTING
============================================================

TITLE:
{title}

DESCRIPTION:
{description or ""}

TAGS:
{json.dumps(current_tags, ensure_ascii=False)}

============================================================
OPTIMIZATION RULES
============================================================

TITLE:

- Keep it natural.
- Avoid keyword stuffing.
- Preserve important existing product keywords.
- Do not remove "Initial" if it is part of the actual product.
- Do not claim personalization unless explicitly supported.
- Do not invent product information.
- Keep the title relevant to the actual product.

DESCRIPTION:

- Keep all factual information.
- Improve readability.
- Use natural keyword placement.
- Do not invent measurements.
- Do not invent shipping information.
- Do not invent personalization.
- Do not invent certifications.
- Do not invent guarantees.
- Do not invent materials.
- Do not invent product features.

TAGS:

Generate up to 13 unique tags.

CRITICAL TAG RULES:

- EVERY tag MUST be 20 characters or fewer.
- No duplicate tags.
- No unsupported keywords.
- No unrelated high-volume keywords.
- Do not add "personalized", "custom", "customizable"
  or "name necklace" unless explicitly supported.
- Prefer specific product-relevant search phrases.
- Preserve useful existing tags when they are already strong.

============================================================
IMPORTANT
============================================================

Do not change something simply to make it different.

Only make changes that have a clear:

- SEO benefit
- readability benefit
- relevance benefit

If the existing title, description or tags are already strong,
they may be kept unchanged.

Never invent missing product details.

Return ONLY valid JSON.

Return exactly:

{{
  "optimized_title": "",
  "optimized_description": "",
  "optimized_tags": [],
  "changes": []
}}
"""

    response = groq_client.chat.completions.create(
        model=settings.groq_model,
        temperature=0,
        response_format={
            "type": "json_object"
        },
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a deterministic Etsy optimization "
                    f"assistant. Always respond in {language_name}. "
                    "Never invent product information. "
                    "Every tag must be 20 characters or fewer."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )

    response_text = (
        response.choices[0].message.content
    )

    if not response_text:
        raise ValueError(
            "Empty AI optimization response."
        )

    try:
        result = json.loads(
            _clean_json_response(
                response_text
            )
        )

    except json.JSONDecodeError as error:
        logger.error(
            "Invalid AI optimization response: %s",
            response_text,
        )

        raise ValueError(
            "AI returned invalid optimization JSON."
        ) from error

    if not isinstance(result, dict):
        raise ValueError(
            "AI optimization response is not a JSON object."
        )

    # --------------------------------------------------------
    # TITLE
    # --------------------------------------------------------

    optimized_title = result.get(
        "optimized_title"
    )

    if (
        not isinstance(
            optimized_title,
            str,
        )
        or not optimized_title.strip()
    ):
        optimized_title = title

    optimized_title = optimized_title.strip()

    # --------------------------------------------------------
    # DESCRIPTION
    # --------------------------------------------------------

    optimized_description = result.get(
        "optimized_description"
    )

    if not isinstance(
        optimized_description,
        str,
    ):
        optimized_description = (
            description or ""
        )

    optimized_description = (
        optimized_description.strip()
    )

    # --------------------------------------------------------
    # TAGS
    # --------------------------------------------------------

    optimized_tags = result.get(
        "optimized_tags"
    )

    if not isinstance(
        optimized_tags,
        list,
    ):
        optimized_tags = current_tags

    optimized_tags = _clean_tags(
        optimized_tags
    )

    # AI'nin tüm tag'leri geçersizse
    # mevcut tag'leri kaybetme.
    if not optimized_tags:
        optimized_tags = current_tags[:13]

    # --------------------------------------------------------
    # CHANGES
    # --------------------------------------------------------

    changes = _clean_string_list(
        result.get("changes")
    )

    return {
        "optimized_title": optimized_title,
        "optimized_description": optimized_description,
        "optimized_tags": optimized_tags,
        "changes": changes,
    }

# ============================================================
# AI IMAGE OPTIMIZATION
# ============================================================

def optimize_etsy_image(
    image_url: str,
    language: str = "en",
) -> str:
    """
    Etsy ürün görselini AI ile optimize eder.

    ÖNEMLİ:
    - Ürünün kendisini değiştirmemeye çalışır.
    - Ürün tasarımını, taşları, materyali ve renkleri korur.
    - Sadece fotoğraf kalitesini iyileştirmeye odaklanır.
    - Sonucu base64 data URL olarak döndürür.
    """

    if not image_url:
        raise ValueError(
            "Image URL is required."
        )

    hf_token = os.getenv("HF_TOKEN")

    if not hf_token:
        raise ValueError(
            "HF_TOKEN is not configured."
        )

    # --------------------------------------------------------
    # DOWNLOAD ORIGINAL IMAGE
    # --------------------------------------------------------

    response = requests.get(
        image_url,
        timeout=30,
    )

    response.raise_for_status()

    image_bytes = response.content

    if not image_bytes:
        raise ValueError(
            "Downloaded image is empty."
        )

    # --------------------------------------------------------
    # HUGGING FACE CLIENT
    # --------------------------------------------------------

    client = InferenceClient(
        provider="fal-ai",
        api_key=hf_token,
    )

    # --------------------------------------------------------
    # IMAGE EDIT PROMPT
    # --------------------------------------------------------

    prompt = """
Improve this Etsy product photograph professionally.

IMPORTANT PRODUCT PRESERVATION RULES:

Preserve the exact original product.

Do NOT:
- redesign the product
- change the product shape
- change the jewelry design
- add stones
- remove stones
- change the number of stones
- change the metal
- change the metal color
- change the product proportions
- invent product details
- add accessories that are not present
- remove real product components

The final image must show the same real product.

Only improve the photography:

- improve lighting
- improve exposure
- improve clarity
- improve sharpness
- improve contrast
- create a clean professional background
- reduce distracting background elements
- create subtle realistic shadows
- make the product stand out clearly
- create a professional Etsy product-photo appearance

Keep the result photorealistic.

Do not turn the product into a different product.

Do not generate a completely new product.
Edit the provided image while preserving the actual product.
"""

    # --------------------------------------------------------
    # IMAGE EDIT
    # --------------------------------------------------------

    optimized_image = client.image_to_image(
        image_bytes,
        prompt=prompt,
        model="Qwen/Qwen-Image-Edit",
    )

    # --------------------------------------------------------
    # CONVERT IMAGE TO BYTES
    # --------------------------------------------------------

    output_buffer = io.BytesIO()

    optimized_image.save(
        output_buffer,
        format="PNG",
    )

    optimized_bytes = (
        output_buffer.getvalue()
    )

    if not optimized_bytes:
        raise ValueError(
            "AI returned an empty optimized image."
        )

    # --------------------------------------------------------
    # BASE64 DATA URL
    # --------------------------------------------------------

    encoded_image = base64.b64encode(
        optimized_bytes
    ).decode("utf-8")

    return (
        "data:image/png;base64,"
        f"{encoded_image}"
    )

# ============================================================
# URL PRODUCT ANALYSIS
# ============================================================

def analyze_product_from_url(
    product: dict,
    language: str = "en",
) -> dict:
    """
    URL'den alınan ürünü Etsy listing oluşturulabilecek
    hale getirmek için AI ile analiz ve içerik üretimi yapar.
    """

    total_start = time.perf_counter()

    if language not in {"tr", "en"}:
        language = "en"

    language_name = (
        "Turkish"
        if language == "tr"
        else "English"
    )

    title = product.get("title") or ""
    description = product.get("description") or ""
    price = product.get("price")
    currency = product.get("currency") or ""
    brand = product.get("brand") or ""
    images = product.get("images") or []

    if not title and not images:
        raise ValueError(
            "Not enough product information for AI analysis."
        )

    prompt = f"""
You are an expert Etsy listing creation and SEO assistant.

Create an Etsy-ready listing from the verified product information below.

OUTPUT LANGUAGE:
{language_name}

SOURCE PRODUCT
----------------
TITLE:
{title}

DESCRIPTION:
{description if description else "Not available"}

PRICE:
{price if price is not None else "Not available"}

CURRENCY:
{currency if currency else "Not available"}

BRAND:
{brand if brand else "Not available"}

IMAGE COUNT:
{len(images)}

IMAGE AVAILABILITY:
{"Available" if images else "Not available"}

SOURCE URL:
{product.get("url", "")}


CORE ACCURACY RULE
----------------
The SOURCE TITLE and SOURCE DESCRIPTION are the ONLY authoritative
sources for product facts.

Every factual claim in the generated listing must be directly supported
by the source.

You may:
- translate verified facts
- rewrite wording
- improve SEO
- reorder verified information
- combine directly supported facts

You MUST NOT invent, infer, or specialize:
- product type or form
- materials
- dimensions or measurements
- colors
- weight
- features or specifications
- personalization method
- manufacturing method
- handmade status
- quality or durability
- compatibility
- installation or mounting
- audiences or occasions
- benefits or use cases
- brand
- shipping, returns, warranty, or shop policies

SEO NEVER overrides factual accuracy.

When a term has a general and specific interpretation, always use the
general interpretation unless the specific meaning is explicitly stated.

Examples:
- "animal" does not mean cat or dog
- "home decor" does not mean wall-mounted
- "canvas print" does not automatically prove material composition
- "personalized" does not explain how personalization works
- "40 inches" does not mean 40 inches wide/tall/diameter
- "party decoration" does not mean birthday or baby shower

If a generated statement cannot be directly traced to the source,
remove it.

Avoid unsupported marketing claims such as:
"stylish", "elegant", "premium", "beautiful", "high quality",
"durable", "long-lasting", "perfect", "luxury", unless explicitly
supported by the source.

Use neutral wording. Do not add subjective marketing claims
such as stylish, beautiful, premium, colorful, elegant, or
"adds a decorative touch" unless explicitly supported by the source.

TASK
----------------
Generate:

1. Etsy optimized title
2. Complete Etsy product description
3. Etsy category
4. Up to 13 Etsy tags
5. SEO keywords
6. Materials
7. Price and currency
8. Quantity
9. Source images
10. Etsy suitability score
11. SEO score
12. Title score
13. Description score
14. Strengths
15. Weaknesses
16. Recommendations
17. Missing information


TITLE
----------------
Create a natural Etsy SEO title.

Rules:
- most important verified keywords first
- readable and natural
- no keyword stuffing
- no unsupported claims
- maximum 140 characters


DESCRIPTION
----------------
Write a useful Etsy-ready description using ONLY verified source facts.

Every sentence must be supported by the source.

Do not add:
- unsupported benefits
- subjective marketing language
- care instructions
- cleaning instructions
- installation instructions
- durability or quality claims
- safety or compatibility claims
- packaging information
- shipping or return information

If the source supports a specific use, mention only that exact use.

Do not mention AliExpress, suppliers, scraping, or the source URL
in the customer-facing description.


CATEGORY
----------------
Choose the most appropriate human-readable Etsy category based on
verified product information.

Do not use an overly specific category unless the source supports it.


TAGS
----------------
Generate up to 13 unique Etsy tags.

Rules:
- maximum 20 characters per tag
- directly supported by the source
- relevant to the actual product
- natural Etsy search phrases
- no unsupported or generic trending keywords
- no duplicate phrases
- never change the product type

Use fewer than 13 if there are not enough trustworthy tags.

CRITICAL:
Every tag must be directly supported by the source.

Never make a general source term more specific for SEO.

For example:
"pet" -> "pet" is valid
"pet" -> "cat", "dog", "cat dog" is invalid

If a tag is not directly supported by the source, do not use it.
KEYWORDS
----------------
Generate relevant SEO keywords using only verified source information.

Do not add product types, materials, features, audiences, occasions,
styles, or use cases that are not explicitly supported.

Never increase specificity for SEO.
General source terms must remain general.
MATERIALS
----------------
Return ONLY materials explicitly stated as materials or composition
in the source.

Product names, categories, product types, and images cannot be used
to infer materials.

Examples:
"canvas print" -> []
"canvas poster" -> []
"made of cotton" -> ["cotton"]

If no material is explicitly stated:
"materials": []


PRICE
----------------
If the source price is reliable, return it with its currency.

If not available or unreliable:
price = null
currency = null

Never invent a price.


QUANTITY
----------------
Return 1 unless the source clearly indicates another quantity.


IMAGES
----------------
Use the provided source image URLs exactly as given.

Do not invent or remove valid source image URLs.

If IMAGE COUNT > 0:
- images are available
- do not claim images are missing
- do not recommend uploading images
- do not judge image quality or resolution

This analyzer does not perform visual quality analysis.


MISSING INFORMATION
----------------
Report ONLY important product facts that are genuinely missing and
would materially help complete this specific listing.

Valid examples:
- important dimensions
- important weight
- material composition
- important product-specific specifications
- color/finish only when the source clearly indicates variants
  but their values cannot be verified
- quantity when the source indicates a set/pack/bundle but quantity
  cannot be verified

Do NOT report as missing:
- shipping
- shipping cost or method
- processing time
- returns/refunds
- warranty
- seller information
- shop policies
- packaging
- care/cleaning
- installation
- handmade status
- certifications
- manufacturing method

Do not infer missing information from images, category, or common
knowledge.

Missing information does not automatically mean the listing is poor.

If no materially important product information is missing:
[]


ANALYSIS
----------------
Evaluate the generated listing from 0 to 100.

ETSY SUITABILITY:
Consider overall usefulness, factual accuracy, title, description,
category, tags, available information, and images.

SEO SCORE:
Consider keyword relevance, coverage, natural wording, and absence
of unsupported or duplicate keywords.

TITLE SCORE:
Consider relevance, clarity, readability, verified keywords,
and absence of keyword stuffing.

DESCRIPTION SCORE:
Consider clarity, usefulness, factual accuracy, and natural wording.

Do not heavily penalize missing information that simply was not
available from the source.

SCORING
----------------
Return ALL scores independently on a 0-100 scale.

IMPORTANT:
Every score below MUST be a number between 0 and 100.
Do NOT use the percentages as score limits.
Do NOT return 15, 20, 30, etc. because of any weighting.
Each score is an independent quality score.

ETS​Y SUITABILITY SCORE:
Overall quality and readiness of the generated Etsy listing.

SEO SCORE:
Evaluate keyword relevance, keyword coverage, tags, search intent,
natural keyword usage, and absence of duplicates or unsupported terms.

Unsupported tags or keywords must significantly reduce the SEO score.
TITLE SCORE:
Evaluate relevance, clarity, readability, important verified keywords,
natural Etsy wording, and absence of keyword stuffing.

DESCRIPTION SCORE:
Evaluate clarity, usefulness, structure, factual accuracy,
and natural wording.

CATEGORY QUALITY:
Evaluate whether the selected category matches the verified
product type and uses appropriate specificity.

SOURCE COMPLETENESS:
Consider important product information available from the source,
but do not heavily penalize information that the source does not provide.

IMAGE AVAILABILITY:
If IMAGE COUNT > 0, consider images available.
Do not penalize the listing because image quality was not analyzed.

SCORING GUIDELINE:
90-100 = Excellent
80-89 = Very good
70-79 = Good
60-69 = Needs improvement
40-59 = Weak
0-39 = Insufficient

Missing source information should not automatically produce a low score.
A missing price, dimensions, shipping information, or shop policy
must not by itself make a strong listing receive a low score.


RECOMMENDATIONS
----------------
Return 2-5 recommendations ONLY when they are materially useful.

Every recommendation must address:
- a real weakness in the generated listing
- important missing product information
- or an objective listing issue

Do not give generic Etsy checklists.

Do not recommend:
- shipping or return policies
- seller information
- packaging
- care instructions
- image uploads when images already exist
- image quality improvements without visual analysis
- unsupported product changes

If there are no meaningful recommendations:
[]


RETURN ONLY JSON
----------------
Return exactly this structure:

{{
  "etsy_listing": {{
    "title": "",
    "description": "",
    "category": "",
    "tags": [],
    "materials": [],
    "keywords": [],
    "price": null,
    "currency": null,
    "quantity": 1,
    "images": []
  }},

  "analysis": {{
    "etsy_suitability_score": 0,
    "seo_score": 0,
    "title_score": 0,
    "description_score": 0,
    "strengths": [],
    "weaknesses": [],
    "recommendations": []
  }},

  "missing_information": []
}}
"""

    # ========================================================
    # AI REQUEST
    # ========================================================

    ai_start = time.perf_counter()

    response = groq_client.chat.completions.create(
        model=settings.groq_model,
        temperature=0,
        response_format={
            "type": "json_object"
        },
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert Etsy listing "
                    f"assistant. Always respond in "
                    f"{language_name}. "
                    "Never invent product facts."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    )

    ai_elapsed = time.perf_counter() - ai_start

    print(
        f"🤖 URL PRODUCT AI ANALYSIS TIME: "
        f"{ai_elapsed:.2f} seconds"
    )

    response_text = (
        response.choices[0].message.content
    )

    if not response_text:
        raise ValueError(
            "Empty AI product analysis response."
        )

    # ========================================================
    # PARSE JSON
    # ========================================================

    try:
        result = json.loads(
            _clean_json_response(
                response_text
            )
        )

    except json.JSONDecodeError as error:

        logger.error(
            "Invalid URL product AI response: %s",
            response_text,
        )

        raise ValueError(
            "AI returned invalid product JSON."
        ) from error

    if not isinstance(result, dict):
        raise ValueError(
            "AI product response is not a JSON object."
        )

    # ========================================================
    # LISTING
    # ========================================================

    listing = result.get(
        "etsy_listing"
    ) or {}

    if not isinstance(listing, dict):
        listing = {}

    listing_title = str(
        listing.get("title")
        or title
    ).strip()

    listing_description = str(
        listing.get("description")
        or ""
    ).strip()

    category = str(
        listing.get("category")
        or ""
    ).strip()

    # ========================================================
    # TAGS
    # ========================================================

    tags = _clean_tags(
        listing.get("tags")
        or []
    )

    # Etsy requires up to 13 tags.
    tags = tags[:13]

    # ========================================================
    # MATERIALS
    # ========================================================

    materials = _clean_string_list(
        listing.get("materials")
    )

    # ========================================================
    # KEYWORDS
    # ========================================================

    keywords = _clean_string_list(
        listing.get("keywords")
    )

    # ========================================================
    # IMAGES
    # ========================================================

    listing_images = listing.get(
        "images"
    )

    if not isinstance(
        listing_images,
        list,
    ):
        listing_images = []

    # We trust scraper images instead of AI-generated URLs.
    listing_images = [
        str(image).strip()
        for image in images
        if image
    ]

    # ========================================================
    # PRICE
    # ========================================================

    listing_price = listing.get(
        "price"
    )

    if listing_price is not None:

        try:
            listing_price = float(
                listing_price
            )
        except (
            TypeError,
            ValueError,
        ):
            listing_price = None

    # ========================================================
    # CURRENCY
    # ========================================================

    listing_currency = (
        listing.get("currency")
        or currency
        or None
    )

    if listing_currency:
        listing_currency = str(
            listing_currency
        ).strip()

    # ========================================================
    # QUANTITY
    # ========================================================

    quantity = listing.get(
        "quantity",
        1,
    )

    try:
        quantity = int(quantity)
    except (
        TypeError,
        ValueError,
    ):
        quantity = 1

    quantity = max(
        1,
        quantity,
    )

    # ========================================================
    # ANALYSIS
    # ========================================================

    analysis = result.get(
        "analysis"
    ) or {}

    if not isinstance(
        analysis,
        dict,
    ):
        analysis = {}

    total_elapsed = time.perf_counter() - total_start

    print(
        f"⏱️ TOTAL URL PRODUCT ANALYSIS TIME: "
        f"{total_elapsed:.2f} seconds"
    )

    # ========================================================
    # RETURN
    # ========================================================

    return {
        "etsy_listing": {
            "title": listing_title,
            "description": listing_description,
            "category": category,
            "tags": tags,
            "materials": materials,
            "keywords": keywords,
            "price": listing_price,
            "currency": listing_currency,
            "quantity": quantity,
            "images": listing_images,
        },

        "analysis": {
            "etsy_suitability_score": _validate_score(
                analysis.get(
                    "etsy_suitability_score"
                )
            ),

            "seo_score": _validate_score(
                analysis.get(
                    "seo_score"
                )
            ),

            "title_score": _validate_score(
                analysis.get(
                    "title_score"
                )
            ),

            "description_score": _validate_score(
                analysis.get(
                    "description_score"
                )
            ),

            "strengths": _clean_string_list(
                analysis.get(
                    "strengths"
                )
            ),

            "weaknesses": _remove_invalid_image_analysis(
    _clean_string_list(
        analysis.get(
            "weaknesses"
        )
    ),
    has_images=bool(images),
),

            "recommendations": _remove_invalid_image_analysis(
    _clean_string_list(
        analysis.get(
            "recommendations"
        )
    ),
    has_images=bool(images),
),
        },

        "missing_information": _remove_invalid_image_analysis(
    _clean_string_list(
        result.get(
            "missing_information"
        )
    ),
    has_images=bool(images),
),
    }