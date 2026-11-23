from typing import Literal

from pydantic import BaseModel, Field

Confidence = Literal['high', 'medium', 'low']


class ResearchAnswer(BaseModel):
    """Structured answer from a research agent. Spoken aloud, so keep it short."""

    answer: str = Field(description='One or two short spoken sentences. No markdown, no URLs.')
    sources: list[str] = Field(default_factory=list, description='Source URLs backing the answer.')
    confidence: Confidence


class Fact(ResearchAnswer):
    question: str


class ResearchRequest(BaseModel):
    question: str = Field(min_length=3, max_length=500)


class ResearchResponse(ResearchAnswer):
    cached: bool = False
