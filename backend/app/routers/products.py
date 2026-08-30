from datetime import datetime
import json
import requests

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models.etsy_listing import EtsyListing
from app.models.etsy_connection import EtsyConnection
from app.routers.etsy import get_current_user_id

from app.services.etsy_ai_service import (
    analyze_etsy_images,
    analyze_etsy_listing,
    optimize_etsy_listing,
    optimize_etsy_image,
    analyze_product_from_url,
)
from app.services.product_url_service import fetch_product_from_url

router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


# ============================================================
# REQUEST SCHEMA
# ============================================================

class ApplyOptimizationRequest(BaseModel):
    optimized_title: str
    optimized_description: str
    optimized_tags: list[str]

class ProductUrlRequest(BaseModel):
    url: str
    language: str = "en"
# ============================================================
# DATABASE
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# GET PRODUCTS
# ============================================================

@router.get("")
def get_products(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    connection = (
        db.query(EtsyConnection)
        .filter(
            EtsyConnection.user_id == user_id
        )
        .first()
    )

    if not connection:
        raise HTTPException(
            status_code=404,
            detail="Etsy shop is not connected.",
        )

    listings = (
        db.query(EtsyListing)
        .filter(
            EtsyListing.user_id == user_id,
            EtsyListing.state == "active",
        )
        .order_by(
            EtsyListing.updated_at.desc()
        )
        .all()
    )

    return {
        "count": len(listings),
        "results": [
            {
                "id": listing.id,
                "listing_id": listing.listing_id,
                "shop_id": listing.shop_id,
                "title": listing.title,
                "description": listing.description,
                "price": (
                    float(listing.price)
                    if listing.price is not None
                    else None
                ),
                "quantity": listing.quantity,
                "state": listing.state,
                "url": listing.url,
                "image_url": listing.image_url,
                "image_count": listing.image_count,
                "image_urls": listing.image_urls,
                "tags": listing.tags,
                "created_at": listing.created_at,
                "updated_at": listing.updated_at,
            }
            for listing in listings
        ],
    }


# ============================================================
# ANALYZE PRODUCT
# ============================================================

@router.post("/{listing_id}/analyze")
def analyze_product(
    listing_id: str,
    language: str = "en",
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    listing = (
        db.query(EtsyListing)
        .filter(
            EtsyListing.listing_id == listing_id,
            EtsyListing.user_id == user_id,
            EtsyListing.state == "active",
        )
        .first()
    )

    if not listing:
        raise HTTPException(
            status_code=404,
            detail="Product not found.",
        )

    tags: list[str] = []

    if listing.tags:
        try:
            parsed_tags = json.loads(listing.tags)

            if isinstance(parsed_tags, list):
                tags = [
                    tag
                    for tag in parsed_tags
                    if isinstance(tag, str)
                ]

        except json.JSONDecodeError:
            tags = []

    if language not in {"tr", "en"}:
        language = "en"

    try:
        analysis = analyze_etsy_listing(
            title=listing.title or "",
            description=listing.description or "",
            tags=tags,
            language=language,
        )

    except Exception as error:
        print(
            "Etsy AI analysis error:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail="AI analysis failed.",
        )

    return {
        "listing_id": listing.listing_id,
        "title": listing.title,
        "analysis": analysis,
    }


# ============================================================
# VISUAL ANALYSIS
# ============================================================

@router.post("/{listing_id}/visual-analyze")
def analyze_product_images(
    listing_id: str,
    language: str = "en",
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    listing = (
        db.query(EtsyListing)
        .filter(
            EtsyListing.listing_id == listing_id,
            EtsyListing.user_id == user_id,
            EtsyListing.state == "active",
        )
        .first()
    )

    if not listing:
        raise HTTPException(
            status_code=404,
            detail="Product not found.",
        )

    if language not in {"tr", "en"}:
        language = "en"

    image_urls: list[str] = []

    if listing.image_urls:
        try:
            parsed_images = json.loads(
                listing.image_urls
            )

            if isinstance(parsed_images, list):
                image_urls = [
                    image
                    for image in parsed_images
                    if isinstance(image, str)
                    and image.strip()
                ]

        except json.JSONDecodeError:
            image_urls = []

    if not image_urls and listing.image_url:
        image_urls = [listing.image_url]

    if not image_urls:
        raise HTTPException(
            status_code=400,
            detail=(
                "No product images available "
                "for analysis."
            ),
        )

    try:
        analysis = analyze_etsy_images(
            image_urls=image_urls,
            language=language,
        )

    except Exception as error:
        print(
            "Etsy visual analysis error:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )

    return {
        "listing_id": listing.listing_id,
        "title": listing.title,
        "image_count": len(image_urls),
        "analysis": analysis,
    }


# ============================================================
# OPTIMIZE PRODUCT
# ============================================================

@router.post("/{listing_id}/optimize")
def optimize_product(
    listing_id: str,
    language: str = "en",
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    listing = (
        db.query(EtsyListing)
        .filter(
            EtsyListing.listing_id == listing_id,
            EtsyListing.user_id == user_id,
            EtsyListing.state == "active",
        )
        .first()
    )

    if not listing:
        raise HTTPException(
            status_code=404,
            detail="Product not found.",
        )

    if language not in {"tr", "en"}:
        language = "en"

    # --------------------------------------------------------
    # CURRENT TAGS
    # --------------------------------------------------------

    tags: list[str] = []

    if listing.tags:
        try:
            parsed_tags = json.loads(listing.tags)

            if isinstance(parsed_tags, list):
                tags = [
                    tag
                    for tag in parsed_tags
                    if isinstance(tag, str)
                ]

        except json.JSONDecodeError:
            tags = []

    # --------------------------------------------------------
    # AI OPTIMIZATION
    # --------------------------------------------------------

    try:
        optimization = optimize_etsy_listing(
            title=listing.title or "",
            description=listing.description or "",
            tags=tags,
            language=language,
        )

    except Exception as error:
        print(
            "Etsy AI optimization error:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail="AI optimization failed.",
        )

    # --------------------------------------------------------
    # CURRENT ANALYSIS
    # --------------------------------------------------------

    try:
        current_analysis = analyze_etsy_listing(
            title=listing.title or "",
            description=listing.description or "",
            tags=tags,
            language=language,
        )

    except Exception as error:
        print(
            "Current listing analysis error:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail="Could not analyze current listing.",
        )

    # --------------------------------------------------------
    # OPTIMIZED VALUES
    # --------------------------------------------------------

    optimized_title = (
        optimization.get("optimized_title")
        or listing.title
        or ""
    )

    optimized_description = (
        optimization.get("optimized_description")
        or listing.description
        or ""
    )

    optimized_tags = optimization.get(
        "optimized_tags",
        [],
    )

    if not isinstance(optimized_tags, list):
        optimized_tags = []

    # --------------------------------------------------------
    # ETSY TAG VALIDATION
    # Max 13 tags / max 20 characters
    # --------------------------------------------------------

    cleaned_tags: list[str] = []
    seen_tags: set[str] = set()

    for tag in optimized_tags:

        if not isinstance(tag, str):
            continue

        tag = tag.strip()

        if not tag:
            continue

        if len(tag) > 20:
            continue

        tag_key = tag.lower()

        if tag_key in seen_tags:
            continue

        seen_tags.add(tag_key)
        cleaned_tags.append(tag)

        if len(cleaned_tags) >= 13:
            break

    if not cleaned_tags:
        cleaned_tags = tags[:13]

    optimized_tags = cleaned_tags

    # --------------------------------------------------------
    # OPTIMIZED ANALYSIS
    # --------------------------------------------------------

    try:
        optimized_analysis = analyze_etsy_listing(
            title=optimized_title,
            description=optimized_description,
            tags=optimized_tags,
            language=language,
        )

    except Exception as error:
        print(
            "Optimized listing analysis error:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail="Could not analyze optimized listing.",
        )

    # --------------------------------------------------------
    # SCORE COMPARISON
    # --------------------------------------------------------

    current_score = int(
        current_analysis.get("seo_score", 0)
    )

    optimized_score = int(
        optimized_analysis.get("seo_score", 0)
    )

    score_difference = (
        optimized_score - current_score
    )

    recommendation = (
        "apply"
        if optimized_score >= current_score
        else "keep_current"
    )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "listing_id": listing.listing_id,

        "current": {
            "title": listing.title,
            "description": listing.description,
            "tags": tags,
            "score": current_score,
            "analysis": current_analysis,
        },

        "optimized": {
            "optimized_title": optimized_title,
            "optimized_description": optimized_description,
            "optimized_tags": optimized_tags,
            "score": optimized_score,
            "score_difference": score_difference,
            "analysis": optimized_analysis,
            "changes": optimization.get(
                "changes",
                [],
            ),
        },

        "recommendation": recommendation,
    }

# ============================================================
# VISUAL OPTIMIZATION
# ============================================================

@router.post("/{listing_id}/visual-optimize")
def optimize_product_image(
    listing_id: str,
    language: str = "en",
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # FIND LISTING
    # --------------------------------------------------------

    listing = (
        db.query(EtsyListing)
        .filter(
            EtsyListing.listing_id == listing_id,
            EtsyListing.user_id == user_id,
            EtsyListing.state == "active",
        )
        .first()
    )

    if not listing:
        raise HTTPException(
            status_code=404,
            detail="Product not found.",
        )

    # --------------------------------------------------------
    # IMAGE URL
    # --------------------------------------------------------

    image_url = listing.image_url

    if not image_url:
        raise HTTPException(
            status_code=400,
            detail=(
                "No product image available "
                "for optimization."
            ),
        )

    # --------------------------------------------------------
    # LANGUAGE
    # --------------------------------------------------------

    if language not in {"tr", "en"}:
        language = "en"

    # --------------------------------------------------------
    # AI IMAGE OPTIMIZATION
    # --------------------------------------------------------

    try:
        optimized_image = optimize_etsy_image(
            image_url=image_url,
            language=language,
        )

    except requests.RequestException as error:
        print(
            "Etsy image download error:",
            repr(error),
        )

        raise HTTPException(
            status_code=502,
            detail=(
                "Could not download the Etsy "
                "product image."
            ),
        )

    except Exception as error:
        print(
            "Etsy visual optimization error:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "AI image optimization failed."
            ),
        )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "listing_id": listing.listing_id,
        "title": listing.title,

        "original_image": image_url,

        "optimized_image": optimized_image,

        "message": (
            "Product image optimized successfully."
        ),
    }

# ============================================================
# ANALYZE PRODUCT FROM URL
# ============================================================

@router.post("/url-analyze")
def analyze_product_url(
    payload: ProductUrlRequest,
):
    # --------------------------------------------------------
    # VALIDATE LANGUAGE
    # --------------------------------------------------------

    language = payload.language

    if language not in {"tr", "en"}:
        language = "en"

    # --------------------------------------------------------
    # FETCH PRODUCT
    # --------------------------------------------------------

    try:
        product = fetch_product_from_url(
            payload.url
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except RuntimeError as error:
        print(
            "Product URL fetch error:",
            repr(error),
        )

        raise HTTPException(
            status_code=502,
            detail=str(error),
        )

    except Exception as error:
        print(
            "Unexpected product URL error:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail="Could not analyze product URL.",
        )

    # --------------------------------------------------------
    # CHECK PRODUCT DATA
    # --------------------------------------------------------

    if not product.get("title"):
        raise HTTPException(
            status_code=422,
            detail=(
                "Could not detect product information "
                "from this URL."
            ),
        )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    try:
        analysis = analyze_product_from_url(
        product=product,
        language=language,
    )

    except ValueError as error:
     raise HTTPException(
        status_code=422,
        detail=str(error),
    )

    except Exception as error:
      print(
        "AI product analysis error:",
        repr(error),
    )

      raise HTTPException(
        status_code=500,
        detail=f"AI product analysis failed: {str(error)}",
    )

    return {
    "success": True,
    "language": language,
    "product": product,
    "analysis": analysis,
}
# ============================================================
# APPLY OPTIMIZATION
# ============================================================

@router.put("/{listing_id}/apply-optimization")
def apply_product_optimization(
    listing_id: str,
    payload: ApplyOptimizationRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # FIND LISTING
    # --------------------------------------------------------

    listing = (
        db.query(EtsyListing)
        .filter(
            EtsyListing.listing_id == listing_id,
            EtsyListing.user_id == user_id,
            EtsyListing.state == "active",
        )
        .first()
    )

    if not listing:
        raise HTTPException(
            status_code=404,
            detail="Product not found.",
        )

    # --------------------------------------------------------
    # ETSY CONNECTION
    # --------------------------------------------------------

    connection = (
        db.query(EtsyConnection)
        .filter(
            EtsyConnection.user_id == user_id
        )
        .first()
    )

    if not connection:
        raise HTTPException(
            status_code=404,
            detail="Etsy shop is not connected.",
        )

    if not connection.access_token:
        raise HTTPException(
            status_code=401,
            detail="Etsy access token is missing.",
        )

    if connection.expires_at <= datetime.utcnow():
        raise HTTPException(
            status_code=401,
            detail=(
                "Etsy access token has expired. "
                "Please reconnect your Etsy shop."
            ),
        )

    # --------------------------------------------------------
    # SHOP ID
    # --------------------------------------------------------

    shop_id = (
        connection.shop_id
        or listing.shop_id
    )

    if not shop_id:
        raise HTTPException(
            status_code=400,
            detail="Etsy shop ID is missing.",
        )

    # --------------------------------------------------------
    # CLEAN TITLE / DESCRIPTION
    # --------------------------------------------------------

    optimized_title = (
        payload.optimized_title.strip()
    )

    optimized_description = (
        payload.optimized_description.strip()
    )

    # --------------------------------------------------------
    # CLEAN TAGS
    # --------------------------------------------------------

    optimized_tags: list[str] = []
    seen_tags: set[str] = set()

    for tag in payload.optimized_tags:

        if not isinstance(tag, str):
            continue

        tag = tag.strip()

        if not tag:
            continue

        # Etsy max 20 chars
        if len(tag) > 20:
            continue

        tag_key = tag.lower()

        if tag_key in seen_tags:
            continue

        seen_tags.add(tag_key)
        optimized_tags.append(tag)

        # Etsy max 13 tags
        if len(optimized_tags) >= 13:
            break

    # --------------------------------------------------------
    # BASIC VALIDATION
    # --------------------------------------------------------

    if not optimized_title:
        raise HTTPException(
            status_code=400,
            detail="Optimized title cannot be empty.",
        )

    if not optimized_description:
        raise HTTPException(
            status_code=400,
            detail="Optimized description cannot be empty.",
        )

    if not optimized_tags:
        raise HTTPException(
            status_code=400,
            detail="Optimized tags cannot be empty.",
        )

    # --------------------------------------------------------
    # CURRENT TAGS
    # --------------------------------------------------------

    current_tags: list[str] = []

    if listing.tags:
        try:
            parsed_tags = json.loads(
                listing.tags
            )

            if isinstance(parsed_tags, list):
                current_tags = [
                    tag
                    for tag in parsed_tags
                    if isinstance(tag, str)
                ]

        except json.JSONDecodeError:
            current_tags = []

    # --------------------------------------------------------
    # FINAL SAFETY CHECK
    # --------------------------------------------------------

    try:
        current_analysis = analyze_etsy_listing(
            title=listing.title or "",
            description=listing.description or "",
            tags=current_tags,
            language="en",
        )

        optimized_analysis = analyze_etsy_listing(
            title=optimized_title,
            description=optimized_description,
            tags=optimized_tags,
            language="en",
        )

    except Exception as error:
        print(
            "Optimization safety check error:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Could not verify optimization quality."
            ),
        )

    current_score = int(
        current_analysis.get("seo_score", 0)
    )

    optimized_score = int(
        optimized_analysis.get("seo_score", 0)
    )

    # --------------------------------------------------------
    # DO NOT APPLY LOWER SCORE
    # --------------------------------------------------------

    if optimized_score < current_score:
        raise HTTPException(
            status_code=409,
            detail={
                "message": (
                    "Optimization was not applied because "
                    "the optimized listing scored lower "
                    "than the current listing."
                ),
                "current_score": current_score,
                "optimized_score": optimized_score,
                "score_difference": (
                    optimized_score - current_score
                ),
            },
        )

    # --------------------------------------------------------
    # ETSY URL
    # --------------------------------------------------------

    etsy_url = (
        "https://api.etsy.com/v3/application/"
        f"shops/{shop_id}/listings/{listing_id}"
    )

    # --------------------------------------------------------
    # ETSY HEADERS
    # --------------------------------------------------------

    headers = {
        "x-api-key": (
            f"{settings.etsy_api_key}:"
            f"{settings.etsy_shared_secret}"
        ),
        "Authorization": (
            f"Bearer {connection.access_token}"
        ),
        "Content-Type": (
            "application/x-www-form-urlencoded"
        ),
    }

    # --------------------------------------------------------
    # ETSY FORM DATA
    # --------------------------------------------------------

    etsy_data = [
        (
            "title",
            optimized_title,
        ),
        (
            "description",
            optimized_description,
        ),
    ]

    for tag in optimized_tags:
        etsy_data.append(
            (
                "tags",
                tag,
            )
        )

    # --------------------------------------------------------
    # UPDATE ETSY
    # --------------------------------------------------------

    try:
        response = requests.patch(
            etsy_url,
            headers=headers,
            data=etsy_data,
            timeout=20,
        )

    except requests.RequestException as error:
        print(
            "Etsy listing update request error:",
            repr(error),
        )

        raise HTTPException(
            status_code=502,
            detail="Could not connect to Etsy.",
        )

    # --------------------------------------------------------
    # ETSY ERROR
    # --------------------------------------------------------

    if not response.ok:
        print(
            "Etsy listing update failed:",
            response.status_code,
            response.text,
        )

        raise HTTPException(
            status_code=response.status_code,
            detail=(
                "Etsy listing update failed: "
                f"{response.text}"
            ),
        )

    # --------------------------------------------------------
    # UPDATE LOCAL DATABASE
    # --------------------------------------------------------

    listing.title = optimized_title

    listing.description = (
        optimized_description
    )

    listing.tags = json.dumps(
        optimized_tags,
        ensure_ascii=False,
    )

    db.commit()
    db.refresh(listing)

    # --------------------------------------------------------
    # SUCCESS
    # --------------------------------------------------------

    return {
        "message": (
            "Listing optimization applied "
            "successfully."
        ),

        "listing_id": listing.listing_id,

        "score": {
            "before": current_score,
            "after": optimized_score,
            "difference": (
                optimized_score - current_score
            ),
        },

        "etsy": {
            "shop_id": str(shop_id),
            "listing_id": str(listing_id),
            "updated_fields": [
                "title",
                "description",
                "tags",
            ],
        },

        "product": {
            "title": listing.title,
            "description": listing.description,
            "tags": optimized_tags,
        },
    }