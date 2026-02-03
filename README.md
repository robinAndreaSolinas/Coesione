# Cohesion Analytics

Dashboard analytics per il monitoraggio di obiettivi e metriche (social, video, newsletter, siti, sondaggi).

## Stack

- Vue 3 (Composition API)
- Vue Router 4
- Tailwind CSS 4
- TypeScript
- Vite
- ApexCharts
- Backend: Node.js, Express, SQLite3, JWT

## Installazione

```bash
npm install
cd server && npm install && cd ..
```

Sviluppo (frontend + backend):

```bash
npm run dev:all
```

Oppure in due terminali:

```bash
npm run dev        # Frontend (Vite, porta 5173)
npm run dev:server # Backend (Express, porta 3001)
```

Build produzione:

```bash
npm run build
```

### Docker

Con Docker Compose (frontend + backend):

```bash
docker compose up -d
```

- Dashboard: `http://localhost:8080`
- Nginx serve il frontend e inoltra `/api` al backend
- Backend Express su porta 3001 (interno)
- Volume `server-data` per DB SQLite e api-keys

### GitHub Actions

La build dell'immagine Docker viene eseguita automaticamente su push e pull request verso `main` o `master`. Su push, l'immagine viene pubblicata su GitHub Container Registry (`ghcr.io`).

## Struttura del progetto

```
src/
├── components/
│   ├── dashboard/     # MetricCard, GoalProgress, ObjectiveCard, ObjectivePieChart, CategoryProgressCard
│   ├── layout/       # AdminLayout, AppHeader, AppSidebar, UserMenu
│   └── ...
├── api/
│   └── client.ts             # Client API (auth, users, pages, objectives, api-keys)
├── composables/
│   ├── useObjectives.ts      # Obiettivi e target
│   ├── useGoals.ts           # Goal per sezione
│   ├── useUsers.ts           # Gestione utenti (API)
│   ├── useAuth.ts            # Login, logout, utente corrente
│   ├── useAdminVisibility.ts  # Visibilità dashboard (API)
│   ├── useCategoryProgress.ts
│   ├── useReportData.ts
│   └── usePdfExport.ts
├── views/
│   ├── Dashboard/    # Totale, Social, Video, Newsletter, Siti, Sondaggi
│   └── Admin/        # GoalsAdmin, UsersAdmin, ApiManagement
└── router/
```

## Funzionalità

### Dashboard

- **Totale** (`/`): overview obiettivi con card per categoria e grafici di raggiungimento
- **Social** (`/social`): metriche social (engagement, like, ecc.)
- **Video** (`/video`): audience video
- **Newsletter** (`/newsletter`): open rate, click rate
- **Siti** (`/siti`): pagine viste, utenti unici, articoli
- **Sondaggi** (`/sondaggi`): survey newsletter

### Obiettivi

7 obiettivi per categoria (metriche generali, senza dettagli per piattaforma):

| Obiettivo | Categoria |
|-----------|-----------|
| Engagement rate (engage/reach) | Social |
| Utenti unici giornalieri | Siti |
| Audience video | Video |
| Survey newsletter | Sondaggi |
| Numero articoli pubblicati | Siti |
| Pagine viste | Siti |
| Newsletter open rate e click rate | Newsletter |

- Card per ogni obiettivo (max 3 per riga): icona, titolo, link alla pagina
- Grafico a barre: raggiungimento % per categoria
- Grafici radiali per ogni categoria

### Gestione obiettivi

- **Admin → Obiettivi** (`/admin/goals`): modifica target per ogni obiettivo
- Persistenza in DB SQLite

### API Management (solo Admin)

- **API Management** (`/admin/api-management`): gestione external API key
- Fonte obbligatoria (BigQuery, Google Analytics, Piano.io, Dailymotion, Airtable, YouTube, Meta, TikTok, ecc.)
- Tipi: JWT, API key, Secret + Client, token.json
- Chiavi salvate in modo sicuro sul server (hash SHA256, key mai inviata al client)
- Conferma eliminazione con "ELIMINA [NOME]"

### Gestione utenti

- **Account settings** (`/admin/users`): solo Admin, menu utente → Account settings

Funzionalità:

- Lista utenti: nome, email, attivo, ruolo, password
- Switch **Attivo/Disattivo** per utente
- **Ruoli**: Admin, Editor, Viewer
- **Modifica**: pulsante ingranaggio o doppio click sulla riga per abilitare i campi
- **Password**: campo visibile solo in modalità modifica (vuoto = non cambiare)
- **Aggiungi utente**: pulsante in alto, form con nome, email, password, ruolo
- **Rimuovi**: icona cestino con conferma
- Filtro ricerca e "Mostra solo attivi"
- **Nessuna registrazione**: gli utenti vengono creati solo da un Admin

### Barra admin (solo utenti Admin)

Visibile nelle dashboard (Totale, Social, Video, Newsletter, Siti, Sondaggi), sotto l’header:

- **Accesso**: switch Pubblica/Privata (richiede login o meno)
- **Visibile**: switch Sì/No (visibile agli altri utenti)  
- Impostazioni salvate per singola dashboard
- Default: tutto privato, tutto visibile
- Switch con sfondo bianco e colori verde/grigio

### Profilo utente

- **Profilo** (`/profile`): accesso personale
- Avatar con iniziale (no foto)
- Nome e email configurabili
- Menu: Profilo, Account settings, Sign out

### Export PDF

- Pulsante **Scarica PDF** nell’header per report completo con obiettivi e metriche

### Dark mode

- Toggle tema chiaro/scuro nell’header

## Persistenza

- **Backend SQLite3**: utenti, visibilità pagine, obiettivi, autenticazione
- **API key esterne**: salvate in modo sicuro sul server (hash SHA256, key mai inviata al client)
- Vedi [docs/BACKEND.md](docs/BACKEND.md) per API e schema DB

## Autenticazione

- Login con email/password (JWT)
- Utenti creati solo da Admin (nessuna registrazione pubblica)
- Pagine dashboard: pubblica/privata per singola pagina (Admin)

## Convenzioni di sviluppo

- File max 150 righe
- Componenti Solid: 60–120 righe
- Stili in file `.css` separati, no inline
- Bootstrap solo per grid e utilities
- Classi CSS semantiche in kebab-case

## Changelog

_Questo README va aggiornato ad ogni modifica significativa al progetto._

- Dashboard obiettivi con card, grafici a barre e radiali
- Gestione utenti con toggle modifica, ruoli, attivo/disattivo
- Barra admin con switch Accesso e Visibilità
- Profilo semplificato (iniziale, no foto)
- Export PDF report completo
- Obiettivi persistiti in DB
- API Management: external API key con fonte, tipo (JWT, API key, Secret+Client, token.json), hash SHA256
- Docker Compose con frontend e backend
