import pytest
from fastapi.testclient import TestClient

from research_service.app import create_app
from research_service.models import Fact, ResearchAnswer
from research_service.ratelimit import RateLimiter
from research_service.store import FactStore


class FakeResearcher:
    def __init__(self) -> None:
        self.calls = 0

    async def research(self, question: str) -> ResearchAnswer:
        self.calls += 1
        return ResearchAnswer(answer='Live answer.', sources=['https://s'], confidence='medium')

    async def research_fast(self, question: str) -> ResearchAnswer:
        return await self.research(question)


FACT = Fact(
    question='What are the Dtec office hours?',
    answer='07:30 to 15:00.',
    sources=['https://dtec'],
    confidence='high',
)


@pytest.fixture
def researcher():
    return FakeResearcher()


def client(researcher, limit=100) -> TestClient:
    app = create_app(researcher, FactStore([FACT]), RateLimiter(limit, 60))
    return TestClient(app)


def test_health(researcher):
    assert client(researcher).get('/health').json() == {'status': 'ok'}


def test_facts_endpoint(researcher):
    body = client(researcher).get('/facts').json()
    assert body[0]['question'] == FACT.question


def test_cached_hit_skips_research(researcher):
    r = client(researcher).post('/research', json={'question': 'dtec office hours?'})
    assert r.status_code == 200
    assert r.json()['cached'] is True and r.json()['answer'] == '07:30 to 15:00.'
    assert researcher.calls == 0


def test_miss_researches_then_caches(researcher):
    c = client(researcher)
    first = c.post('/research', json={'question': 'where is the nearest zebra crossing'}).json()
    second = c.post('/research', json={'question': 'where is the nearest zebra crossing'}).json()
    assert first['cached'] is False and second['cached'] is True
    assert researcher.calls == 1


@pytest.mark.parametrize('q', ['hi', 'x' * 501, ''])
def test_question_length_validation(researcher, q):
    assert client(researcher).post('/research', json={'question': q}).status_code == 422


def test_missing_question(researcher):
    assert client(researcher).post('/research', json={}).status_code == 422


def test_rate_limited(researcher):
    c = client(researcher, limit=2)
    codes = [c.post('/research', json={'question': 'dtec office hours'}).status_code for _ in range(3)]
    assert codes == [200, 200, 429]


def test_cors_headers(researcher):
    r = client(researcher).options(
        '/research', headers={'Origin': 'https://x.example', 'Access-Control-Request-Method': 'POST'}
    )
    assert r.headers['access-control-allow-origin'] == '*'


def test_root_describes_the_service(researcher):
    body = client(researcher).get('/').json()
    assert body['service'] == 'voice-kit research'
    assert 'POST /research' in body['endpoints']
    assert body['facts'] >= 1
