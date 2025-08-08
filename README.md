## Travel Planner (AI-powered) – Monorepo

An AI-assisted travel planning application with a Django REST API backend and a React (Vite + TypeScript + shadcn/ui) frontend. It supports user authentication, trip creation and management, AI-powered flight and hotel search via SerpAPI and OpenAI, trip budgeting, and live itinerary tracking.

### Highlights
- **Backend**: Django 5, Django REST Framework, Token auth, PostgreSQL
- **AI/Agents**: LangChain + OpenAI + SerpAPI (Google Flights/Hotels)
- **Frontend**: React 18, Vite, TypeScript, shadcn/ui, React Router
- **Features**: Auth, Trip planning workflow, Flight/Hotel AI search, Budgeting, Itinerary (including live items)

---

## Repository structure

```
travel/
  travel_backend/         # Django REST API
    manage.py
    requirements.txt
    travel_backend/       # Django project settings and URLs
    travel/               # App: models, serializers, views, URLs, AI agents
  travel_frontend/        # Vite + React + TS app (shadcn/ui)
    src/
      services/           # API clients (auth, trips, flights, hotels)
      contexts/           # AuthContext
      components/         # UI and business components
      pages/              # Top-level route views
```

---

## Prerequisites
- Python 3.11+
- Node.js 18+ and npm (or bun)
- PostgreSQL 14+
- SerpAPI account/key for Google Flights/Hotels
- OpenAI API key

---

## Quick start

### 1) Backend (Django API)

1. Create a virtual environment and install dependencies:
   - Linux/macOS:
     ```bash
     cd travel_backend
     python3 -m venv .venv
     source .venv/bin/activate
     pip install -r requirements.txt
     ```
   - Windows (PowerShell):
     ```powershell
     cd travel_backend
     python -m venv .venv
     .venv\Scripts\Activate.ps1
     pip install -r requirements.txt
     ```

2. Configure environment variables. Create `travel_backend/.env` from the example:
   ```bash
   cp travel_backend/.env.example travel_backend/.env
   ```
   Then set values:
   - `OPENAI_API_KEY`
   - `SERPAPI_KEY`
   - `DJANGO_SECRET_KEY`
   - `DJANGO_DEBUG` ("True"/"False")
   - `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`

   Important: The current `travel_backend/travel_backend/settings.py` contains hardcoded credentials and secret key. Before pushing to a public repository, move these to environment variables (see Security notes below) and rotate any exposed secrets.

3. Apply migrations and create a superuser:
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

4. Run the development server (defaults to `http://127.0.0.1:8000`):
   ```bash
   python manage.py runserver
   ```

5. Admin is available at `http://127.0.0.1:8000/admin/`.

### 2) Frontend (Vite + React)

1. Install dependencies:
   ```bash
   cd ../travel_frontend
   npm install
   ```

2. Start dev server (defaults to port `8080`; host is `::` for IPv6):
   ```bash
   npm run dev
   ```

3. Open `http://localhost:8080`.

Notes:
- The frontend API base URL is hardcoded as `http://localhost:8000/api` in `src/services/*.ts`. Update those if your backend runs elsewhere.
- CORS is pre-configured in the backend for `5173`, `3000`, and `8080` dev ports.

---

## Backend architecture

### Installed apps and middleware
- Apps: `travel` (domain models and API), `rest_framework`, `rest_framework.authtoken`, `corsheaders`, plus Django contrib apps.
- Middleware includes `CorsMiddleware`.

### Data model overview
- `UserProfile`: One-to-one with `auth.User` (phone, DOB, picture, preferences)
- `Trip`: Core trip entity; fields for title, destination, dates, budget, style, status
- `TripItem`: Child items (flight, hotel, attraction, restaurant, transport, activity, event)
- `TripBudget`: One-to-one with trip with totals, spent, currency, breakdown
- `TripItinerary`: One-to-one with trip; `day_plans` JSON and notes
- `UserPreference`: User-level preferences (destinations, activities, dietary, accessibility)
- `TripPlanningStage`: Tracks planning stages (flight, hotel, attractions, food, transport) with `status`, `selected_items`, `ai_options`
- `LiveItineraryItem`: Per-day actionable items with planned/actual times and completion state

### Authentication
- Token Authentication via `rest_framework.authtoken`
- Endpoints return a token on signup/login; include `Authorization: Token <token>` on subsequent requests

### AI Agents
- `travel/flight_agent.py`: LangChain agent using OpenAI + SerpAPI Google Flights
- `travel/hotel_agent.py`: LangChain agent using OpenAI + SerpAPI Google Hotels
- Both load environment variables via `python-dotenv` (`.env`)

### API surface (prefix: `/api/`)

- Auth
  - `POST /auth/register/`: create user, returns token
  - `POST /auth/login/`: login, returns token
  - `POST /auth/logout/`: revoke token

- User
  - `GET|PUT /user/profile/`: get/update profile
  - `GET|PUT /user/preferences/`: get/update preferences
  - `GET /user/dashboard/`: aggregated counts, totals, recent trips

- Trips
  - `GET|POST /trips/`: list my trips / create
  - `GET|PUT|PATCH|DELETE /trips/{trip_id}/`: detail/update/delete
  - `GET /trips/{trip_id}/summary/`: selected items, totals, remaining budget

- Trip items
  - `GET|POST /trips/{trip_id}/items/`
  - `GET|PUT|PATCH|DELETE /trips/{trip_id}/items/{item_id}/`
  - `POST /trips/{trip_id}/items/{item_id}/select/`: toggle selection

- Budget & itinerary
  - `GET|PUT /trips/{trip_id}/budget/`
  - `GET|PUT /trips/{trip_id}/itinerary/`

- Planning stages
  - `GET|POST /trips/{trip_id}/planning-stages/`
  - `GET|PUT|DELETE /trips/{trip_id}/planning-stages/{stage_id}/`
  - `GET|POST /trips/{trip_id}/planning-progress/`: fetch or update batch
  - `POST /trips/{trip_id}/planning-stages/{stage_type}/update/`
  - `POST /trips/{trip_id}/planning-stages/{stage_type}/complete/`
  - `POST /trips/{trip_id}/planning-stages/{stage_type}/skip/`

- Live itinerary
  - `GET /trips/{trip_id}/live-itinerary/`: grouped per day
  - `GET|POST /trips/{trip_id}/live-itinerary/items/`
  - `GET|PUT|PATCH|DELETE /trips/{trip_id}/live-itinerary/items/{item_id}/`
  - `POST /trips/{trip_id}/live-itinerary/items/{item_id}/complete/`
  - `POST /trips/{trip_id}/live-itinerary/items/{item_id}/skip/`
  - `POST /trips/{trip_id}/live-itinerary/items/{item_id}/times/`

- AI search
  - `POST /flights/search/` body: `{ origin, destination, departure_date, return_date?, adults?, cabin_class?, preferences? }`
  - `GET /flights/airports/?q=JFK` airport suggestions
  - `POST /hotels/search/` body: `{ destination, check_in_date, check_out_date, adults?, currency?, country?, language?, budget_max? }`

All non-auth endpoints require `Authorization: Token <token>`.

---

## Frontend architecture

- `src/contexts/AuthContext.tsx`: handles token lifecycle, profile load, and provides auth state
- `src/services/`: API clients
  - `authService.ts`: login/signup/logout, user profile
  - `tripService.ts`: trips, items, planning stages, summaries
  - `flightService.ts`: flights AI search and airport suggestions
  - `hotelService.ts`: hotels AI search
- `src/components/`: UI and feature components including trip planning flow and results
- `src/pages/Index.tsx`: entry view; switches between onboarding, planning, results, login, signup, and profile

Build/preview:
```bash
npm run build
npm run preview
```

---

## Configuration and environment

### Backend `.env` (example)
See `travel_backend/.env.example`.

### Frontend `.env` (optional)
See `travel_frontend/.env.example`. By default, services use `http://localhost:8000/api`. For deployments, either set `VITE_API_BASE_URL` and refactor services to read it, or update the hardcoded constants.

### CORS/CSRF
`CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` pre-include common dev ports (5173, 3000, 8080). Add your production domain(s) when deploying.

---

## Security notes (critical before pushing public)
- Move all secrets from `settings.py` to environment variables (`DJANGO_SECRET_KEY`, database credentials). Consider using `python-decouple` or `os.getenv` + `python-dotenv`.
- Rotate any previously committed keys/passwords (database, OpenAI, SerpAPI, Django secret key).
- Do not commit `.env` files; they are ignored by `.gitignore`.
- In `flight_agent.py`, avoid defaulting `SERPAPI_KEY` in code; read from env only.

---

## Common commands

Backend (Linux/macOS):
```bash
cd travel_backend
source .venv/bin/activate
python manage.py migrate
python manage.py runserver
```

Frontend:
```bash
cd travel_frontend
npm install
npm run dev
```

---

## Deployment notes
- Backend: configure environment variables, run migrations, and serve via gunicorn/uvicorn behind Nginx or a platform (Render/Heroku/etc.). Ensure `ALLOWED_HOSTS`, CORS, and database are set for production. Configure static files.
- Frontend: `npm run build` produces `dist/`. Host via any static host or behind the same domain as the API.

---

## Troubleshooting
- 401/403 from API: ensure you include `Authorization: Token <token>` after login/signup. Confirm CORS and CSRF configuration for your origin.
- AI search errors: verify `OPENAI_API_KEY` and `SERPAPI_KEY`. Network firewalls may block external calls.
- DB errors: verify Postgres connectivity and credentials; apply migrations.

---

## License
Proprietary (update as needed).

