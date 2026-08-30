import base64
import io
import json
import logging
import os
import re

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

Provide 2-5 actionable recommendations.

Every recommendation must correspond to an actual weakness.

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

Your job is to take product information collected from
an external product URL and prepare the product for
listing on Etsy.

OUTPUT LANGUAGE:
{language_name}

============================================================
SOURCE PRODUCT
============================================================

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

SOURCE URL:
{product.get("url", "")}

============================================================
IMPORTANT ACCURACY RULES
============================================================

The source product information may be incomplete.

NEVER invent information.

Do not invent:
- materials
- dimensions
- colors
- weight
- certifications
- manufacturing method
- handmade status
- personalization
- shipping information
- return policy
- warranty
- brand
- product specifications

If information is unavailable, put it in
"missing_information".

You may improve wording and SEO, but the actual
product facts must remain accurate.

============================================================
YOUR TASK
============================================================

Prepare an Etsy-ready product listing.

Generate:

1. Etsy optimized title
2. Complete Etsy product description
3. Etsy category
4. Etsy tags
5. SEO keywords
6. Materials
7. Product attributes when information is available
8. Recommended price only when enough information exists
9. Product quantity recommendation
10. Missing information
11. Etsy suitability score
12. SEO score
13. Title quality score
14. Description quality score
15. Recommendations

============================================================
TITLE
============================================================

Create a natural Etsy SEO title.

Rules:

- Put the most important product keywords first.
- Do not keyword stuff.
- Keep it readable.
- Do not make unsupported claims.
- Do not invent product characteristics.
- Maximum 140 characters.

============================================================
DESCRIPTION
============================================================

Create a complete Etsy-ready product description.

The description should include, when supported by
the available information:

- short introduction
- product characteristics
- materials
- size/specifications
- ideal use
- gift occasions
- care information

Do NOT invent missing details.

If information is unavailable, simply omit that detail.

Do not mention AliExpress, dropshipping, supplier,
source URL or scraping in the customer-facing description.

============================================================
CATEGORY
============================================================

Return the most appropriate Etsy category based on
the available product information.

Use a human-readable category path.

Example:

Jewelry > Necklaces > Pendant Necklaces

Do not invent an overly specific category if the
product information does not support it.

============================================================
TAGS
============================================================

Generate exactly 13 Etsy tags when enough information
exists.

Rules:

- maximum 20 characters per tag
- unique tags
- relevant to the product
- natural Etsy search phrases
- no unrelated trending keywords
- no unsupported claims
- avoid duplicate phrases

============================================================
MATERIALS
============================================================

Return only materials explicitly supported by the
source information.

If no reliable material information exists, return [].

============================================================
PRICE
============================================================

If the source price exists and is reliable:

- return the source price
- return its currency

If there is not enough information for a recommended
selling price, return null.

Never invent a price.

============================================================
QUANTITY
============================================================

Return 1 unless the source clearly indicates another
quantity.

============================================================
MISSING INFORMATION
============================================================

List information that would normally be useful for
an Etsy listing but could not be verified.

Examples:

- necklace length
- product weight
- color
- shipping information
- return policy

Only include genuinely missing information.

============================================================
ETSY SUITABILITY
============================================================

Estimate how ready the product information is for
an Etsy listing.

This score is NOT a legal determination.

It should reflect:

- completeness
- listing quality
- product information
- SEO readiness

============================================================
RETURN ONLY JSON
============================================================

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

            "weaknesses": _clean_string_list(
                analysis.get(
                    "weaknesses"
                )
            ),

            "recommendations": _clean_string_list(
                analysis.get(
                    "recommendations"
                )
            ),
        },

        "missing_information": _clean_string_list(
            result.get(
                "missing_information"
            )
        ),
    }