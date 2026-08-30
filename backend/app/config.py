from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    brevo_api_key: str
    brevo_from_name: str
    brevo_from_email: str

    frontend_url: str = "http://localhost:3000"

    # Etsy
    etsy_api_key: str
    etsy_shared_secret: str
    etsy_redirect_uri: str

    # AI
    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()