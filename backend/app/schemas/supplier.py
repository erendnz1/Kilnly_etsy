from pydantic import BaseModel, HttpUrl


class SupplierSearchRequest(BaseModel):
    title: str
    description: str | None = None
    image_urls: list[HttpUrl] = []


class SupplierMatch(BaseModel):
    title: str | None = None
    url: str
    image_url: str | None = None
    price: float | None = None
    currency: str | None = None
    sales: int | None = None
    rating: float | None = None
    match_score: int


class SupplierSearchResponse(BaseModel):
    success: bool
    count: int
    suppliers: list[SupplierMatch]