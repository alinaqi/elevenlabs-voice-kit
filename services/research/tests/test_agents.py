from pydantic_ai.models.test import TestModel

from research_service.agents import make_engine, make_reconciler
from research_service.models import ResearchAnswer

CANNED = {'answer': 'Hi.', 'sources': ['https://x'], 'confidence': 'high'}


async def test_engine_returns_structured_answer():
    run = make_engine(
        TestModel(custom_output_text='{"answer":"Hi.","sources":["https://x"],"confidence":"high"}')
    )
    out = await run('what is dtec?')
    assert isinstance(out, ResearchAnswer) and out.answer == 'Hi.'


async def test_reconciler_returns_structured_answer():
    model = TestModel(custom_output_text='{"answer":"Merged.","sources":[],"confidence":"medium"}')
    a = ResearchAnswer(**CANNED)
    out = await make_reconciler(model)('q', [a, a])
    assert out.answer == 'Merged.'


def _search_messages(content):
    from pydantic_ai.messages import ModelResponse, NativeToolReturnPart

    part = NativeToolReturnPart(tool_name='web_search', content=content, tool_call_id='1')
    return [ModelResponse(parts=[part])]


def test_collect_sources_prefers_domains_over_redirects():
    from research_service.sources import collect_sources

    msgs = _search_messages([{'title': 'dso.ae', 'uri': 'https://vertexaisearch.cloud.google.com/x'}])
    declared = ['https://vertexaisearch.cloud.google.com/y', 'https://dso.ae/page']
    assert collect_sources(msgs, declared) == ['https://dso.ae/page', 'https://dso.ae']


def test_collect_sources_caps_and_dedupes():
    from research_service.sources import collect_sources

    msgs = _search_messages([{'title': f'site{i}.com', 'uri': f'https://r/{i}'} for i in range(9)])
    out = collect_sources(msgs, ['https://site0.com'])
    assert len(out) == 5 and len(set(out)) == 5


def test_collect_sources_keeps_real_uri_when_title_is_not_domain():
    from research_service.sources import collect_sources

    msgs = _search_messages([{'title': 'Some Page', 'uri': 'https://real.example/a'}])
    assert collect_sources(msgs, []) == ['https://real.example/a']
