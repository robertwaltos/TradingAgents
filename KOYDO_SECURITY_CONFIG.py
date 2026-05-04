# KOYDO SECURITY CONFIGURATION
# Security hardening configuration for TradingAgents

import ssl
import certifi
import requests
from typing import Dict, Any

# Secure HTTP session configuration
def create_secure_session() -> requests.Session:
    """Create a secure requests session with Koydo security standards."""
    session = requests.Session()

    # Enable SSL verification with updated CA bundle
    session.verify = certifi.where()

    # Configure secure headers
    session.headers.update({
        'User-Agent': 'TradingAgents/0.2.4 (Koydo-Enhanced)',
        'Accept': 'application/json',
        'Connection': 'keep-alive',
    })

    # Set secure timeouts
    session.timeout = (10.0, 30.0)  # (connect, read) timeout

    return session

# Security configuration constants
SECURITY_CONFIG: Dict[str, Any] = {
    'max_request_timeout': 30,
    'max_ticker_length': 32,
    'allowed_ticker_chars': r'^[A-Za-z0-9._\-\^]+$',
    'max_memory_log_size': 10 * 1024 * 1024,  # 10MB
    'checkpoint_encryption': True,
    'rate_limit_per_minute': 60,
    'ssl_verification': True,
    'ca_bundle': certifi.where(),
}

# Input sanitization patterns
SANITIZATION_PATTERNS = {
    'ticker': r'[^A-Za-z0-9._\-\^]',
    'date': r'[^0-9\-]',
    'provider': r'[^A-Za-z0-9_]',
}

def validate_input(input_type: str, value: str) -> bool:
    """Validate input according to Koydo security standards."""
    import re

    if input_type not in SANITIZATION_PATTERNS:
        raise ValueError(f"Unknown input type: {input_type}")

    pattern = SANITIZATION_PATTERNS[input_type]
    return not re.search(pattern, value)

def sanitize_log_data(data: str) -> str:
    """Sanitize sensitive data from logs."""
    import re

    # Remove API keys, tokens, and other sensitive patterns
    patterns = [
        (r'(api_key["\']?\s*[:=]\s*["\']?)[^"\'&\s]+', r'\1***REDACTED***'),
        (r'(token["\']?\s*[:=]\s*["\']?)[^"\'&\s]+', r'\1***REDACTED***'),
        (r'(password["\']?\s*[:=]\s*["\']?)[^"\'&\s]+', r'\1***REDACTED***'),
        (r'(secret["\']?\s*[:=]\s*["\']?)[^"\'&\s]+', r'\1***REDACTED***'),
    ]

    for pattern, replacement in patterns:
        data = re.sub(pattern, replacement, data, flags=re.IGNORECASE)

    return data