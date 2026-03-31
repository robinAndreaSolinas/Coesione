## Checklist obiettivi per `/admin/goals`

### Newsletter

- **newsletter-open-rate**
  - Etichetta: Open rate (calcolato)
  - Valore obiettivo: `0.40`
  - Unità: `%`
- **newsletter-click-rate**
  - Etichetta: Click rate (calcolato)
  - Valore obiettivo: `0.05`
  - Unità: `%`
- **newsletter-subscribers-total**
  - Etichetta: Iscritti totali
  - Valore obiettivo: `10000`
  - Unità: `K`  (mostrato come 10K)
- **newsletter-subscribers-active**
  - Etichetta: Iscritti attivi
  - Valore obiettivo: `8000`
  - Unità: `K`  (mostrato come 8K)
- **newsletter.invii** (solo in stato goals, non in tabella `objectives`)
  - Etichetta: Policy briefs / newsletter distribuiti
  - Valore obiettivo: `12`
  - Unità: *(vuota)*

---

### Siti / Articoli

- **articles-unique-users**
  - Etichetta: Utenti unici articoli
  - Valore obiettivo: `50000`
  - Unità: `K`  (mostrato come 50K)
- **articles-pageviews**
  - Etichetta: Pagine viste articoli
  - Valore obiettivo: `1500000`
  - Unità: `M`  (mostrato come 1.5M)
- **articles-published-count**
  - Etichetta: Numero articoli pubblicati (totale)
  - Valore obiettivo: `500`
  - Unità: *(vuota)*
- **articles-printed-count**
  - Etichetta: Articoli stampati (carta)
  - Valore obiettivo: `40`
  - Unità: *(vuota)*
- **articles-digital-count**
  - Etichetta: Articoli digitali (web)
  - Valore obiettivo: `190`
  - Unità: *(vuota)*

In `/admin/goals` corrispondono a:

- `siti.utentiUniciArticoli`
- `siti.pagineVisteArticoli`
- `siti.articoliPubblicati`
- `siti.articoliStampati`
- `siti.articoliDigitali`

---

### Social

- **social-engagement-rate**
  - Etichetta: Engagement rate (calcolato)
  - Valore obiettivo: `0.05`
  - Unità: `%`  (5%)
- **social-views**
  - Etichetta: Views
  - Valore obiettivo: `2000000`
  - Unità: `M`  (2M)
- **social-audience**
  - Etichetta: Audience
  - Valore obiettivo: `500000`
  - Unità: `K`  (500K)
- **social-shares**
  - Etichetta: Condivisioni
  - Valore obiettivo: `10000`
  - Unità: `K`  (10K)
- **social-comments**
  - Etichetta: Commenti
  - Valore obiettivo: `5000`
  - Unità: `K`  (5K)
- **social-reach**
  - Etichetta: Reach
  - Valore obiettivo: `3000000`
  - Unità: `M`  (3M)

In `/admin/goals` corrispondono a:

- `social.engagementRate`
- `social.views`
- `social.audience`
- `social.condivisioni`
- `social.commenti`
- `social.reach`

---

### Video

- **video-audience**
  - Etichetta: Audience (stream)
  - Valore obiettivo: `200000`
  - Unità: `K`  (200K stream)
- **video-minutes-watched**
  - Etichetta: Minuti guardati
  - Valore obiettivo: `1000000`
  - Unità: `M`  (1M minuti)
- **video-completion-rate**
  - Etichetta: Completion rate
  - Valore obiettivo: `0.70`
  - Unità: `%`  (70%)

In `/admin/goals` corrispondono a:

- `video.audience`
- `video.minuti`
- `video.completionRate`

---

### Sondaggi (Logora)

- **surveys-count**
  - Etichetta: Numero sondaggi
  - Valore obiettivo: `10`
  - Unità: *(vuota)*
- **surveys-total-responses**
  - Etichetta: Risposte totali
  - Valore obiettivo: `20000`  (target 20K)
  - Unità: *(vuota)*  → 183 rimane 183
- **surveys-completion-rate**
  - Etichetta: Completion rate
  - Valore obiettivo: `0.80`
  - Unità: `%`  (80%)
- **surveys-average-responses**
  - Etichetta: Media risposte sondaggio
  - Valore obiettivo: `50`
  - Unità: *(vuota)*

In `/admin/goals` corrispondono a:

- `sondaggi.numeroSondaggi`
- `sondaggi.risposteTotali`
- `sondaggi.completionRate`
- `sondaggi.mediaRisposte`

---

### Totale (riassunto per area)

Questi sono obiettivi di alto livello (non toccano i dati raw):

- `totale.social` → `150K`
- `totale.video` → `1M`
- `totale.newsletter` → `50K`
- `totale.siti` → `350K`

Unità: in genere `K` o `M` a seconda di come vuoi visualizzare i totali.

