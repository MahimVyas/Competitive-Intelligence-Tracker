"""Application configuration using Pydantic Settings."""

from typing import List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- Application ---
    app_name: str = "Competitive Intelligence Tracker"
    app_env: str = Field(default="development", alias="APP_ENV")
    api_v1_str: str = Field(default="/api/v1", alias="API_V1_STR")
    backend_cors_origins: List[str] = Field(default=["http://localhost:3000"], alias="BACKEND_CORS_ORIGINS")

    # --- Database ---
    database_url: Optional[str] = Field(default=None, alias="DATABASE_URL")

    # --- AI (Google Gemini) ---
    gemini_api_key: str = Field(..., alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-2.5-flash", alias="GEMINI_MODEL")

    # --- Notifications (Resend) ---
    resend_api_key: Optional[str] = Field(default=None, alias="RESEND_API_KEY")
    resend_from_email: str = Field(default="Competitive Intelligence <ci@yourdomain.com>", alias="RESEND_FROM_EMAIL")
    digest_recipients: List[str] = Field(default=[], alias="DIGEST_RECIPIENTS")

    # --- Web Scraping Fallback (Jina Reader) ---
    jina_reader_base_url: str = Field(default="https://r.jina.ai/", alias="JINA_READER_BASE_URL")
    jina_api_key: Optional[str] = Field(default=None, alias="JINA_API_KEY")

    # --- Scheduler ---
    scan_hour_utc: int = Field(default=2, alias="SCAN_HOUR_UTC")
    scan_minute_utc: int = Field(default=0, alias="SCAN_MINUTE_UTC")

    # --- Security ---
    secret_key: str = Field(default="change_me_in_production", alias="SECRET_KEY")
    access_token_expire_minutes: int = Field(default=60, alias="ACCESS_TOKEN_EXPIRE_MINUTES")

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    @field_validator("digest_recipients", mode="before")
    @classmethod
    def assemble_digest_recipients(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
    }


settings = Settings()
