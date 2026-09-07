from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.base import Base


class EtsyListing(Base):
    __tablename__ = "etsy_listings"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    shop_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    listing_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # ============================================================
    # ETSY PRODUCT DATA
    # ============================================================

    price: Mapped[float | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )

    quantity: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    state: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # ============================================================
    # IMAGES
    # ============================================================

    image_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    image_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    image_urls: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # ============================================================
    # SEO / LISTING DATA
    # ============================================================

    tags: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # ============================================================
    # PROFIT & COST DATA
    # ============================================================

    # Product / supplier cost per unit.
    #
    # Example:
    # AliExpress product = $52.59
    #
    # This is NOT the Etsy selling price.
    product_cost_usd: Mapped[float | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )

    # Actual shipping cost paid by the seller per unit/order.
    #
    # Example:
    # AliExpress shipping = $0.00
    #
    # This is different from the shipping amount charged
    # to the Etsy buyer.
    actual_shipping_cost_usd: Mapped[float | None] = mapped_column(
        Numeric(12, 2),
        nullable=True,
    )

    # Where the product is sourced from.
    #
    # Examples:
    # "turkey"
    # "aliexpress"
    supplier_source: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    # Optional supplier/product URL.
    #
    # Example:
    # AliExpress product URL
    supplier_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # ============================================================
    # TIMESTAMPS
    # ============================================================

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )