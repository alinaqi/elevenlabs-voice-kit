"""Keyword-overlap matching, mirroring matchFact in packages/voice-kit/src/server/research.ts."""

import re

from research_service.models import Fact

STOP = frozenset(
    'what which when where who how is are the a an for of to in do does and on at go there'.split()
    + 'dubai silicon oasis dso uae can my me get closest nearest'.split()  # place names alone are not a match
)
_SPLIT = re.compile(r'[\W_]+', re.UNICODE)


def _stem(word: str) -> str:
    if re.search(r'(ss|sh|ch|x|z|us)es$', word):
        return word[:-2]
    return re.sub(r'(?<![su]|i)s$', '', word)


def tokens(text: str) -> set[str]:
    """Lowercased, stopword-free, stemmed words (Arabic letters kept)."""
    words = (w for w in _SPLIT.split(text.lower()) if len(w) > 1 and w not in STOP)
    return {_stem(w) for w in words}


def _score(query: set[str], fact: Fact) -> float:
    return len(query & tokens(fact.question)) / len(query)


def match_fact(question: str, facts: list[Fact], threshold: float = 0.5) -> Fact | None:
    query = tokens(question)
    if not query or not facts:
        return None
    best = max(facts, key=lambda f: _score(query, f))
    return best if _score(query, best) >= threshold else None
