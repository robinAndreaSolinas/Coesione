# Guida al Testing - Integrazione Piano ESP Newsletter

## Setup iniziale

1. **Avvia il progetto:**
   ```bash
   npm run dev:all
   ```
   Oppure in due terminali separati:
   ```bash
   npm run dev        # Frontend (http://localhost:5173)
   npm run dev:server # Backend (http://localhost:3001)
   ```

2. **Accedi come Admin:**
   - Vai su `http://localhost:5173`
   - Fai login con un account Admin

## Test 1: Configurazione Publisher (UI)

1. Vai su **Admin → API Management** (`/admin/api-management`)
2. Scorri fino alla sezione **"Piano ESP Publishers"**
3. Clicca **"+ Aggiungi publisher"**
4. Compila il form:
   - **Nome**: es. "Corriere della Sera"
   - **Site ID**: es. "557" (dal tuo account Piano ESP)
   - **API Key**: la tua API key Piano ESP
   - **Base URL**: seleziona l'ambiente (Produzione US/EU o Sandbox)
5. Clicca **"Aggiungi"**
6. Verifica che il publisher appaia nella tabella

## Test 2: Verifica API Backend

### Test endpoint publishers

```bash
# Lista publisher (richiede autenticazione Admin)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/v1/publishers

# Crea publisher
curl -X POST http://localhost:3001/api/v1/publishers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Publisher",
    "siteId": "557",
    "apiKey": "your-api-key",
    "baseUrl": "https://api-esp.piano.io"
  }'
```

### Test endpoint metriche newsletter

```bash
# Ottieni metriche aggregate (non richiede autenticazione)
curl http://localhost:3001/api/v1/newsletter/metrics
```

Risposta attesa:
```json
{
  "openRate": 25.5,
  "clickRate": 3.2,
  "subscribersTotal": 150000,
  "subscribersActive": 120000
}
```

## Test 3: Verifica Frontend

1. Vai su **Dashboard → Newsletter** (`/newsletter`)
2. Verifica che le metriche vengano caricate:
   - **Open rate (calcolato)**
   - **Click rate (calcolato)**
   - **Iscritti totali**
   - **Iscritti attivi**
3. Controlla la console del browser (F12) per eventuali errori

## Test 4: Test con Piano ESP Sandbox

Se hai accesso al sandbox Piano ESP:

1. Configura un publisher con Base URL: `http://sandbox-api-esp.piano.io`
2. Usa credenziali sandbox valide
3. Verifica che le chiamate API funzionino correttamente

## Test 5: Test con più publisher

1. Aggiungi 2-3 publisher diversi
2. Verifica che le metriche vengano aggregate correttamente
3. Le metriche totali dovrebbero essere la somma di tutti i publisher

## Debug

### Log backend
Controlla i log del server Node.js per vedere:
- Chiamate API a Piano ESP
- Errori di autenticazione o validazione
- Metriche calcolate per ogni publisher

### Log frontend
Apri la console del browser (F12) e verifica:
- Chiamate API al backend
- Errori di rete o parsing JSON
- Stato del composable `useNewsletter`

### File di configurazione
I publisher sono salvati in:
```
server/data/piano-publishers.json
```

Puoi verificare manualmente il contenuto (non modificare direttamente se possibile).

## Troubleshooting

### Nessuna metrica visualizzata
- Verifica che almeno un publisher sia configurato
- Controlla che le credenziali Piano ESP siano corrette
- Verifica che ci siano campagne attive nel periodo selezionato (ultimo mese)

### Errori 401/403
- Verifica che l'utente sia loggato come Admin
- Controlla che il JWT token sia valido

### Errori API Piano ESP
- Verifica Site ID e API Key
- Controlla che il Base URL corrisponda all'ambiente corretto
- Verifica che l'account Piano ESP abbia i permessi necessari
