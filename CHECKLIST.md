## Collegamenti API ↔ Metriche / UI

### Newsletter

- [x] **Backend → FastAPI (metriche aggregate)**  
  - `GET /api/v1/metrics/summary` (`server/src/routes/metrics.ts`)  
    - Chiama FastAPI:
      - `GET /api/v1/newsletter/rate?from_date=2025-08-01&to_date=OGGI`
      - `GET /api/v1/newsletter/stats?from_date=2025-08-01&to_date=OGGI`
    - Mappa su obiettivi DB (`objectives`):
      - `newsletter-open-rate` → `openRateFraction` (0–1)
      - `newsletter-click-rate` → `clickRateFraction` (0–1)
      - `newsletter-subscribers-total` → `subscribersTotal`
      - `newsletter-subscribers-active` → `subscribersActive`

- [x] **Backend → FastAPI (endpoint dedicato newsletter)**  
  - `GET /api/v1/newsletter/metrics` (`server/src/routes/newsletter.ts`)  
    - Chiama FastAPI: `GET /api/v1/newsletter/rate?from_date=2025-08-01&to_date=OGGI`  
    - Restituisce:
      - `openRate`, `clickRate` (percentuali 0–100 con 2 decimali)
      - `subscribersTotal`, `subscribersActive` (da completare in base alle API se necessario)

- [x] **Frontend → Backend**  
  - `src/api/client.ts`
    - `newsletter.getMetrics()` → `GET /api/v1/newsletter/metrics`
    - `metrics.summary()` → `GET /api/v1/metrics/summary`
  - `src/composables/useNewsletter.ts`
    - Usa `newsletter.getMetrics()` per pagina **Newsletter**.
  - `src/composables/useMetrics.ts` + `src/views/Dashboard/Totale.vue`
    - Usano `metrics.summary()` per mostrare:
      - `attuale` / `goal`
      - `% dell'obiettivo` per le metriche newsletter.

### Social / Siti / Video / Sondaggi

- [ ] **Backend → FastAPI (Social)**  
  - Endpoint FastAPI disponibile:
    - `GET /api/v1/social/stats`
  - Da fare:
    - Definire aggregazione in `metrics.ts` (quali campi usare per:
      - `social-engagement-rate`, `social-views`, `social-audience`,
      - `social-shares`, `social-comments`, `social-reach`).
    - Mappare ciascun obiettivo DB `social-*` su uno o più campi di `/social/stats`.

- [ ] **Backend → FastAPI (Siti)**  
  - Endpoint FastAPI disponibile:
    - `GET /api/v1/site/stats?from_date&to_date`
  - Da fare:
    - Definire come aggregare:
      - `articles-unique-users`
      - `articles-pageviews`
      - `articles-published-count`
    - Implementare in `metrics.ts` la mappatura `obiettivo DB siti → campi /site/stats`.

- [ ] **Backend → FastAPI (Video)**  
  - Endpoint FastAPI disponibile:
    - `GET /api/v1/video/stats?from_date&to_date`
  - Da fare:
    - Legare i campi di `VideoStatsResponse` a:
      - `video-audience`
      - `video-minutes-watched`
      - `video-completion-rate`
    - Aggiungere l'aggregazione in `metrics.ts` e mappare ogni obiettivo video.

- [ ] **Backend → FastAPI (Sondaggi)**  
  - Da verificare nell'OpenAPI quali endpoint espongono dati sondaggi.  
  - Da fare:
    - Decidere mappatura verso:
      - `surveys-count`
      - `surveys-total-responses`
      - `surveys-completion-rate`
      - `surveys-average-responses`
    - Implementare logica in `metrics.ts`.

### UI Totale / Dashboard

- [x] **Totale.vue usa metriche summary**  
  - `src/views/Dashboard/Totale.vue` mostra:
    - per ogni metrica: `attuale`, `goal`, `% dell'obiettivo` usando `metricsForView`.

- [ ] **Verifica completa copertura metriche**  
  - Da fare:
    - Controllare che TUTTE le entry `objectives` (social, siti, video, newsletter, sondaggi) abbiano:
      - una sorgente dati FastAPI definita,
      - una mappatura in `metrics.ts`,
      - una rappresentazione in UI dove serve (Totale, pagine di dettaglio).

### Infrastruttura / Config

- [x] **Configurazione base FastAPI**  
  - `server/src/config.ts`:
    - `DATA_API_BASE_URL = process.env.DATA_API_BASE_URL ?? 'http://127.0.0.1:8000'`
  - Dev: avvio FastAPI su `127.0.0.1:8000`.

- [ ] **Ambiente Docker / Produzione**  
  - Da fare:
    - Aggiungere (se serve) servizio `fastapi` in `docker-compose.yaml`.
    - Impostare `DATA_API_BASE_URL` del container `server` su `http://fastapi:8000`.
    - Aggiornare la documentazione per l'avvio completo (front + server + fastapi).

