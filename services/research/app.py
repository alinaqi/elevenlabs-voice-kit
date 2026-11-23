"""Vercel entrypoint (FastAPI zero-config): exposes the research service as `app`."""

from research_service.app import create_app

app = create_app()
