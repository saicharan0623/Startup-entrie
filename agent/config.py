"""Agent configuration — edit these values before deploying."""
from pydantic import BaseModel
from pydantic_settings import BaseSettings


class AgentSettings(BaseSettings):
    # Backend API
    api_url: str = "http://localhost:8000"
    api_key: str = "dev-secret-key"

    # Collection intervals (seconds)
    log_interval: int = 30
    process_interval: int = 15
    network_interval: int = 20

    # Local cache path
    cache_path: str = "agent_cache.json"

    # Max events to buffer before forced flush
    buffer_size: int = 50

    class Config:
        env_file = ".env"
        env_prefix = "ENTRIALERT_"


settings = AgentSettings()
