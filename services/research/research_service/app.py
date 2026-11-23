import os
from pathlib import Path
from typing import Protocol

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from research_service.models import Fact, ResearchAnswer, ResearchRequest, ResearchResponse
from research_service.ratelimit import RateLimiter
from research_service.store import FactStore

FACTS_PATH = Path(__file__).resolve().parent.parent / 'facts.json'


class AnswersQuestions(Protocol):
    async def research(self, question: str) -> ResearchAnswer: ...

    async def research_fast(self, question: str) -> ResearchAnswer: ...


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get('x-forwarded-for', '')
    return forwarded.split(',')[0].strip() or (request.client.host if request.client else 'unknown')


def _default_researcher() -> AnswersQuestions:
    from research_service.agents import build_researcher

    return build_researcher()


class Service:
    def __init__(self, researcher: AnswersQuestions | None, store: FactStore, limiter: RateLimiter) -> None:
        self.researcher = researcher
        self.store = store
        self.limiter = limiter

    async def research(self, body: ResearchRequest, request: Request) -> ResearchResponse:
        if not self.limiter.allow(_client_ip(request)):
            raise HTTPException(429, 'Too many requests')
        hit = self.store.lookup(body.question)
        if hit:
            return ResearchResponse(**hit.model_dump(exclude={'question'}), cached=True)
        self.researcher = self.researcher or _default_researcher()
        result = await self.researcher.research_fast(body.question)
        if result.confidence != 'low' or result.sources:
            self.store.remember(Fact(question=body.question, **result.model_dump()))
        return ResearchResponse(**result.model_dump())

    def facts(self) -> list[Fact]:
        return self.store.facts

    def about(self) -> dict[str, object]:
        return {
            'service': 'voice-kit research',
            'description': 'Prefetched hackathon facts + live pydantic-ai lookups for voice agents.',
            'endpoints': {
                'POST /research': 'body {"question": "..."} -> {answer, sources, confidence, cached}',
                'GET /facts': 'prefetched facts',
                'GET /health': 'liveness',
            },
            'facts': len(self.store.facts),
        }


def create_app(
    researcher: AnswersQuestions | None = None,
    store: FactStore | None = None,
    limiter: RateLimiter | None = None,
) -> FastAPI:
    app = FastAPI(title='voice-kit research')
    app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])
    store = store if store is not None else FactStore.load(FACTS_PATH)
    limiter = limiter or RateLimiter(int(os.environ.get('RATE_LIMIT_PER_MIN', '30')), 60)
    service = Service(researcher, store, limiter)
    app.get('/')(service.about)
    app.get('/health')(lambda: {'status': 'ok'})
    app.get('/facts')(service.facts)
    app.post('/research')(service.research)
    return app
