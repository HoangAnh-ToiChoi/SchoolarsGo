# AI Quality Hardening And Recommend Depth

Date: 2026-05-31
Branch: `feat/ai-recommend-ui-improvements`
Authoring context: session follow-up after AI recommend, chatbot rules, and homepage news rollout

## Session goal

This session focused on the next two approved steps:

1. Harden test coverage for `news`, `chat`, and `recommend` so recent AI and content work is less likely to regress.
2. Improve recommendation quality using richer profile-derived signals without forcing a risky schema migration in the same pass.

## Approved spec

### Step 1: Test hardening

Goal:
- Add backend-level contract coverage for `news`, `chat`, and `recommend`
- Add frontend smoke coverage for important fallback states the user can actually see

Success criteria:
- Auth, validation, success contract, and operational-error behavior are tested
- News and chat fallback states are covered in E2E
- Tests can run locally with the current repo setup

Out of scope:
- Full load testing
- Full CI redesign
- Rewriting all existing Playwright tests

### Step 2: Recommendation depth

Goal:
- Improve recommendation quality using more of the existing profile and document context
- Keep deterministic ranking and guardrails
- Avoid a new schema migration unless truly necessary

Success criteria:
- Recommendation output reflects richer readiness and profile-gap signals
- Semantic scoring uses more than the original major/degree/country set
- UI tells users what to complete for better matching

Out of scope:
- Full vector database or external retrieval stack
- Large profile schema migration in this session
- Replacing rule-based ranking with pure AI ranking

## Implementation plan used

### Phase A: Add backend contract tests

- Create a lightweight `node:test` harness around isolated Express routes
- Cover `GET /api/news`
- Cover `POST /api/recommend`
- Cover `GET /api/chat/history` and `POST /api/chat`

### Phase B: Add frontend fallback coverage

- Extend `news.spec.js` with homepage API failure fallback
- Add `chat.spec.js` for chat history rendering and unavailable-service fallback

### Phase C: Deepen recommendation input model

- Extend recommendation repository to pull lightweight document signals
- Normalize profile data before scoring
- Split profile readiness into `core` and `supporting` completeness
- Add richer semantic signals from `bio`, `target_intake`, and document presence

### Phase D: Surface readiness to users

- Show richer AI profile completion cues on `ProfilePage`
- Show readiness and enrichment gaps on `RecommendPage`
- Update API docs to reflect the expanded contract

### Phase E: Verify

- Run backend contract tests
- Run frontend/backend lint
- Run frontend build
- Run targeted Playwright specs for changed flows
- Run `git diff --check`

## What changed

### Backend test coverage

Added:
- `backend/tests/contracts/helpers/http.js`
- `backend/tests/contracts/news.contract.test.js`
- `backend/tests/contracts/recommend.contract.test.js`
- `backend/tests/contracts/chat.contract.test.js`

Updated:
- `backend/package.json`

Notes:
- Tests use route-level Express apps instead of introducing another test framework
- Coverage includes auth errors, validation errors, success paths, and operational service failures

### Frontend E2E coverage

Added:
- `tests/e2e/chat.spec.js`

Updated:
- `tests/e2e/news.spec.js`
- `tests/e2e/recommend.spec.js`

Notes:
- News coverage now includes homepage fallback when `/api/news` fails
- Chat coverage includes history render and graceful fallback when chat API is unavailable

### Recommendation quality

Updated:
- `backend/src/repositories/recommend.repository.js`
- `backend/src/services/recommend.service.js`
- `backend/src/services/gemini.service.js`
- `backend/src/utils/swagger.js`
- `frontend/src/pages/ProfilePage.jsx`
- `frontend/src/pages/RecommendPage.jsx`

New recommendation behavior:
- Pulls document count and document types into the recommendation input model
- Separates readiness into:
  - `profile_gaps`
  - `profile_enrichment_gaps`
  - `profile_readiness.overall`
  - `profile_readiness.core`
  - `profile_readiness.supporting`
- Uses richer semantic signals from:
  - target major
  - bio
  - target intake
  - document presence/type
  - scholarship requirements and eligibility text
- Keeps deterministic rule scoring as a guardrail

### Existing session work included in this commit

These were part of the broader approved implementation already present in the branch and are included in the commit:
- `backend/src/app.js`
- `backend/src/controllers/chat.controller.js`
- `backend/src/services/chat.service.js`
- `backend/src/services/profile.service.js`
- `backend/src/services/chat.policy.js`
- `frontend/src/components/LatestNewsSection.jsx`
- `frontend/src/pages/HomePage.jsx`

Those changes cover:
- News route mounting
- Homepage latest news integration
- Balanced chatbot policy wiring
- Profile validation alignment for `english_level`

## Verification run

Executed successfully:
- `cd backend && npm run test:contract`
- `cd backend && npm run lint`
- `cd frontend && npm run lint`
- `cd frontend && npm run build`
- `npx playwright test tests/e2e/news.spec.js tests/e2e/recommend.spec.js tests/e2e/chat.spec.js --project=chromium`
- `git diff --check`
- `npm test -- --list`

Observed status:
- Backend contract tests: `12/12` passed
- Targeted Playwright tests: `6/6` passed
- Total Playwright inventory listed: `18 tests in 6 files`
- Backend lint: pass with existing warnings only
- Frontend lint: pass with existing warnings only
- Frontend build: pass

## Files intentionally not included

The following local changes were left untouched because they are user-owned or generated outside this task:
- `database.sql`
- `Quy_Uoc_Chung.md`
- `claude-mem/`
- `playwright-report/`
- `test-results/`

## Follow-up recommendations

1. Run the full Playwright suite once before release, not just the targeted changed specs.
2. Consider a later schema migration for profile preferences such as budget, scholarship type preference, and experience level if product wants stronger personalization.
3. Reduce longstanding lint warnings and large frontend chunk size after product-critical work is merged.
