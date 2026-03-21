"""rbfa_client.py — HTTP client with caching, retry, and rate limiting."""

from __future__ import annotations

import hashlib
import json
import logging
import time
from pathlib import Path
from typing import Optional

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from src.config import AppConfig

logger = logging.getLogger(__name__)

RBFA_GRAPHQL = "https://datalake-prod2018.rbfa.be/graphql"
DEFAULT_HEADERS = {
    "Content-Type": "application/json",
    "Origin": "https://www.rbfa.be",
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
}


class RbfaClient:
    def __init__(self, config: AppConfig) -> None:
        self.config = config
        self.cache_dir = Path(config.cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self._last_request_time: float = 0.0
        self.session = self._build_session()

    def _build_session(self) -> requests.Session:
        session = requests.Session()
        session.headers.update(DEFAULT_HEADERS)
        retry = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[500, 502, 503, 504],
            allowed_methods=["GET", "POST"],
        )
        adapter = HTTPAdapter(max_retries=retry)
        session.mount("https://", adapter)
        session.mount("http://", adapter)
        return session

    def _cache_key(self, url: str, body: Optional[str] = None) -> str:
        raw = url if body is None else f"{url}::{body}"
        return hashlib.md5(raw.encode()).hexdigest()

    def _cache_path(self, key: str) -> Path:
        return self.cache_dir / f"{key}.json"

    def _load_cache(self, key: str) -> Optional[str]:
        path = self._cache_path(key)
        if not path.exists():
            return None
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            age_hours = (time.time() - data["ts"]) / 3600
            if age_hours < self.config.cache_ttl_hours:
                return data["content"]
        except (json.JSONDecodeError, KeyError):
            pass
        return None

    def _save_cache(self, key: str, content: str) -> None:
        path = self._cache_path(key)
        path.write_text(
            json.dumps({"ts": time.time(), "content": content}),
            encoding="utf-8",
        )

    def _throttle(self) -> None:
        elapsed = time.time() - self._last_request_time
        wait = self.config.request_delay_seconds - elapsed
        if wait > 0:
            time.sleep(wait)
        self._last_request_time = time.time()

    def get_cached(self, url: str) -> str:
        """GET with cache. Raises requests.HTTPError on non-200."""
        key = self._cache_key(url)
        cached = self._load_cache(key)
        if cached is not None:
            logger.debug("Cache hit: %s", url)
            return cached

        self._throttle()
        logger.debug("GET %s", url)
        resp = self.session.get(url, timeout=self.config.request_timeout_seconds)
        resp.raise_for_status()
        content = resp.text
        self._save_cache(key, content)
        return content

    def post_graphql(self, body: dict) -> dict:
        """
        POST to RBFA GraphQL endpoint with cache.
        Returns parsed JSON dict. Raises on HTTP or GraphQL error.
        """
        body_str = json.dumps(body, sort_keys=True)
        key = self._cache_key(RBFA_GRAPHQL, body_str)
        cached = self._load_cache(key)
        if cached is not None:
            logger.debug("Cache hit: GraphQL %s", body.get("operationName", ""))
            return json.loads(cached)

        self._throttle()
        logger.debug("POST GraphQL: %s", body.get("operationName", ""))
        resp = self.session.post(
            RBFA_GRAPHQL,
            data=body_str,
            timeout=self.config.request_timeout_seconds,
        )
        if resp.status_code == 429:
            retry_after = int(resp.headers.get("Retry-After", "30"))
            logger.warning("Rate limited — waiting %ss", retry_after)
            time.sleep(retry_after)
            self._last_request_time = time.time()
            resp = self.session.post(
                RBFA_GRAPHQL,
                data=body_str,
                timeout=self.config.request_timeout_seconds,
            )
        resp.raise_for_status()
        data = resp.json()
        if data.get("errors"):
            msg = data["errors"][0].get("message", "Unknown GraphQL error")
            logger.warning("GraphQL error: %s", msg)
        self._save_cache(key, json.dumps(data))
        return data

    def clear_cache(self) -> int:
        """Delete all cache files. Returns number of files deleted."""
        count = 0
        for f in self.cache_dir.glob("*.json"):
            f.unlink()
            count += 1
        logger.info("Cache cleared: %d files deleted", count)
        return count
