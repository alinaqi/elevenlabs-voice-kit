import asyncio
import logging
from collections.abc import Awaitable, Callable
from dataclasses import dataclass

from research_service.models import ResearchAnswer

log = logging.getLogger(__name__)
Engine = Callable[[str], Awaitable[ResearchAnswer]]
Reconciler = Callable[[str, list[ResearchAnswer]], Awaitable[ResearchAnswer]]
RANK = {'high': 2, 'medium': 1, 'low': 0}
FALLBACK = ResearchAnswer(
    answer='I could not verify that right now. A human adviser should confirm it.',
    sources=[],
    confidence='low',
)


@dataclass
class Engines:
    gemini: Engine
    openai: Engine
    reconcile: Reconciler


def _merge_sources(answers: list[ResearchAnswer]) -> list[str]:
    return list(dict.fromkeys(s for a in answers for s in a.sources))


class Researcher:
    def __init__(self, engines: Engines, timeout: float = 20.0) -> None:
        self.engines = engines
        self.timeout = timeout

    async def _guarded(self, engine: Engine, question: str) -> ResearchAnswer | None:
        try:
            return await asyncio.wait_for(engine(question), self.timeout)
        except Exception:
            log.warning('engine failed', exc_info=True)
            return None

    async def research(self, question: str) -> ResearchAnswer:
        results = await asyncio.gather(
            self._guarded(self.engines.gemini, question), self._guarded(self.engines.openai, question)
        )
        answers = [r for r in results if r is not None]
        if not answers:
            return FALLBACK
        if len(answers) == 1:
            return answers[0]
        return await self._reconcile(question, answers)

    async def _reconcile(self, question: str, answers: list[ResearchAnswer]) -> ResearchAnswer:
        try:
            merged = await asyncio.wait_for(self.engines.reconcile(question, answers), self.timeout)
        except Exception:
            log.warning('reconcile failed', exc_info=True)
            return max(answers, key=lambda a: RANK[a.confidence])
        return merged.model_copy(update={'sources': _merge_sources([merged, *answers])})

    async def research_fast(self, question: str) -> ResearchAnswer:
        """Race engines; return the first medium/high answer so a caller on hold waits least."""
        engines = (self.engines.gemini, self.engines.openai)
        tasks = [asyncio.create_task(self._guarded(e, question)) for e in engines]
        weak: list[ResearchAnswer] = []
        try:
            for next_done in asyncio.as_completed(tasks):
                result = await next_done
                if result is not None and result.confidence != 'low':
                    return result
                weak += [result] if result is not None else []
        finally:
            for task in tasks:
                task.cancel()
        return weak[0] if weak else FALLBACK
