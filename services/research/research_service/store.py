import json
from collections import OrderedDict
from pathlib import Path

from research_service.matching import match_fact
from research_service.models import Fact


class FactStore:
    """Prefetched facts (read-only) plus a bounded in-memory cache of live answers."""

    def __init__(self, facts: list[Fact], max_live: int = 500) -> None:
        self.facts = facts
        self.max_live = max_live
        self._live: OrderedDict[str, Fact] = OrderedDict()

    @classmethod
    def load(cls, path: Path) -> 'FactStore':
        if not path.exists():
            return cls([])
        return cls([Fact(**item) for item in json.loads(path.read_text(encoding='utf-8'))])

    def lookup(self, question: str) -> Fact | None:
        hit = match_fact(question, self.facts)
        return hit or match_fact(question, list(self._live.values()))

    def remember(self, fact: Fact) -> None:
        self._live[fact.question] = fact
        self._live.move_to_end(fact.question)
        while len(self._live) > self.max_live:
            self._live.popitem(last=False)
