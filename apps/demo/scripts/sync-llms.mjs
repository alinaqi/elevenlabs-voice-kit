// Copies the canonical llms.txt / llms-full.txt (repo root) into public/ so they are served at /llms.txt.
import { copyFileSync } from 'node:fs'

for (const f of ['llms.txt', 'llms-full.txt']) copyFileSync(new URL(`../../../${f}`, import.meta.url), new URL(`../public/${f}`, import.meta.url))
console.log('synced llms.txt + llms-full.txt → public/')
