# Cohesion Analytics

Dashboard analytics per il monitoraggio di obiettivi e metriche (social, video, newsletter, siti, sondaggi).

## Stack

- Vue 3 (Composition API)
- Vue Router 4
- Tailwind CSS 4
- TypeScript
- Vite
- ApexCharts

## Installazione

```bash
npm install
npm run dev
```

Build produzione:

```bash
npm run build
```

### Docker

Build e avvio con Docker (solo Node):

```bash
docker build -t cohesion-analytics .
docker run -p 8080:3000 cohesion-analytics
```

Oppure con Docker Compose:

```bash
docker compose up -d
```

La dashboard sarà disponibile su `http://localhost:8080`.

### GitHub Actions

La build dell'immagine Docker viene eseguita automaticamente su push e pull request verso `main` o `master`. Su push, l'immagine viene pubblicata su GitHub Container Registry (`ghcr.io`).

## Struttura del progetto

```
src/
├── components/
│   ├── dashboard/     # MetricCard, GoalProgress, ObjectiveCard, ObjectivePieChart, CategoryProgressCard
│   ├── layout/       # AdminLayout, AppHeader, AppSidebar, UserMenu
│   └── ...
├── composables/
│   ├── useObjectives.ts      # Obiettivi e target
│   ├── useGoals.ts           # Goal per sezione
│   ├── useUsers.ts           # Gestione utenti
│   ├── useCurrentUser.ts     # Utente corrente
│   ├── useAdminVisibility.ts # Visibilità dashboard (Pubblica/Privata, Visibile)
│   ├── useCategoryProgress.ts
│   ├── useReportData.ts
│   └── usePdfExport.ts
├── views/
│   ├── Dashboard/    # Totale, Social, Video, Newsletter, Siti, Sondaggi
│   └── Admin/        # GoalsAdmin, UsersAdmin
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
- Persistenza in `localStorage`

### Gestione utenti

- **Account settings** (`/admin/users`): menu utente → Account settings

Funzionalità:

- Lista utenti: nome, email, attivo, ruolo, password
- Switch **Attivo/Disattivo** per utente
- **Ruoli**: Admin, Editor, Viewer
- **Modifica**: pulsante ingranaggio o doppio click sulla riga per abilitare i campi
- **Password**: campo visibile solo in modalità modifica
- **Aggiungi utente**: pulsante in alto
- **Rimuovi**: icona cestino con conferma
- Filtro ricerca e "Mostra solo attivi"
- Persistenza in `localStorage`

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

- `localStorage` per: obiettivi, goal, utenti, utente corrente, visibilità admin
- Nessun backend: dati solo locali

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
