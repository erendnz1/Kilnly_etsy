from datetime import datetime
import json
import requests
from app.services.supplier_finder_service import (
    debug_aliexpress_product,
)
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.config import settings
from app.database import SessionLocal
from app.models.etsy_listing import EtsyListing
from app.models.etsy_connection import EtsyConnection
from app.routers.etsy import get_current_user_id
from app.services.supplier_finder_service import (
    find_suppliers,
)
from app.services.etsy_ai_service import (
    analyze_etsy_images,
    analyze_etsy_listing,
    optimize_etsy_listing,
    optimize_etsy_image,
    analyze_product_from_url,
    identify_product_from_image,
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

class SupplierImageRequest(BaseModel):
    image_url: str
    language: str = "en"

class PriceProfitRequest(BaseModel):
    product_cost_usd: float
    selling_price_usd: float
    usd_try_rate: float

    source: str = "turkey"
    destination: str = "usa"
    quantity: int = 1

    buyer_shipping_usd: float | None = None
    actual_shipping_cost_usd: float | None = None

    currency_conversion: bool = True
    offsite_ads: bool = False
class ProductCostRequest(BaseModel):
    product_cost_usd: float
    actual_shipping_cost_usd: float = 0.0

    supplier_source: str | None = None
    supplier_url: str | None = None
class BulkPriceProfitRequest(BaseModel):
    usd_try_rate: float = 48.30
    destination: str = "usa"
    currency_conversion: bool = True
    offsite_ads: bool = False
# ============================================================
# SHIPPING PROFILES
# ============================================================

SHIPPING_PROFILES = {
    "aliexpress": {
        "china": {
            "one_item": 5.00,
            "additional_item": 0.00,
        },
        "other": {
            "one_item": 8.90,
            "additional_item": 0.00,
        },
    },

    "turkey": {
        "turkey": {
            "one_item": 2.00,
            "additional_item": 0.00,
        },
        "canada": {
            "one_item": 9.43,
            "additional_item": 4.43,
        },
        "usa": {
            "one_item": 9.71,
            "additional_item": 4.42,
        },
        "other": {
            "one_item": 9.71,
            "additional_item": 6.45,
        },
    },
}
# ============================================================
# DATABASE
# ============================================================
# ============================================================
# GET SHIPPING COST
# ============================================================

def get_shipping_cost(
    source: str,
    destination: str,
    quantity: int = 1,
) -> float:

    source = source.lower().strip()
    destination = destination.lower().strip()

    if quantity < 1:
        quantity = 1

    profile = SHIPPING_PROFILES.get(source)

    if not profile:
        raise ValueError(
            f"Unknown shipping source: {source}"
        )

    # --------------------------------------------------------
    # DESTINATION
    # --------------------------------------------------------

    destination_profile = profile.get(
        destination
    )

    if not destination_profile:
        destination_profile = profile.get(
            "other"
        )

    if not destination_profile:
        raise ValueError(
            "Shipping destination is not supported."
        )

    # --------------------------------------------------------
    # FIRST ITEM
    # --------------------------------------------------------

    total = destination_profile["one_item"]

    # --------------------------------------------------------
    # ADDITIONAL ITEMS
    # --------------------------------------------------------

    if quantity > 1:
        additional_quantity = quantity - 1

        total += (
            additional_quantity
            * destination_profile["additional_item"]
        )

    return round(total, 2)
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

"product_cost_usd": (
    float(listing.product_cost_usd)
    if listing.product_cost_usd is not None
    else None
),

"actual_shipping_cost_usd": (
    float(listing.actual_shipping_cost_usd)
    if listing.actual_shipping_cost_usd is not None
    else None
),

"supplier_source": listing.supplier_source,

"supplier_url": listing.supplier_url,

"created_at": listing.created_at,
"updated_at": listing.updated_at, 
            }
            for listing in listings
        ],
    }


# ============================================================
# ANALYZE PRODUCT
# ============================================================
# ============================================================
# FIND SUPPLIER FROM IMAGE
# ============================================================

@router.post("/supplier/find-from-image")
def find_supplier_from_image(
    payload: SupplierImageRequest,
):
    """
    Analyze an external product image and find
    potential AliExpress supplier URLs.
    """

    image_url = payload.image_url.strip()

    if not image_url:
        raise HTTPException(
            status_code=400,
            detail="Product image URL is required.",
        )

    if payload.language not in {"tr", "en"}:
        language = "en"
    else:
        language = payload.language

    # --------------------------------------------------------
    # 1. AI PRODUCT IDENTIFICATION
    # --------------------------------------------------------

    try:
        product_analysis = identify_product_from_image(
            image_url=image_url,
            language=language,
        )

    except Exception as error:
        print(
            "Product image identification error:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail="Could not identify the product from image.",
        )

    if not product_analysis:
        raise HTTPException(
            status_code=422,
            detail="Could not identify product from image.",
        )

    title = (
        product_analysis.get("search_query")
        or product_analysis.get("title")
    )

    if not title:
        raise HTTPException(
            status_code=422,
            detail="Could not generate a supplier search query.",
        )

    description = (
        product_analysis.get("description")
        or ""
    )

    # --------------------------------------------------------
    # 2. FIND SUPPLIERS
    # --------------------------------------------------------

    try:
        suppliers = find_suppliers(
            title=title,
            description=description,
            image_urls=[image_url],
        )

    except Exception as error:
        print(
            "Supplier finder error:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail="Could not find suppliers.",
        )

    # --------------------------------------------------------
    # 3. RETURN ONLY SUPPLIER LINKS
    # --------------------------------------------------------

    supplier_links = [
        {
            "url": supplier["url"],
        }
        for supplier in suppliers
        if supplier.get("url")
    ]

    return {
        "success": True,
        "product": {
            "title": product_analysis.get(
                "title",
                title,
            ),
            "search_query": title,
        },
        "count": len(supplier_links),
        "suppliers": supplier_links,
    }
# ============================================================
# PRICE & PROFIT CALCULATOR
# ============================================================

# ============================================================
# PRICE & PROFIT CALCULATOR
# ============================================================

@router.post("/price-profit")
def calculate_price_profit(

    payload: PriceProfitRequest,
):
    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if payload.product_cost_usd < 0:
        raise HTTPException(
            status_code=400,
            detail="Product cost cannot be negative.",
        )

    if payload.selling_price_usd <= 0:
        raise HTTPException(
            status_code=400,
            detail="Selling price must be greater than zero.",
        )

    if payload.usd_try_rate <= 0:
        raise HTTPException(
            status_code=400,
            detail="USD/TRY rate must be greater than zero.",
        )

    if payload.quantity < 1:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be at least 1.",
        )

    if (
        payload.buyer_shipping_usd is not None
        and payload.buyer_shipping_usd < 0
    ):
        raise HTTPException(
            status_code=400,
            detail="Buyer shipping cannot be negative.",
        )

    if (
        payload.actual_shipping_cost_usd is not None
        and payload.actual_shipping_cost_usd < 0
    ):
        raise HTTPException(
            status_code=400,
            detail="Actual shipping cost cannot be negative.",
        )

    # --------------------------------------------------------
    # PRODUCT VALUES
    # --------------------------------------------------------

    product_cost_per_unit = (
        payload.product_cost_usd
    )

    selling_price_per_unit = (
        payload.selling_price_usd
    )

    quantity = payload.quantity

    total_product_cost = (
        product_cost_per_unit * quantity
    )

    total_selling_price = (
        selling_price_per_unit * quantity
    )

    # --------------------------------------------------------
    # BUYER SHIPPING
    #
    # This is what the Etsy customer pays.
    # --------------------------------------------------------

    if payload.buyer_shipping_usd is not None:

        buyer_shipping = (
            payload.buyer_shipping_usd
        )

        buyer_shipping_source = "manual"

    else:

        try:
            buyer_shipping = get_shipping_cost(
                source=payload.source,
                destination=payload.destination,
                quantity=quantity,
            )

        except ValueError as error:

            raise HTTPException(
                status_code=400,
                detail=str(error),
            )

        buyer_shipping_source = (
            "shipping_profile"
        )

    # --------------------------------------------------------
    # ACTUAL SHIPPING COST
    #
    # This is what the seller actually pays.
    #
    # We do NOT assume it equals buyer shipping.
    # --------------------------------------------------------

    if payload.actual_shipping_cost_usd is not None:

        actual_shipping_cost = (
            payload.actual_shipping_cost_usd
        )

        actual_shipping_source = "manual"

    else:

        # Until we connect real supplier
        # shipping data, default to zero.
        #
        # This is especially useful when a supplier
        # offers free shipping.

        actual_shipping_cost = 0.0

        actual_shipping_source = (
            "not_provided"
        )

    # --------------------------------------------------------
    # ORDER TOTAL
    #
    # Etsy charges percentage-based fees on
    # item price + buyer-paid shipping.
    # --------------------------------------------------------

    order_total = (
        total_selling_price
        + buyer_shipping
    )

    # --------------------------------------------------------
    # ETSY FEES
    #
    # Transaction fee:
    # 6.5% of item + buyer shipping
    #
    # Payment processing:
    # 6.5% + 14 TRY
    #
    # Regulatory operating fee:
    # 1.67%
    #
    # Listing fee:
    # $0.20
    # --------------------------------------------------------

    transaction_fee = (
        order_total * 0.065
    )

    payment_processing_percent = (
        order_total * 0.065
    )

    payment_processing_flat_try = 14.0

    regulatory_fee = (
        order_total * 0.0167
    )

    listing_fee = 0.20

    # --------------------------------------------------------
    # CURRENCY CONVERSION
    # --------------------------------------------------------

    conversion_fee = 0.0

    if payload.currency_conversion:
        conversion_fee = (
            order_total * 0.025
        )

    # --------------------------------------------------------
    # OFFSITE ADS
    #
    # Conservative assumption:
    # 15%
    # --------------------------------------------------------

    offsite_ads_fee = 0.0

    if payload.offsite_ads:
        offsite_ads_fee = (
            order_total * 0.15
        )

    # --------------------------------------------------------
    # PAYMENT PROCESSING TOTAL
    # --------------------------------------------------------

    payment_processing_usd = (
        payment_processing_percent
        + (
            payment_processing_flat_try
            / payload.usd_try_rate
        )
    )

    # --------------------------------------------------------
    # TOTAL ETSY FEES
    # --------------------------------------------------------

    total_etsy_fees_usd = (
        transaction_fee
        + payment_processing_usd
        + regulatory_fee
        + listing_fee
        + conversion_fee
        + offsite_ads_fee
    )

    # --------------------------------------------------------
    # TOTAL COST
    # --------------------------------------------------------

    total_cost_usd = (
        total_product_cost
        + actual_shipping_cost
        + total_etsy_fees_usd
    )

    # --------------------------------------------------------
    # PROFIT
    # --------------------------------------------------------

    estimated_profit_usd = (
        total_selling_price
        + buyer_shipping
        - total_product_cost
        - actual_shipping_cost
        - total_etsy_fees_usd
    )

    estimated_profit_try = (
        estimated_profit_usd
        * payload.usd_try_rate
    )

    # --------------------------------------------------------
    # PROFIT MARGIN
    # --------------------------------------------------------

    if total_selling_price > 0:
        profit_margin = (
            estimated_profit_usd
            / total_selling_price
        ) * 100
    else:
        profit_margin = 0.0

    # --------------------------------------------------------
    # BREAK-EVEN PRICE
    #
    # Percentage fees apply to:
    #
    # selling price + buyer shipping
    #
    # Therefore buyer shipping must be included
    # in the break-even calculation.
    # --------------------------------------------------------

    percentage_fee_rate = (
        0.065
        + 0.065
        + 0.0167
    )

    if payload.currency_conversion:
        percentage_fee_rate += 0.025

    if payload.offsite_ads:
        percentage_fee_rate += 0.15

    flat_fees_usd = (
        0.20
        + (
            14.0
            / payload.usd_try_rate
        )
    )

    # --------------------------------------------------------
    # BREAK-EVEN
    #
    # P + buyer_shipping
    # - product_cost
    # - actual_shipping
    # - percentage_fee(P + buyer_shipping)
    # - flat_fees = 0
    #
    # Therefore:
    #
    # P =
    # (
    # product_cost
    # + actual_shipping
    # + percentage_fee * buyer_shipping
    # + flat_fees
    # )
    # /
    # (1 - percentage_fee)
    # --------------------------------------------------------

    break_even_price_total = (
        total_product_cost
        + actual_shipping_cost
        + (
            percentage_fee_rate
            * buyer_shipping
        )
        + flat_fees_usd
    ) / (
        1 - percentage_fee_rate
    )

    break_even_price_per_unit = (
        break_even_price_total
        / quantity
    )

    # --------------------------------------------------------
    # RECOMMENDED PRICE RANGE
    # --------------------------------------------------------

    recommended_price_low = (
        break_even_price_per_unit
        * 1.30
    )

    recommended_price = (
        break_even_price_per_unit
        * 1.50
    )

    recommended_price_high = (
        break_even_price_per_unit
        * 1.70
    )

    # --------------------------------------------------------
    # RETURN
    # --------------------------------------------------------

    return {
        "success": True,

        "input": {
            "product_cost_usd": round(
                product_cost_per_unit,
                2,
            ),

            "selling_price_usd": round(
                selling_price_per_unit,
                2,
            ),

            "buyer_shipping_usd": round(
                buyer_shipping,
                2,
            ),

            "actual_shipping_cost_usd": round(
                actual_shipping_cost,
                2,
            ),

            "usd_try_rate": round(
                payload.usd_try_rate,
                4,
            ),

            "source": payload.source,

            "destination": payload.destination,

            "quantity": quantity,

            "buyer_shipping_source": (
                buyer_shipping_source
            ),

            "actual_shipping_source": (
                actual_shipping_source
            ),

            "currency_conversion": (
                payload.currency_conversion
            ),

            "offsite_ads": (
                payload.offsite_ads
            ),
        },

        "order": {
            "item_price_usd": round(
                total_selling_price,
                2,
            ),

            "shipping_usd": round(
                buyer_shipping,
                2,
            ),

            "order_total_usd": round(
                order_total,
                2,
            ),
        },

        "etsy_fees": {
            "transaction_fee_usd": round(
                transaction_fee,
                2,
            ),

            "payment_processing_usd": round(
                payment_processing_usd,
                2,
            ),

            "regulatory_fee_usd": round(
                regulatory_fee,
                2,
            ),

            "listing_fee_usd": round(
                listing_fee,
                2,
            ),

            "currency_conversion_usd": round(
                conversion_fee,
                2,
            ),

            "offsite_ads_usd": round(
                offsite_ads_fee,
                2,
            ),

            "total_usd": round(
                total_etsy_fees_usd,
                2,
            ),
        },

        "costs": {
            "product_cost_usd": round(
                total_product_cost,
                2,
            ),

            "actual_shipping_usd": round(
                actual_shipping_cost,
                2,
            ),

            "total_cost_before_etsy_fees_usd": round(
                total_product_cost
                + actual_shipping_cost,
                2,
            ),
        },

        "profit": {
            "total_cost_usd": round(
                total_cost_usd,
                2,
            ),

            "estimated_profit_usd": round(
                estimated_profit_usd,
                2,
            ),

            "estimated_profit_try": round(
                estimated_profit_try,
                2,
            ),

            "profit_margin_percent": round(
                profit_margin,
                2,
            ),
        },

        "pricing": {
            "break_even_price_usd": round(
                break_even_price_per_unit,
                2,
            ),

            "recommended_low_usd": round(
                recommended_price_low,
                2,
            ),

            "recommended_usd": round(
                recommended_price,
                2,
            ),

            "recommended_high_usd": round(
                recommended_price_high,
                2,
            ),
        },
    }
# ============================================================
# BULK PRICE & PROFIT ANALYSIS
# ============================================================
@router.put("/{listing_id}/cost")
def update_product_cost(
    listing_id: str,
    payload: ProductCostRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    # -----------------------------
    # VALIDATION
    # -----------------------------
    if payload.product_cost_usd < 0:
        raise HTTPException(
            status_code=400,
            detail="Product cost cannot be negative.",
        )

    if payload.actual_shipping_cost_usd < 0:
        raise HTTPException(
            status_code=400,
            detail="Actual shipping cost cannot be negative.",
        )

    # -----------------------------
    # FIND LISTING
    # -----------------------------
    listing = (
        db.query(EtsyListing)
        .filter(
            EtsyListing.listing_id == listing_id,
            EtsyListing.user_id == user_id,
        )
        .first()
    )

    if not listing:
        raise HTTPException(
            status_code=404,
            detail="Product not found.",
        )

    # -----------------------------
    # UPDATE COST DATA
    # -----------------------------
    listing.product_cost_usd = payload.product_cost_usd
    listing.actual_shipping_cost_usd = payload.actual_shipping_cost_usd

    if payload.supplier_source is not None:
        listing.supplier_source = payload.supplier_source

    if payload.supplier_url is not None:
        listing.supplier_url = payload.supplier_url

    db.commit()
    db.refresh(listing)

    return {
        "success": True,
        "message": "Product cost information updated successfully.",
        "product": {
            "id": listing.id,
            "listing_id": listing.listing_id,
            "title": listing.title,
            "price": float(listing.price) if listing.price is not None else None,
            "product_cost_usd": (
                float(listing.product_cost_usd)
                if listing.product_cost_usd is not None
                else None
            ),
            "actual_shipping_cost_usd": (
                float(listing.actual_shipping_cost_usd)
                if listing.actual_shipping_cost_usd is not None
                else None
            ),
            "supplier_source": listing.supplier_source,
            "supplier_url": listing.supplier_url,
        },
    }
@router.post("/bulk-price-profit")
def calculate_bulk_price_profit(
    payload: BulkPriceProfitRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if payload.usd_try_rate <= 0:
        raise HTTPException(
            status_code=400,
            detail="USD/TRY rate must be greater than zero.",
        )

    # --------------------------------------------------------
    # GET ACTIVE LISTINGS
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # RESULTS
    # --------------------------------------------------------

    results = []

    analyzed_count = 0
    needs_cost_count = 0
    profitable_count = 0
    below_break_even_count = 0

    total_estimated_profit_usd = 0.0
    total_estimated_profit_try = 0.0

    margins = []

    # --------------------------------------------------------
    # ANALYZE EACH LISTING
    # --------------------------------------------------------

    for listing in listings:

        # ----------------------------------------------------
        # BASIC PRODUCT INFORMATION
        # ----------------------------------------------------

        product = {
            "id": listing.id,
            "listing_id": listing.listing_id,
            "title": listing.title,
            "price": (
                float(listing.price)
                if listing.price is not None
                else None
            ),
            "quantity": listing.quantity,
            "image_url": listing.image_url,
            "url": listing.url,
            "supplier_source": (
                listing.supplier_source
                or "turkey"
            ),
            "supplier_url": listing.supplier_url,
        }

        # ----------------------------------------------------
        # MISSING SELLING PRICE
        # ----------------------------------------------------

        if listing.price is None:

            results.append({
                "status": "missing_price",
                "needs_cost": False,
                "needs_shipping": (
                    listing.actual_shipping_cost_usd
                    is None
                ),
                "product": product,
                "message": "Selling price is missing.",
            })

            continue

        # ----------------------------------------------------
        # MISSING PRODUCT COST
        # ----------------------------------------------------

        if listing.product_cost_usd is None:

            needs_cost_count += 1

            results.append({
                "status": "needs_cost",
                "needs_cost": True,
                "needs_shipping": (
                    listing.actual_shipping_cost_usd
                    is None
                ),
                "product": product,
                "message": (
                    "Product cost is required "
                    "to calculate profit."
                ),
            })

            continue

        # ----------------------------------------------------
        # SOURCE
        # ----------------------------------------------------

        source = (
            listing.supplier_source
            or "turkey"
        )

        # ----------------------------------------------------
        # ACTUAL SHIPPING
        #
        # If no actual shipping value exists,
        # calculator defaults to 0.
        #
        # We still tell frontend that shipping
        # data has not been explicitly provided.
        # ----------------------------------------------------

        actual_shipping = (
            float(
                listing.actual_shipping_cost_usd
            )
            if listing.actual_shipping_cost_usd
            is not None
            else None
        )

        # ----------------------------------------------------
        # BUILD CALCULATOR REQUEST
        #
        # quantity = 1 because listing.quantity
        # is inventory stock, NOT order quantity.
        # ----------------------------------------------------

        calculator_payload = PriceProfitRequest(
            product_cost_usd=float(
                listing.product_cost_usd
            ),

            selling_price_usd=float(
                listing.price
            ),

            usd_try_rate=payload.usd_try_rate,

            source=source,

            destination=payload.destination,

            quantity=1,

            actual_shipping_cost_usd=actual_shipping,

            currency_conversion=(
                payload.currency_conversion
            ),

            offsite_ads=payload.offsite_ads,
        )

        # ----------------------------------------------------
        # CALCULATE
        # ----------------------------------------------------

        try:

            calculation = calculate_price_profit(
                payload=calculator_payload,
            )

        except HTTPException as error:

            results.append({
                "status": "calculation_error",
                "needs_cost": False,
                "needs_shipping": (
                    actual_shipping is None
                ),
                "product": product,
                "message": str(error.detail),
            })

            continue

        # ----------------------------------------------------
        # PROFIT DATA
        # ----------------------------------------------------

        profit = calculation["profit"]

        estimated_profit_usd = float(
            profit["estimated_profit_usd"]
        )

        estimated_profit_try = float(
            profit["estimated_profit_try"]
        )

        margin = float(
            profit["profit_margin_percent"]
        )

        break_even_price = float(
            calculation["pricing"]
            ["break_even_price_usd"]
        )

        # ----------------------------------------------------
        # STATUS
        # ----------------------------------------------------

        if estimated_profit_usd >= 0:

            status = "profitable"

            profitable_count += 1

        else:

            status = "below_break_even"

            below_break_even_count += 1

        # ----------------------------------------------------
        # TOTALS
        # ----------------------------------------------------

        analyzed_count += 1

        total_estimated_profit_usd += (
            estimated_profit_usd
        )

        total_estimated_profit_try += (
            estimated_profit_try
        )

        margins.append(margin)

        # ----------------------------------------------------
        # RESULT
        # ----------------------------------------------------

        results.append({
            "status": status,

            "needs_cost": False,

            "needs_shipping": (
                actual_shipping is None
            ),

            "product": product,

            "analysis": {
                "selling_price_usd": float(
                    listing.price
                ),

                "product_cost_usd": float(
                    listing.product_cost_usd
                ),

                "actual_shipping_cost_usd": (
                    actual_shipping
                    if actual_shipping is not None
                    else 0.0
                ),

                "estimated_profit_usd": (
                    estimated_profit_usd
                ),

                "estimated_profit_try": (
                    estimated_profit_try
                ),

                "profit_margin_percent": margin,

                "break_even_price_usd": (
                    break_even_price
                ),

                "recommended_price_usd": float(
                    calculation["pricing"]
                    ["recommended_usd"]
                ),

                "etsy_fees_usd": float(
                    calculation["etsy_fees"]
                    ["total_usd"]
                ),

                "buyer_shipping_usd": float(
                    calculation["order"]
                    ["shipping_usd"]
                ),

                "buyer_shipping_source": (
                    calculation["input"]
                    ["buyer_shipping_source"]
                ),

                "actual_shipping_source": (
                    calculation["input"]
                    ["actual_shipping_source"]
                ),
            },
        })

    # --------------------------------------------------------
    # AVERAGE MARGIN
    # --------------------------------------------------------

    average_margin = (
        sum(margins) / len(margins)
        if margins
        else 0.0
    )

    # --------------------------------------------------------
    # RETURN
    # --------------------------------------------------------

    return {
        "success": True,

        "summary": {
            "total_products": len(listings),

            "analyzed_products": analyzed_count,

            "needs_cost": needs_cost_count,

            "profitable_products": (
                profitable_count
            ),

            "below_break_even": (
                below_break_even_count
            ),

            "average_margin_percent": round(
                average_margin,
                2,
            ),

            "estimated_profit_usd": round(
                total_estimated_profit_usd,
                2,
            ),

            "estimated_profit_try": round(
                total_estimated_profit_try,
                2,
            ),
        },

        "settings": {
            "usd_try_rate": payload.usd_try_rate,
            "destination": payload.destination,
            "currency_conversion": (
                payload.currency_conversion
            ),
            "offsite_ads": payload.offsite_ads,
        },

        "results": results,
    }
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