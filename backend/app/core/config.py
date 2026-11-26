from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    # JWT
    SECRET_KEY: str
    ALGORITHM: str

    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int
    RESET_TOKEN_EXPIRE_MINUTES: int

    # Email
    EMAIL_HOST: str
    EMAIL_PORT: int
    EMAIL_ADDRESS: str
    EMAIL_PASSWORD: str

    # Frontend
    FRONTEND_URL: str

    class Config:
        env_file = ".env"


settings = Settings()