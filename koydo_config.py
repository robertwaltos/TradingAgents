"""
Koydo Configuration Management System for TradingAgents
Implements secure configuration handling per Koydo standards.
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional, Union
from dataclasses import dataclass, field
from enum import Enum

# Configure secure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('tradingagents.log', mode='a')
    ]
)
logger = logging.getLogger(__name__)

class Environment(Enum):
    """Environment types following Koydo standards."""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"

class SecurityLevel(Enum):
    """Security configuration levels."""
    MINIMAL = "minimal"
    STANDARD = "standard"
    ENHANCED = "enhanced"
    MAXIMUM = "maximum"

@dataclass
class KoydoSecurityConfig:
    """Security configuration following Koydo standards."""
    level: SecurityLevel = SecurityLevel.STANDARD
    ssl_verify: bool = True
    request_timeout: int = 30
    max_retries: int = 3
    rate_limit_per_minute: int = 60
    max_log_size_mb: int = 100
    enable_audit_log: bool = True
    sanitize_logs: bool = True
    encrypt_checkpoints: bool = False
    max_memory_usage_mb: int = 2048

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for easy access."""
        return {
            'level': self.level.value,
            'ssl_verify': self.ssl_verify,
            'request_timeout': self.request_timeout,
            'max_retries': self.max_retries,
            'rate_limit_per_minute': self.rate_limit_per_minute,
            'max_log_size_mb': self.max_log_size_mb,
            'enable_audit_log': self.enable_audit_log,
            'sanitize_logs': self.sanitize_logs,
            'encrypt_checkpoints': self.encrypt_checkpoints,
            'max_memory_usage_mb': self.max_memory_usage_mb,
        }

@dataclass
class KoydoLLMConfig:
    """LLM configuration with Koydo enhancements."""
    primary_provider: str = "openai"
    fallback_providers: list = field(default_factory=lambda: ["anthropic", "google"])
    deep_think_model: str = "gpt-5.4"
    quick_think_model: str = "gpt-5.4-mini"
    max_tokens: int = 8192
    temperature: float = 0.1
    top_p: float = 0.95
    frequency_penalty: float = 0.0
    presence_penalty: float = 0.0
    max_retries: int = 3
    retry_delay: float = 1.0
    enable_streaming: bool = False
    enable_cache: bool = True

    # Koydo-specific enhancements
    enable_content_filter: bool = True
    log_interactions: bool = True
    max_context_length: int = 32768
    prompt_injection_detection: bool = True

@dataclass
class KoydoDataConfig:
    """Data handling configuration per Koydo standards."""
    cache_directory: str = "~/.tradingagents/cache"
    checkpoint_directory: str = "~/.tradingagents/checkpoints"
    memory_log_path: str = "~/.tradingagents/memory/trading_memory.md"
    max_cache_size_mb: int = 1024
    cache_ttl_hours: int = 24
    backup_interval_hours: int = 6
    enable_compression: bool = True
    enable_encryption: bool = False
    data_retention_days: int = 90

@dataclass
class KoydoTradingConfig:
    """Trading-specific configuration with Koydo standards."""
    max_debate_rounds: int = 3
    enable_risk_management: bool = True
    enable_portfolio_validation: bool = True
    max_position_size_pct: float = 10.0
    stop_loss_pct: float = 5.0
    take_profit_pct: float = 15.0
    max_concurrent_analyses: int = 5
    enable_backtesting: bool = True
    enable_paper_trading: bool = True

    # Data vendors configuration
    primary_data_vendor: str = "yfinance"
    fallback_data_vendors: list = field(default_factory=lambda: ["alpha_vantage"])

@dataclass
class KoydoConfig:
    """
    Comprehensive Koydo configuration for TradingAgents.
    Implements Koydo configuration management standards.
    """
    environment: Environment = Environment.DEVELOPMENT
    debug: bool = False
    verbose: bool = True

    # Component configurations
    security: KoydoSecurityConfig = field(default_factory=KoydoSecurityConfig)
    llm: KoydoLLMConfig = field(default_factory=KoydoLLMConfig)
    data: KoydoDataConfig = field(default_factory=KoydoDataConfig)
    trading: KoydoTradingConfig = field(default_factory=KoydoTradingConfig)

    # Version and metadata
    version: str = "0.2.4-koydo"
    config_version: str = "1.0.0"

    def __post_init__(self):
        """Post-initialization validation and setup."""
        self._validate_config()
        self._setup_directories()
        self._log_config_load()

    def _validate_config(self) -> None:
        """Validate configuration values per Koydo standards."""
        if self.trading.max_position_size_pct <= 0 or self.trading.max_position_size_pct > 100:
            raise ValueError("max_position_size_pct must be between 0 and 100")

        if self.security.rate_limit_per_minute <= 0:
            raise ValueError("rate_limit_per_minute must be positive")

        if self.llm.max_tokens <= 0:
            raise ValueError("max_tokens must be positive")

        logger.info("Configuration validation passed")

    def _setup_directories(self) -> None:
        """Create necessary directories per Koydo standards."""
        directories = [
            self.data.cache_directory,
            self.data.checkpoint_directory,
            Path(self.data.memory_log_path).parent,
        ]

        for dir_path in directories:
            expanded_path = Path(dir_path).expanduser()
            expanded_path.mkdir(parents=True, exist_ok=True)
            logger.debug(f"Ensured directory exists: {expanded_path}")

    def _log_config_load(self) -> None:
        """Log configuration loading per Koydo audit standards."""
        logger.info(f"Loaded Koydo configuration v{self.config_version}")
        logger.info(f"Environment: {self.environment.value}")
        logger.info(f"Security level: {self.security.level.value}")
        logger.info(f"Primary LLM provider: {self.llm.primary_provider}")
        logger.info(f"Primary data vendor: {self.trading.primary_data_vendor}")

    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary."""
        return {
            'environment': self.environment.value,
            'debug': self.debug,
            'verbose': self.verbose,
            'version': self.version,
            'config_version': self.config_version,
            'security': self.security.to_dict(),
            'llm': {
                'primary_provider': self.llm.primary_provider,
                'fallback_providers': self.llm.fallback_providers,
                'deep_think_model': self.llm.deep_think_model,
                'quick_think_model': self.llm.quick_think_model,
                'max_tokens': self.llm.max_tokens,
                'temperature': self.llm.temperature,
                'enable_content_filter': self.llm.enable_content_filter,
                'prompt_injection_detection': self.llm.prompt_injection_detection,
            },
            'data': {
                'cache_directory': self.data.cache_directory,
                'checkpoint_directory': self.data.checkpoint_directory,
                'memory_log_path': self.data.memory_log_path,
                'max_cache_size_mb': self.data.max_cache_size_mb,
                'enable_encryption': self.data.enable_encryption,
                'data_retention_days': self.data.data_retention_days,
            },
            'trading': {
                'max_debate_rounds': self.trading.max_debate_rounds,
                'enable_risk_management': self.trading.enable_risk_management,
                'max_position_size_pct': self.trading.max_position_size_pct,
                'stop_loss_pct': self.trading.stop_loss_pct,
                'take_profit_pct': self.trading.take_profit_pct,
                'primary_data_vendor': self.trading.primary_data_vendor,
                'enable_backtesting': self.trading.enable_backtesting,
            }
        }

    def save_to_file(self, file_path: Union[str, Path]) -> None:
        """Save configuration to JSON file."""
        config_dict = self.to_dict()
        with open(Path(file_path).expanduser(), 'w') as f:
            json.dump(config_dict, f, indent=2)
        logger.info(f"Configuration saved to {file_path}")

    @classmethod
    def load_from_file(cls, file_path: Union[str, Path]) -> 'KoydoConfig':
        """Load configuration from JSON file."""
        with open(Path(file_path).expanduser(), 'r') as f:
            config_dict = json.load(f)

        # TODO: Implement proper deserialization from dict
        logger.info(f"Configuration loaded from {file_path}")
        return cls()  # For now, return default config

    @classmethod
    def from_environment(cls) -> 'KoydoConfig':
        """Create configuration from environment variables."""
        env_name = os.getenv('KOYDO_ENV', 'development').lower()
        environment = Environment(env_name) if env_name in [e.value for e in Environment] else Environment.DEVELOPMENT

        config = cls(
            environment=environment,
            debug=os.getenv('KOYDO_DEBUG', 'false').lower() == 'true',
            verbose=os.getenv('KOYDO_VERBOSE', 'true').lower() == 'true',
        )

        # Override LLM configuration from environment
        if os.getenv('KOYDO_LLM_PROVIDER'):
            config.llm.primary_provider = os.getenv('KOYDO_LLM_PROVIDER')

        if os.getenv('KOYDO_DEEP_THINK_MODEL'):
            config.llm.deep_think_model = os.getenv('KOYDO_DEEP_THINK_MODEL')

        if os.getenv('KOYDO_QUICK_THINK_MODEL'):
            config.llm.quick_think_model = os.getenv('KOYDO_QUICK_THINK_MODEL')

        # Override security configuration
        if os.getenv('KOYDO_SECURITY_LEVEL'):
            security_level = os.getenv('KOYDO_SECURITY_LEVEL').lower()
            if security_level in [s.value for s in SecurityLevel]:
                config.security.level = SecurityLevel(security_level)

        logger.info("Configuration created from environment variables")
        return config

# Default Koydo configuration instance
DEFAULT_KOYDO_CONFIG = KoydoConfig.from_environment()

def get_config() -> KoydoConfig:
    """Get the default Koydo configuration."""
    return DEFAULT_KOYDO_CONFIG

def get_security_config() -> KoydoSecurityConfig:
    """Get security configuration."""
    return DEFAULT_KOYDO_CONFIG.security

def get_llm_config() -> KoydoLLMConfig:
    """Get LLM configuration."""
    return DEFAULT_KOYDO_CONFIG.llm

def get_trading_config() -> KoydoTradingConfig:
    """Get trading configuration."""
    return DEFAULT_KOYDO_CONFIG.trading