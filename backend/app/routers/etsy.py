import base64
import hashlib
import secrets
from datetime import datetime, timedelta
from urllib.parse import urlencode
from fastapi import Query
import requests
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.models.etsy_listing import EtsyListing
from app.config import settings
from app.database import SessionLocal
from app.models.etsy_connection import EtsyConnection
from app.models.etsy_oauth_state import EtsyOAuthState


router = APIRouter(
    prefix="/etsy",
    tags=["Etsy"],
)

security = HTTPBearer()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
) -> int:
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token",
            )

        return int(user_id)

    except (JWTError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )


def generate_code_verifier() -> str:
    return (
        base64.urlsafe_b64encode(
            secrets.token_bytes(32)
        )
        .decode("utf-8")
        .rstrip("=")
    )


def generate_code_challenge(
    code_verifier: str,
) -> str:
    digest = hashlib.sha256(
        code_verifier.encode("utf-8")
    ).digest()

    return (
        base64.urlsafe_b64encode(digest)
        .decode("utf-8")
        .rstrip("=")
    )


def etsy_api_key() -> str:
    return (
        f"{settings.etsy_api_key}:"
        f"{settings.etsy_shared_secret}"
    )


@router.get("/ping")
def etsy_ping():
    response = requests.get(
        "https://api.etsy.com/v3/application/openapi-ping",
        headers={
            "x-api-key": etsy_api_key(),
        },
        timeout=15,
    )

    if not response.ok:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text,
        )

    return {
        "message": "Etsy API connection successful.",
        "data": response.text,
    }


@router.get("/connect-url")
def get_etsy_connect_url(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    state = secrets.token_urlsafe(32)

    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(
        code_verifier
    )

    expires_at = (
        datetime.utcnow()
        + timedelta(minutes=10)
    )

    oauth_state = EtsyOAuthState(
        state=state,
        user_id=user_id,
        code_verifier=code_verifier,
        expires_at=expires_at,
    )

    db.add(oauth_state)
    db.commit()

    params = {
        "response_type": "code",
        "client_id": settings.etsy_api_key,
        "redirect_uri": settings.etsy_redirect_uri,
        "scope": "shops_r listings_r transactions_r",
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }

    authorization_url = (
        "https://www.etsy.com/oauth/connect?"
        + urlencode(params)
    )

    return {
        "authorization_url": authorization_url
    }


@router.get("/callback")
def etsy_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
    db: Session = Depends(get_db),
):
    # Etsy returned an authorization error
    if error:
        raise HTTPException(
            status_code=400,
            detail=(
                error_description
                or error
                or "Etsy authorization failed."
            ),
        )

    # Authorization code is required
    if not code:
        raise HTTPException(
            status_code=400,
            detail="Authorization code is missing.",
        )

    # State is required
    if not state:
        raise HTTPException(
            status_code=400,
            detail="OAuth state is missing.",
        )

    # Find the OAuth state generated during connect-url
    oauth_state = (
        db.query(EtsyOAuthState)
        .filter(
            EtsyOAuthState.state == state
        )
        .first()
    )

    if not oauth_state:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired OAuth state.",
        )

    # Check expiration
    if oauth_state.expires_at < datetime.utcnow():
        db.delete(oauth_state)
        db.commit()

        raise HTTPException(
            status_code=400,
            detail="OAuth state has expired.",
        )

    user_id = oauth_state.user_id
    code_verifier = oauth_state.code_verifier

    # Exchange authorization code for Etsy tokens
    token_response = requests.post(
        "https://api.etsy.com/v3/public/oauth/token",
        data={
            "grant_type": "authorization_code",
            "client_id": settings.etsy_api_key,
            "redirect_uri": settings.etsy_redirect_uri,
            "code": code,
            "code_verifier": code_verifier,
        },
        headers={
            "Content-Type": (
                "application/x-www-form-urlencoded"
            )
        },
        timeout=15,
    )

    if not token_response.ok:
        raise HTTPException(
            status_code=token_response.status_code,
            detail=token_response.text,
        )

    token_data = token_response.json()

    access_token = token_data.get(
        "access_token"
    )

    refresh_token = token_data.get(
        "refresh_token"
    )

    expires_in = token_data.get(
        "expires_in"
    )

    if not access_token or not refresh_token:
        raise HTTPException(
            status_code=400,
            detail="Etsy token response is incomplete.",
        )

    try:
        expires_in_seconds = int(
            expires_in or 3600
        )
    except (TypeError, ValueError):
        expires_in_seconds = 3600

    expires_at = (
        datetime.utcnow()
        + timedelta(
            seconds=expires_in_seconds
        )
    )

    # Etsy access token format:
    # <etsy_user_id>.<token>
    etsy_user_id = access_token.split(
        ".",
        1,
    )[0]

    # Find existing Etsy connection
    connection = (
        db.query(EtsyConnection)
        .filter(
            EtsyConnection.user_id == user_id
        )
        .first()
    )

    if connection:
        connection.access_token = access_token
        connection.refresh_token = refresh_token
        connection.expires_at = expires_at
        connection.etsy_user_id = etsy_user_id

    else:
        connection = EtsyConnection(
            user_id=user_id,
            etsy_user_id=etsy_user_id,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at,
        )

        db.add(connection)

    # OAuth state is single-use
    db.delete(oauth_state)

    db.commit()
    db.refresh(connection)

    # Return user to the dashboard
    return RedirectResponse(
        url=(
            f"{settings.frontend_url}"
            f"/tr/dashboard"
        ),
        status_code=303,
    )

@router.get("/shop")
def get_etsy_shop(
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

    if connection.expires_at <= datetime.utcnow():
        raise HTTPException(
            status_code=401,
            detail="Etsy access token has expired.",
        )

    response = requests.get(
        (
            "https://api.etsy.com/v3/application/"
            f"users/{connection.etsy_user_id}/shops"
        ),
        headers={
            "x-api-key": etsy_api_key(),
            "Authorization": (
                f"Bearer {connection.access_token}"
            ),
        },
        timeout=15,
    )

    if not response.ok:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text,
        )

    shop_data = response.json()

    # Etsy bağlantısına shop_id kaydet
    shop_id = shop_data.get("shop_id")

    if shop_id:
        connection.shop_id = str(shop_id)
        db.commit()
        db.refresh(connection)

    return shop_data

@router.get("/listings")
def get_etsy_listings(
    state: str = Query(
        default="active",
        pattern="^(active|inactive|sold_out|draft|expired)$",
    ),
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

    if connection.expires_at <= datetime.utcnow():
        raise HTTPException(
            status_code=401,
            detail="Etsy access token has expired.",
        )

    if not connection.shop_id:
        raise HTTPException(
            status_code=400,
            detail="Etsy shop ID is missing.",
        )

    response = requests.get(
        (
            "https://api.etsy.com/v3/application/"
            f"shops/{connection.shop_id}/listings"
        ),
        headers={
            "x-api-key": etsy_api_key(),
            "Authorization": (
                f"Bearer {connection.access_token}"
            ),
        },
        params={
            "state": state,
            "limit": 100,
            "offset": 0,
        },
        timeout=15,
    )

    if not response.ok:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text,
        )

    return response.json()

@router.post("/sync-listings")
def sync_etsy_listings(
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

    if connection.expires_at <= datetime.utcnow():
        raise HTTPException(
            status_code=401,
            detail="Etsy access token has expired.",
        )

    if not connection.shop_id:
        raise HTTPException(
            status_code=400,
            detail="Etsy shop ID is missing.",
        )

    # Fetch active listings from Etsy
    response = requests.get(
        (
            "https://api.etsy.com/v3/application/"
            f"shops/{connection.shop_id}/listings"
        ),
        headers={
            "x-api-key": etsy_api_key(),
            "Authorization": (
                f"Bearer {connection.access_token}"
            ),
        },
        params={
            "state": "active",
            "limit": 100,
            "offset": 0,
        },
        timeout=15,
    )

    if not response.ok:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text,
        )

    data = response.json()

    listings = data.get("results", [])

    synced_count = 0
    created_count = 0
    updated_count = 0

    for listing in listings:
        listing_id = str(
            listing["listing_id"]
        )

        existing_listing = (
            db.query(EtsyListing)
            .filter(
                EtsyListing.listing_id == listing_id
            )
            .first()
        )

        # Price
        price = None

        listing_price = listing.get("price")

        if isinstance(listing_price, dict):
            amount = listing_price.get("amount")
            divisor = listing_price.get("divisor")

            if (
                amount is not None
                and divisor
                and divisor != 0
            ):
                price = (
                    float(amount)
                    / float(divisor)
                )

        # Image
        image_url = None

        images = listing.get("images") or []

        if images:
            first_image = images[0]

            image_url = (
                first_image.get("url_570xN")
                or first_image.get(
                    "url_fullxfull"
                )
                or first_image.get(
                    "url_170x135"
                )
            )

        # Tags
        tags_text = None

        tags = listing.get("tags")

        if isinstance(tags, list):
            import json

            tags_text = json.dumps(
                tags,
                ensure_ascii=False,
            )

        # Update existing listing
        if existing_listing:
            existing_listing.user_id = user_id
            existing_listing.shop_id = str(
                connection.shop_id
            )
            existing_listing.title = (
                listing.get("title")
            )
            existing_listing.description = (
                listing.get("description")
            )
            existing_listing.price = price
            existing_listing.quantity = (
                listing.get("quantity")
            )
            existing_listing.state = (
                listing.get("state")
            )
            existing_listing.url = (
                listing.get("url")
            )
            existing_listing.image_url = (
                image_url
            )
            existing_listing.tags = (
                tags_text
            )

            updated_count += 1

        # Create new listing
        else:
            new_listing = EtsyListing(
                user_id=user_id,
                shop_id=str(
                    connection.shop_id
                ),
                listing_id=listing_id,
                title=listing.get("title"),
                description=listing.get(
                    "description"
                ),
                price=price,
                quantity=listing.get(
                    "quantity"
                ),
                state=listing.get("state"),
                url=listing.get("url"),
                image_url=image_url,
                tags=tags_text,
            )

            db.add(new_listing)

            created_count += 1

        synced_count += 1

    db.commit()

    return {
        "message": (
            "Etsy listings synchronized successfully."
        ),
        "total_from_etsy": len(listings),
        "synced": synced_count,
        "created": created_count,
        "updated": updated_count,
    }