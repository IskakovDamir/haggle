# Haggle

An AI agent on the borrower's side. It reads a credit card statement, computes what the debt costs and which asks are worth making, then negotiates with the bank by voice or text, and charges only after a win. Hackathon build (Zimran Business Cup 2.0, Money track): US adults 25-45, web only, no login. Read SPEC.md for the product, the contracts and who owns which files.

# Commands
- Dev: pnpm dev
- Typecheck: pnpm tsc --noEmit
- Lint: pnpm lint
- Unit tests: pnpm vitest run
- Single test: pnpm vitest run src/lib/engine/payoff.test.ts
- Sample statements: pnpm samples (regenerates public/samples/*.pdf)
- Voice agent: pnpm setup:agent (creates or updates the ElevenLabs agent from src/lib/negotiator)

# Conventions
- Next.js App Router, TypeScript strict, Tailwind. Read AGENTS.md before touching Next.js APIs.
- Money is integer cents. Rates are integer basis points (27.24% = 2724). Format only in UI via src/lib/money.ts.
- Every number the user sees is computed by src/lib/engine (pure functions, vitest and fast-check). The model never does arithmetic: it reads documents, speaks, and words things.
- Model output is untrusted input: validate it with zod, cross-check it against the engine or the transcript, and show the user what was read before using it.
- Claude calls live only in src/lib/statement, src/lib/negotiator and their API routes. Every route degrades to a clear "not configured" state when a key is missing. No canned results anywhere.
- The agent tells the truth: it says it is an AI assistant, says the call is recorded, and never claims an offer, a hardship or any fact the user did not provide.
- No login. State lives in the browser (src/lib/store). Never store a full card number; keep the last 4 only.
- UI copy is US English, plain, short sentences. Sample data is labelled as sample data. Practice calls are labelled as practice.

# Git
- Small conventional commits (feat:, fix:, chore:, test:), lowercase, one line.

# Gotchas
- This folder's path is long. pnpm uses a flat node_modules (pnpm-workspace.yaml) so vitest and esbuild can start; leave it.
- Vercel caps request bodies at 4.5 MB: downscale images in the browser before upload.
- Do not add dependencies without saying so; parallel sessions share one lockfile.
- A dev server may already be running on port 3000. Do not start a second one.

# Next.js
@AGENTS.md
