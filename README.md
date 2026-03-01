# EstraMap

**Community‑powered estradiol patch tracker**

EstraMap is a lightweight web application that helps people locate in‑stock
estradiol patches when pharmacies are running low.  Data is crowd‑sourced from
volunteer reports and displayed in a searchable feed alongside an interactive
map.  Address autocomplete and geocoding are powered by Nominatim
(OpenStreetMap) — no API keys required.  The project can run purely client‑side
(using Supabase directly) or with an optional Express+Supabase proxy for
increased security.

---

## Features

- Searchable feed of **local pharmacy reports** (name, address, medication, dose,
  stock status, time ago)
- **Online/mailer reports** (Amazon Pharmacy, Honeybee, etc.)
- Color‑coded status badges (green = in stock, yellow = low stock, red = out)
- Interactive **map view** powered by React‑Leaflet + OpenStreetMap
- Voting system to confirm whether a report is still accurate
- “Report stock” modal with step‑by‑step form and optional GPS lookup
- Support for both a simple static build or a full server‑side API proxy
- Responsive and accessible UI built with Tailwind CSS and shadcn/ui
- Mock data seeded on first load to make the site feel alive
- Optional Supabase backend with upvotes/downvotes
- Simple Express server providing a `/api/*` JSON API and static file host

## Tech stack

- **Front end:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui components
- **Map:** react‑leaflet & Leaflet/OpenStreetMap tiles
- **Data:** Supabase (client / server), React Query for fetching/caching
- **Forms:** react‑hook‑form + Zod validation
- **Back end (optional):** Express, Supabase JS
- **Geocoding:** Nominatim (OpenStreetMap) — no API key needed
- **Utilities:** date‑fns, clsx, vaul, and others listed in `package.json`
- **Testing:** Vitest with Testing Library

---

## Getting started

The repository is a monorepo‑style project with both client and server code.
You can run everything locally with Node (v18+ recommended).

### 1. Clone and install

```bash
git clone https://github.com/your‑username/estramap.git
cd estramap
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in the values:

```ini
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PORT=3001          # optional, defaults to 3001
```

For a fully static deployment (no server side code), uncomment and set the
`VITE_` variables instead of the plain ones.  This will expose the keys in the
bundle and talk directly to Supabase from the browser.

### 3. Development

Start the client and server together:

```bash
npm run dev        # runs both with concurrently (client=Vite, server=tsx)
```

You can also run each side independently:

```bash
npm run dev:client  # just the Vite dev server
npm run dev:server  # just the Express API
```

The front end will be available at http://localhost:5173 and the API at
http://localhost:3001 by default.  Client requests will automatically proxy to
the server if it is running.

### 4. Building & production

```bash
npm run build      # compiles TypeScript, builds Vite production bundle
npm start          # run built server (sets NODE_ENV=production)
```

A static‑only build can be served from any static host (Netlify, Vercel, etc).
Just deploy the contents of `dist/` and configure the `VITE_` environment
variables for Supabase keys.

### 5. Testing

```bash
npm run test        # run all tests once
npm run test:watch  # run in watch mode
```

Currently there is one trivial example test; feel free to add more as you
develop.

---

## API reference

The Express server exposes a simple JSON API when running in `NODE_ENV`
production or during local development.  Client code will automatically fall
back to calling Supabase directly if the proxy is unavailable.

```
GET    /api/reports             # list reports (latest first)
POST   /api/reports             # create a new report ({ type, pharmacy_name, … })
PATCH  /api/reports/:id/vote    # vote on a report (body: { type: "up"|"down" })
```

The Supabase table schema is defined under `supabase/migrations` and the
client helper types live in `src/integrations/supabase/types.ts`.

---

## Deployment

A few deployment options:

1. **Full server** – host the Express app on Node (Heroku, Fly.io, DigitalOcean,
   etc) and use a Supabase project for data.  Keep the `.env` keys server‑side.
2. **Static only** – build and deploy to a static host, set `VITE_` vars, and
   rely on direct Supabase access from the browser.  Address search uses
   Nominatim (OpenStreetMap) directly — no API key needed.
3. **Hybrid** – run just the proxy on a small Node instance and point the
   static front end at it; allows you to keep the Supabase credentials private.

Supabase migrations in `supabase/migrations` can be applied with the
`supabase` CLI if you're running your own project; see Supabase docs for
details.

---

## Contributing

Contributions are welcome!  Please open issues or pull requests on the
GitHub repository.  The project uses ESLint + Prettier for formatting and
adheres to a strict TypeScript configuration (`npm run lint`).

---

## License

This code is released under the **MIT License**.  See `LICENSE` for details.

