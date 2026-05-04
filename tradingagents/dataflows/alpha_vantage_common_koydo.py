"""
Koydo-enhanced Alpha Vantage API client with security hardening.
Implements Koydo security standards for external API interactions.
"""

import os
import json
import time
import logging
import pandas as pd
from datetime import datetime
from io import StringIO
from typing import Dict, Union, Optional
from functools import wraps

# Import Koydo security configuration
try:
    from KOYDO_SECURITY_CONFIG import create_secure_session, SECURITY_CONFIG, sanitize_log_data
except ImportError:
    # Fallback for environments without Koydo security config
    import requests
    create_secure_session = requests.Session
    SECURITY_CONFIG = {'max_request_timeout': 30, 'rate_limit_per_minute': 60}
    sanitize_log_data = lambda x: x

# Configure logging with security considerations
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

API_BASE_URL = "https://www.alphavantage.co/query"

# Rate limiting state
_last_request_time = 0.0
_request_count = 0
_rate_limit_window_start = 0.0

class AlphaVantageRateLimitError(Exception):
    """Exception raised when Alpha Vantage API rate limit is exceeded."""
    pass

class AlphaVantageSecurityError(Exception):
    """Exception raised for security-related issues."""
    pass

def rate_limit(func):
    """Decorator to enforce rate limiting per Koydo standards."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        global _last_request_time, _request_count, _rate_limit_window_start

        current_time = time.time()

        # Reset counter if we're in a new window
        if current_time - _rate_limit_window_start > 60:  # 1 minute window
            _rate_limit_window_start = current_time
            _request_count = 0

        # Check rate limit
        if _request_count >= SECURITY_CONFIG['rate_limit_per_minute']:
            wait_time = 60 - (current_time - _rate_limit_window_start)
            logger.warning(f"Rate limit reached. Waiting {wait_time:.1f} seconds.")
            time.sleep(wait_time)
            _rate_limit_window_start = time.time()
            _request_count = 0

        # Enforce minimum time between requests
        time_since_last = current_time - _last_request_time
        if time_since_last < 1.0:  # Minimum 1 second between requests
            time.sleep(1.0 - time_since_last)

        _last_request_time = time.time()
        _request_count += 1

        return func(*args, **kwargs)
    return wrapper

def get_api_key() -> str:
    """Retrieve and validate the API key for Alpha Vantage."""
    api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
    if not api_key:
        raise AlphaVantageSecurityError("ALPHA_VANTAGE_API_KEY environment variable is not set.")

    # Validate API key format (basic security check)
    if len(api_key) < 8 or not api_key.replace('_', '').replace('-', '').isalnum():
        raise AlphaVantageSecurityError("Invalid API key format detected.")

    return api_key

def validate_date_input(date_input) -> str:
    """Validate and sanitize date input per Koydo security standards."""
    if not date_input:
        raise ValueError("Date input cannot be empty.")

    if isinstance(date_input, str):
        # Remove any potentially dangerous characters
        sanitized_date = ''.join(c for c in date_input if c.isdigit() or c in ['-', ':', 'T', ' '])

        if len(sanitized_date) != len(date_input):
            logger.warning("Date input contained suspicious characters and was sanitized.")

        return sanitized_date

    return date_input

def format_datetime_for_api(date_input) -> str:
    """Convert various date formats to YYYYMMDDTHHMM format with security validation."""
    validated_input = validate_date_input(date_input)

    if isinstance(validated_input, str):
        # If already in correct format, return as-is
        if len(validated_input) == 13 and 'T' in validated_input:
            return validated_input

        # Try to parse common date formats
        date_formats = [
            "%Y-%m-%d",
            "%Y-%m-%d %H:%M",
            "%Y-%m-%dT%H:%M",
            "%Y/%m/%d",
            "%m/%d/%Y"
        ]

        for fmt in date_formats:
            try:
                dt = datetime.strptime(validated_input, fmt)
                return dt.strftime("%Y%m%dT0000")
            except ValueError:
                continue

        raise ValueError(f"Unsupported date format: {validated_input}")

    elif isinstance(validated_input, datetime):
        return validated_input.strftime("%Y%m%dT%H%M")

    else:
        raise ValueError(f"Date must be string or datetime object, got {type(validated_input)}")

@rate_limit
def _make_secure_api_request(function_name: str, params: dict) -> Union[dict, str]:
    """
    Enhanced API request function with Koydo security standards.

    Features:
    - Rate limiting
    - Input validation
    - Secure HTTP session
    - Enhanced error handling
    - Request logging with sanitization
    """
    # Validate function name
    if not function_name or not function_name.replace('_', '').isalnum():
        raise AlphaVantageSecurityError("Invalid function name provided.")

    # Create secure session
    session = create_secure_session()

    # Prepare API parameters
    api_params = params.copy()
    api_params.update({
        "function": function_name,
        "apikey": get_api_key(),
        "source": "trading_agents_koydo_enhanced",
    })

    # Handle entitlement parameter securely
    current_entitlement = globals().get('_current_entitlement')
    entitlement = api_params.get("entitlement") or current_entitlement

    if entitlement:
        # Validate entitlement format
        if isinstance(entitlement, str) and entitlement.replace('_', '').replace('-', '').isalnum():
            api_params["entitlement"] = entitlement
        else:
            logger.warning("Invalid entitlement format detected. Removing from request.")
            api_params.pop("entitlement", None)
    elif "entitlement" in api_params:
        api_params.pop("entitlement", None)

    # Log request (with sanitized parameters)
    sanitized_params = sanitize_log_data(str(api_params))
    logger.info(f"Making Alpha Vantage API request: {function_name} with params: {sanitized_params}")

    try:
        response = session.get(
            API_BASE_URL,
            params=api_params,
            timeout=SECURITY_CONFIG['max_request_timeout'],
        )
        response.raise_for_status()

        response_text = response.text

        # Validate response size
        if len(response_text) > SECURITY_CONFIG.get('max_response_size', 50 * 1024 * 1024):  # 50MB limit
            raise AlphaVantageSecurityError("Response size exceeds security limit.")

        # Check if response is JSON (error responses are typically JSON)
        try:
            response_json = json.loads(response_text)

            # Check for rate limit error
            if "Information" in response_json:
                info_message = response_json["Information"]
                if "rate limit" in info_message.lower() or "api key" in info_message.lower():
                    raise AlphaVantageRateLimitError(f"Alpha Vantage rate limit exceeded: {info_message}")

            # Check for other error messages
            if "Error Message" in response_json:
                error_msg = response_json["Error Message"]
                logger.error(f"Alpha Vantage API error: {error_msg}")
                raise AlphaVantageSecurityError(f"API returned error: {error_msg}")

        except json.JSONDecodeError:
            # Response is not JSON (likely CSV data), which is normal
            logger.debug("Received non-JSON response (likely CSV data).")

        logger.info(f"Successfully received response from Alpha Vantage API ({len(response_text)} bytes)")
        return response_text

    except Exception as e:
        logger.error(f"Error making Alpha Vantage API request: {sanitize_log_data(str(e))}")
        raise

def _filter_csv_by_date_range_secure(csv_data: str, start_date: str, end_date: str) -> str:
    """
    Enhanced CSV filtering with security validation.
    """
    if not csv_data or csv_data.strip() == "":
        return csv_data

    # Validate input sizes
    if len(csv_data) > SECURITY_CONFIG.get('max_csv_size', 10 * 1024 * 1024):  # 10MB limit
        raise AlphaVantageSecurityError("CSV data size exceeds security limit.")

    # Validate date inputs
    start_date = validate_date_input(start_date)
    end_date = validate_date_input(end_date)

    try:
        # Parse CSV data with size limits
        df = pd.read_csv(StringIO(csv_data), nrows=100000)  # Limit rows for security

        if df.empty:
            logger.warning("Received empty CSV data from Alpha Vantage.")
            return csv_data

        # Assume the first column is the date column (timestamp)
        date_col = df.columns[0]
        df[date_col] = pd.to_datetime(df[date_col], errors='coerce')

        # Remove rows with invalid dates
        initial_count = len(df)
        df = df.dropna(subset=[date_col])
        if len(df) < initial_count:
            logger.warning(f"Removed {initial_count - len(df)} rows with invalid dates.")

        # Filter by date range
        start_dt = pd.to_datetime(start_date)
        end_dt = pd.to_datetime(end_date)

        filtered_df = df[(df[date_col] >= start_dt) & (df[date_col] <= end_dt)]

        logger.info(f"Filtered CSV data: {len(filtered_df)}/{len(df)} rows within date range.")

        # Convert back to CSV string
        return filtered_df.to_csv(index=False)

    except Exception as e:
        # If filtering fails, log the error and return original data
        logger.error(f"Failed to filter CSV data by date range: {sanitize_log_data(str(e))}")
        return csv_data

# Export the secure version as the primary API request function
_make_api_request = _make_secure_api_request
_filter_csv_by_date_range = _filter_csv_by_date_range_secure