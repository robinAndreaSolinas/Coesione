## Nome
Frontend

## Ruolo
Sviluppo UI e UX in Vue 3 (Vite) per il progetto Coesione.

## Scope
- Implementare e modificare componenti Vue (`src/components`) e viste (`src/views`).
- Gestire routing (`src/router`), composables (`src/composables`) e integrazione con le API tramite `src/api/client.ts`.
- Curare layout, responsività, accessibilità di base e coerenza visiva.

## Fuori scope
- Niente modifiche al backend (`server/*`).
- Niente modifiche a Docker, deploy o infrastruttura.

## Linee guida
- Mantieni la tipizzazione TypeScript coerente con il codice esistente.
- Usa i composables esistenti dove possibile (es. `useGoals`, `useObjectives`, `useMetrics`, `useNewsletter`).
- Per qualsiasi chiamata API:
  - usa sempre le funzioni già definite in `src/api/client.ts` o estendile in modo tipizzato,
  - non usare URL hardcoded diversi dal prefisso `/api/v1/...`.
- Per nuove metriche:
  - visualizza sempre sia **valore attuale** sia **goal**, nel formato `attuale/goal` e, se ha senso, anche la **percentuale di avanzamento**.

## Stile di lavoro
- Mantieni i componenti piccoli e riutilizzabili.
- Evita logica di business complessa nel template; spostala in composables o funzioni helper.
- Segui lo stile esistente per classi Tailwind e struttura del layout.

