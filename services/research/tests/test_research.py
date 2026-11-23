import asyncio

import pytest

from research_service.models import ResearchAnswer
from research_service.research import Engines, Researcher


def ans(text: str, conf='high', src=('https://a.example',)) -> ResearchAnswer:
    return ResearchAnswer(answer=text, sources=list(src), confidence=conf)


def engine(result):
    async def run(question: str) -> ResearchAnswer:
        if isinstance(result, Exception):
            raise result
        return result

    return run


def reconciler(result):
    async def run(question: str, answers: list[ResearchAnswer]) -> ResearchAnswer:
        if isinstance(result, Exception):
            raise result
        return result

    return run


def make(g, o, r=None, timeout=1.0) -> Researcher:
    return Researcher(Engines(engine(g), engine(o), reconciler(r or ans('merged'))), timeout)


async def test_both_succeed_uses_reconciler():
    out = await make(ans('g'), ans('o'), ans('merged')).research('q')
    assert out.answer == 'merged'


async def test_reconcile_merges_sources():
    out = await make(ans('g', src=('https://g',)), ans('o', src=('https://o',)), ans('m', src=())).research(
        'q'
    )
    assert set(out.sources) == {'https://g', 'https://o'}


async def test_gemini_fails_uses_openai():
    out = await make(RuntimeError('x'), ans('o')).research('q')
    assert out.answer == 'o'


async def test_openai_fails_uses_gemini():
    out = await make(ans('g'), RuntimeError('x')).research('q')
    assert out.answer == 'g'


async def test_both_fail_polite_low_confidence():
    out = await make(RuntimeError('x'), RuntimeError('y')).research('q')
    assert out.confidence == 'low'
    assert 'human adviser' in out.answer
    assert out.sources == []


async def test_timeout_counts_as_failure():
    async def slow(question: str) -> ResearchAnswer:
        await asyncio.sleep(1)
        return ans('slow')

    r = Researcher(Engines(slow, engine(ans('o')), reconciler(ans('m'))), 0.05)
    assert (await r.research('q')).answer == 'o'


async def test_reconciler_failure_falls_back_to_most_confident():
    out = await make(ans('g', 'low'), ans('o', 'high'), RuntimeError('x')).research('q')
    assert out.answer == 'o'


@pytest.mark.parametrize('conf', ['high', 'medium', 'low'])
async def test_confidence_passthrough_single(conf):
    out = await make(ans('g', conf), RuntimeError('x')).research('q')
    assert out.confidence == conf


def slow_engine(result, delay: float):
    async def run(question: str) -> ResearchAnswer:
        await asyncio.sleep(delay)
        if isinstance(result, Exception):
            raise result
        return result

    return run


def make_race(g, o, timeout=1.0) -> Researcher:
    return Researcher(Engines(g, o, reconciler(ans('merged'))), timeout)


async def test_fast_returns_first_good_answer_without_waiting():
    r = make_race(slow_engine(ans('gemini'), 0.01), slow_engine(ans('openai'), 0.5))
    started = asyncio.get_running_loop().time()
    out = await r.research_fast('q')
    assert out.answer == 'gemini'
    assert asyncio.get_running_loop().time() - started < 0.3


async def test_fast_skips_failed_and_low_confidence_answers():
    r = make_race(slow_engine(RuntimeError('x'), 0.0), slow_engine(ans('openai'), 0.05))
    assert (await r.research_fast('q')).answer == 'openai'
    r = make_race(slow_engine(ans('weak', 'low'), 0.0), slow_engine(ans('strong'), 0.05))
    assert (await r.research_fast('q')).answer == 'strong'


async def test_fast_falls_back_to_best_low_answer_or_fallback():
    r = make_race(slow_engine(ans('weak', 'low'), 0.0), slow_engine(RuntimeError('x'), 0.0))
    assert (await r.research_fast('q')).answer == 'weak'
    r = make_race(slow_engine(RuntimeError('x'), 0.0), slow_engine(RuntimeError('y'), 0.0))
    assert (await r.research_fast('q')).confidence == 'low'
