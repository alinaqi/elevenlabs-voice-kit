"""Research every topic in topics.yaml and write facts.json (+ a copy into the voice-kit package).

Run: uv run python prefetch.py
"""

import asyncio
import json
import shutil
from pathlib import Path

import yaml

from research_service.agents import build_researcher
from research_service.models import Fact
from research_service.research import Researcher

ROOT = Path(__file__).resolve().parent
FACTS = ROOT / 'facts.json'
KIT_COPY = ROOT.parent.parent / 'packages' / 'voice-kit' / 'src' / 'data' / 'facts.json'
CONCURRENCY = 5


def load_questions(path: Path = ROOT / 'topics.yaml') -> list[str]:
    groups = yaml.safe_load(path.read_text(encoding='utf-8'))
    return [q for questions in groups.values() for q in questions]


async def research_all(researcher: Researcher, questions: list[str]) -> list[Fact]:
    gate = asyncio.Semaphore(CONCURRENCY)

    async def one(question: str) -> Fact:
        async with gate:
            answer = await researcher.research(question)
        print(f'[{answer.confidence:6}] {question}')
        return Fact(question=question, **answer.model_dump())

    return list(await asyncio.gather(*(one(q) for q in questions)))


def write_facts(facts: list[Fact]) -> None:
    payload = json.dumps([f.model_dump() for f in facts], indent=2, ensure_ascii=False) + '\n'
    FACTS.write_text(payload, encoding='utf-8')
    KIT_COPY.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(FACTS, KIT_COPY)


async def main() -> None:
    facts = await research_all(build_researcher(timeout=45), load_questions())
    write_facts(facts)
    failed = sum(1 for f in facts if f.confidence == 'low' and not f.sources)
    print(f'wrote {len(facts)} facts ({failed} failed) to {FACTS} and {KIT_COPY}')


if __name__ == '__main__':
    asyncio.run(main())
