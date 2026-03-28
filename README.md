# ScholarsGo
Scholarship search & study-abroad profile management platform for Vietnamese students.

## Tech Stack
- **Frontend**: React.js + TailwindCSS + Vite
- **Backend**: Node.js + Express + Supabase
- **Database**: PostgreSQL (Supabase)
- **AI**: OpenAI/Gemini API (P1)
- **Deployment**: Vercel (FE) + Railway (BE)

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Setup

```bash
# 1. Clone & install backend
cd backend
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_ANON_KEY, JWT_SECRET
npm install
npm run dev

# 2. Install & start frontend (new terminal)
cd frontend
cp .env.example .env.local
# Fill in VITE_API_BASE_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

## Project Structure

```
docs/                   # AI Long-term Memory (MEMORY files)
backend/                # Express.js API Server
  src/
    controllers/        # Business logic
    routes/             # Route definitions
    middlewares/        # Auth, validation, error handling
    services/           # Supabase, external APIs
    utils/              # Helpers, validators
frontend/               # React.js SPA
  src/
    components/         # UI components
    pages/             # Page-level components
    hooks/             # Custom React hooks
    services/          # API call functions
    stores/            # Zustand global state
    utils/             # Helpers, constants
```

## Scripts

### Backend
```bash
npm run dev     # Start dev server (nodemon)
npm start       # Start production server
npm run lint    # Run ESLint
```

### Frontend
```bash
npm run dev     # Start Vite dev server
npm run build   # Build for production
npm run preview # Preview production build
npm run lint    # Run ESLint
```

## Team
- **Ngáo** — Frontend Developer (React.js, TailwindCSS, Figma)
- **Ngơ** — Backend Developer (Node.js, Express, PostgreSQL)
- **Điên** — Full-stack / PM (integration, báo cáo, deployment)

## License
MIT
