"""pydantic-ai agents: Gemini and OpenAI with native web search, plus a no-tools reconciler."""

from collections.abc import Sequence
from typing import Any

from pydantic_ai import Agent, PromptedOutput
from pydantic_ai.capabilities import NativeTool
from pydantic_ai.native_tools import WebSearchTool

from research_service.models import ResearchAnswer
from research_service.prompts import RECONCILE, SYSTEM
from research_service.research import Engine, Engines, Reconciler, Researcher
from research_service.sources import collect_sources

GEMINI_MODEL = 'google:gemini-3.8-flash'
OPENAI_MODEL = 'openai-responses:gpt-5-mini'


def _agent(model: Any, prompt: str, capabilities: Sequence[Any] = ()) -> 'Agent[None, ResearchAnswer]':
    return Agent(
        model,
        instructions=prompt,
        output_type=PromptedOutput(ResearchAnswer),
        capabilities=list(capabilities),
        retries=2,
    )


def make_engine(model: Any, capabilities: Sequence[Any] = ()) -> Engine:
    agent = _agent(model, SYSTEM, capabilities)

    async def run(question: str) -> ResearchAnswer:
        result = await agent.run(question)
        sources = collect_sources(result.all_messages(), result.output.sources)
        return result.output.model_copy(update={'sources': sources})

    return run


def make_reconciler(model: Any) -> Reconciler:
    agent = _agent(model, RECONCILE)

    async def run(question: str, answers: list[ResearchAnswer]) -> ResearchAnswer:
        drafts = '\n'.join(f'Researcher {i + 1}: {a.model_dump_json()}' for i, a in enumerate(answers))
        return (await agent.run(f'Question: {question}\n{drafts}')).output

    return run


def build_researcher(timeout: float = 20.0) -> Researcher:
    search = [NativeTool(WebSearchTool())]
    engines = Engines(
        gemini=make_engine(GEMINI_MODEL, search),
        openai=make_engine(OPENAI_MODEL, search),
        reconcile=make_reconciler(GEMINI_MODEL),
    )
    return Researcher(engines, timeout)
