# Backend Cohesion Analytics

Server Node.js con Express, SQLite3, autenticazione JWT.

## Struttura

```
server/
├── src/
│   ├── db/
│   │   ├── index.ts    # Connessione DB, init, seed
│   │   ├── schema.ts   # Migrazioni
│   │   └── seed.ts     # Utenti e pagine default
│   ├── lib/
│   │   └── api-keys.ts # Gestione API key esterne (hash, source, type)
│   ├── middleware/
│   │   └── auth.ts     # JWT verify, requireAuth
│   ├── routes/
│   │   ├── auth.ts     # POST /login, GET /me, POST /logout
│   │   ├── users.ts    # CRUD utenti (admin)
│   │   ├── pages.ts    # Visibilità pagine (admin)
│   │   ├── objectives.ts # Obiettivi (Editor/Admin)
│   │   └── api-keys.ts # CRUD API key (admin)
│   └── index.ts
└── package.json
```

## Database SQLite3

File: `server/data/coesione.sqlite3` (creato al primo avvio)

### Tabelle

**users**
- id, name, email, password_hash, active, role, created_at
- Ruoli: Admin, Editor, Viewer
- Password hash con bcrypt

**page_visibility**
- page_key (Totale, Social, Video, Newsletter, Siti, Sondaggi)
- is_public: accesso senza login
- is_visible_for_users: visibile nella sidebar

**objectives**
- id, title, category, path, value (numero), unit (% K M o vuoto)

### Utenti seed

| Email | Ruolo |
|-------|-------|
| admin@monrif.net | Admin |

## API

### Auth

- `POST /api/v1/auth/login` — Body: `{ email, password }` → `{ token, user }`
- `GET /api/v1/auth/me` — Header: `Authorization: Bearer <token>` → user
- `POST /api/v1/auth/logout` — No body

### Users (solo Admin)

- `GET /api/v1/users` — Lista utenti
- `POST /api/v1/users` — Crea: `{ name, email, password, role? }`
- `PUT /api/v1/users/:id` — Aggiorna: `{ name?, email?, active?, role?, password? }`
- `DELETE /api/v1/users/:id` — Elimina

### API Keys (solo Admin)

- `GET /api/v1/api-keys` — Lista (hash, name, source, type, createdAt; key mai inviata)
- `POST /api/v1/api-keys` — Crea: `{ name, source, type, key }` (source obbligatorio)
- `PUT /api/v1/api-keys/:hash` — Aggiorna: `{ name?, source?, type?, key? }`
- `DELETE /api/v1/api-keys/:hash` — Elimina

Tipi: `jwt`, `api_key`, `secret_client`, `token_json`. Identificatore: hash SHA256 del contenuto.

### Objectives (Editor/Admin)

- `GET /api/v1/objectives` — Lista obiettivi (pubblico)
- `PUT /api/v1/objectives/:id` — Aggiorna: `{ value, unit }` (Editor/Admin)

### Pages (visibilità)

- `GET /api/v1/pages/visibility` — Tutte le pagine (pubblico)
- `GET /api/v1/pages/visibility/:pageKey` — Singola pagina (pubblico)
- `PUT /api/v1/pages/visibility/:pageKey` — Aggiorna (solo Admin): `{ isPublic, isVisibleForUsers }`

## Avvio

```bash
cd server
npm install
npm run dev
```

Porta: 3001 (configurabile con `PORT`)

## Variabili ambiente

- `PORT` — Porta server (default 3001)
- `DB_PATH` — Path file SQLite (default: `./data/coesione.sqlite3`)
- `JWT_SECRET` — Secret per JWT (default: dev secret)
