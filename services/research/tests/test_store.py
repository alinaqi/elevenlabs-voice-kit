import json

from research_service.models import Fact
from research_service.store import FactStore


def fact(q: str) -> Fact:
    return Fact(question=q, answer='a', sources=[], confidence='high')


def test_load_missing_file_is_empty(tmp_path):
    assert FactStore.load(tmp_path / 'nope.json').facts == []


def test_load_reads_facts(tmp_path):
    p = tmp_path / 'f.json'
    p.write_text(json.dumps([fact('dtec hours').model_dump()]))
    store = FactStore.load(p)
    assert store.lookup('dtec hours') is not None


def test_remember_and_lookup_live_cache():
    store = FactStore([], max_live=2)
    store.remember(fact('alpha beta'))
    assert store.lookup('alpha beta') is not None


def test_live_cache_is_bounded():
    store = FactStore([], max_live=2)
    for q in ('alpha one', 'bravo two', 'charlie three'):
        store.remember(fact(q))
    assert store.lookup('alpha one') is None
    assert store.lookup('charlie three') is not None
