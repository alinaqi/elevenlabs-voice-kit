"""Turn provider search results into clean, speakable-free source URLs."""

import re
from collections.abc import Sequence
from typing import Any

from pydantic_ai.messages import ModelMessage, NativeToolReturnPart

MAX_SOURCES = 5
_DOMAIN = re.compile(r'^(?:[a-z0-9-]+\.)+[a-z]{2,}$', re.IGNORECASE)
_REDIRECT = 'vertexaisearch.cloud.google.com'


def _from_result(item: Any) -> str | None:
    if not isinstance(item, dict):
        return None
    title, uri = str(item.get('title') or ''), str(item.get('uri') or item.get('url') or '')
    if _DOMAIN.match(title):
        return f'https://{title}'
    return uri if uri and _REDIRECT not in uri else None


def _searched(messages: Sequence[ModelMessage]) -> list[str]:
    parts = (p for m in messages for p in getattr(m, 'parts', []) if isinstance(p, NativeToolReturnPart))
    items = (i for p in parts if isinstance(p.content, list) for i in p.content)
    return [u for u in map(_from_result, items) if u]


def collect_sources(messages: Sequence[ModelMessage], declared: Sequence[str]) -> list[str]:
    """Model-declared URLs (minus redirects) first, then domains from the search tool results."""
    own = [u for u in declared if _REDIRECT not in u]
    return list(dict.fromkeys([*own, *_searched(messages)]))[:MAX_SOURCES]
