 Specifica Tecnica Estrazione Dati Piano ESP

Questo documento riassume i passaggi, gli endpoint API e le variabili necessarie per estrarre i dati delle campagne attive, le performance di invio e il conteggio degli iscritti.

## 1. Configurazione Base

Prima di iniziare, assicurati di avere le seguenti variabili globali:

*   **API Key (`api_key`)**: Identificatore unico per l'autenticazione [1].
*   **Site ID / Publisher ID (`site_id`)**: L'ID numerico del sito (es. `557`) [2].
*   **Base URL**: Scegliere in base all'ambiente [3]:
    *   Produzione (US/Default): `https://api-esp.piano.io`
    *   Produzione (EU): `https://api-esp-eu.piano.io`
    *   Sandbox: `http://sandbox-api-esp.piano.io`

---

## 2. Flusso delle Chiamate API

### Step 1: Ottenere Lista Campagne Attive
Recupera tutte le campagne e filtra solo quelle attive per ottenere i loro ID.

*   **Metodo:** `GET`
*   **Endpoint:** `/publisher/list/<site_id>`
*   **Parametri Query:**
    *   `api_key`: La tua API Key.
*   **Dati da Estrarre (Parsing):**
    Iterare l'array `lists` e filtrare dove `Active == 1`.
    *   `Id` (ID Campagna) [2]
    *   `Name` (Nome Campagna) [2]

### Step 2: Ottenere Performance Campagna (Invii, Aperture, Click)
Per ogni `Id` ottenuto allo Step 1, recuperare le statistiche di traffico per un intervallo di date specifico.

*   **Metodo:** `GET`
*   **Endpoint:** `/stats/campaigns/full/<campids>`
*   **Parametri Query:**
    *   `date_start`: Data inizio (formato `YYYY-MM-DD`) [4].
    *   `date_end`: Data fine (formato `YYYY-MM-DD`) [4].
    *   `api_key`: La tua API Key.
*   **Metriche da Estrarre (JSON Path):**
    *   **Mail Inviate:** `deliverability.totalsForSelectedTime.sent` [5]
    *   **Mail Aperte:** `performance.totalsForSelectedTime.open` [6]
    *   **Click Totali:** `performance.totalsForSelectedTime.click` [6]

### Step 3: Identificare Mailing List Collegate
Le campagne non contengono direttamente gli utenti; è necessario trovare le Mailing List (`sqIds`) collegate alla campagna.

*   **Metodo:** `GET`
*   **Endpoint:** `/publisher/pub/<site_id>/ml/<campaign_id>/sq`
*   **Parametri Path:**
    *   `site_id`: ID del Publisher.
    *   `campaign_id`: ID della campagna (dallo Step 1).
*   **Parametri Query:**
    *   `api_key`: La tua API Key.
*   **Dati da Estrarre:**
    *   Creare una lista di tutti gli `Id` presenti negli oggetti restituiti [7]. Questi sono i tuoi `sqIds`.

### Step 4: Ottenere Utenti Totali e Attivi
Usare gli ID delle mailing list trovati allo Step 3 per ottenere il conteggio puntuale degli iscritti.

*   **Metodo:** `POST`
*   **Endpoint:** `/publisher/pub/<site_id>/sq/subscribers`
*   **Parametri Query:**
    *   `api_key`: La tua API Key.
*   **Body (JSON):**
    ```json
    {
      "sqIds": [8] // Lista di ID ottenuti allo Step 3
    }
    ```
*   **Metriche da Estrarre:**
    La risposta è un oggetto con chiave l'ID della lista. Sommare i valori se ci sono più liste collegate alla stessa campagna.
    *   **Utenti Totali:** `squad_users` [9]
    *   **Utenti Attivi:** `squad_users_active` [9]

---

## 3. Tabella Riepilogativa Variabili

| Nome Variabile Python Suggerito | Fonte Dati (JSON Key) | Descrizione | Endpoint di Riferimento |
| :--- | :--- | :--- | :--- |
| `campaign_id` | `lists[].Id` | ID univoco campagna | `/publisher/list/` |
| `campaign_name` | `lists[].Name` | Nome leggibile | `/publisher/list/` |
| `is_active` | `lists[].Active` | 1 = Attivo, 0 = Inattivo | `/publisher/list/` |
| `emails_sent` | `totalsForSelectedTime.sent` | Totale mail inviate | `/stats/campaigns/full/` |
| `emails_opened` | `totalsForSelectedTime.open` | Totale aperture | `/stats/campaigns/full/` |
| `total_clicks` | `totalsForSelectedTime.click` | Totale click sui link | `/stats/campaigns/full/` |
| `subscribers_total` | `squad_users` | Utenti totali nel DB | `/sq/subscribers` (POST) |
| `subscribers_active` | `squad_users_active` | Utenti che ricevono mail | `/sq/subscribers` (POST) |

## 4. Note Importanti

1.  **Date:** I parametri `date_start` e `date_end` sono obbligatori per le statistiche delle campagne (`Step 2`) [4].
2.  **Rate Limit:** Se iteri su molte campagne, considera di aggiungere una piccola pausa tra le richieste per non sovraccaricare l'API, anche se la documentazione non specifica limiti espliciti.
3.  **Site ID:** Se gestisci più siti (Publisher), l'intero ciclo descritto sopra deve essere ripetuto cambiando il `site_id` nell'URL per ogni sito [2].


## **ESEMPI E PAYLOAD**
Questo ti aiuterà a capire esattamente come navigare nel dizionario Python una volta ricevuta la risposta dalla API.
1. Ottenere Lista Campagne
• Funzione: get_publisher_campaigns(site_id, api_key)
• Endpoint: GET /publisher/list/<site_id>
• Cosa restituisce: Un oggetto contenente una lista di campagne. Devi iterare su lists e filtrare per Active: 1.
Esempio Payload Risposta:
{
  "lists": [
    {
      "Id": 1001,
      "Name": "Newsletter Giornaliera",
      "Publisher_Id": 557,
      "Active": 1  // <-- Filtra se questo è 1
    },
    {
      "Id": 1002,
      "Name": "Vecchia Promo",
      "Publisher_Id": 557,
      "Active": 0
    }
  ]
}

--------------------------------------------------------------------------------
2. Ottenere Performance (Invii, Aperture, Click)
• Funzione: get_campaign_performance_stats(campaign_id, date_start, date_end)
• Endpoint: GET /stats/campaigns/full/<campids>
• Cosa restituisce: Un oggetto complesso diviso in deliverability (invii) e performance (azioni utente). I dati che cerchi sono sotto la chiave totalsForSelectedTime di ogni sezione,,.
Esempio Payload Risposta:
{
  "deliverability": {
    "totalsForSelectedTime": {
      "sent": 10500,           // <-- Mail Inviate [3]
      "soft_bounce": 50,
      "hard_bounce": 10,
      "spam": 2
    },
    "byDate": [...] // Dati giornalieri (se servono)
  },
  "performance": {
    "totalsForSelectedTime": {
      "open": 4200,            // <-- Mail Aperte [5]
      "click": 850,            // <-- Click Totali [6]
      "promo_click": 20
    },
    "byDate": [...]
  }
}

--------------------------------------------------------------------------------
3. Trovare Mailing List Collegate (Step Intermedio)
• Funzione: get_campaign_mailing_lists(site_id, campaign_id)
• Endpoint: GET /publisher/pub/<site_id>/ml/<campaign_id>/sq
• Cosa restituisce: Un array di oggetti "Mailing List". Devi estrarre il valore Id da ogni oggetto per usarlo nella chiamata successiva.
Esempio Payload Risposta:
[
  {
    "Id": 201,                 // <-- Salva questo ID
    "Name": "Iscritti Sport",
    "InternalName": "sport_list",
    "Active": 1,
    "Publisher_Id": 557,
    "mailingLists":      // ID delle campagne collegate
  },
  {
    "Id": 202,                 // <-- Salva anche questo ID
    "Name": "Iscritti Politica",
    "Active": 1,
    ...
  }
]

--------------------------------------------------------------------------------
4. Ottenere Totale Utenti (Attivi e Totali)
• Funzione: get_subscribers_count(site_id, sq_ids_list)
• Endpoint: POST /publisher/pub/<site_id>/sq/subscribers
• Body Richiesta: {"sqIds":}
• Cosa restituisce: Un dizionario dove la chiave è l'ID della lista e il valore contiene i conteggi. Devi sommare i valori se hai passato più liste.
Esempio Payload Risposta:
{
  "201": {
    "squad_users": 5000,        // <-- Utenti Totali Lista 201 [10]
    "squad_users_active": 4800  // <-- Utenti Attivi Lista 201 [10]
  },
  "202": {
    "squad_users": 1000,        // <-- Utenti Totali Lista 202
    "squad_users_active": 950   // <-- Utenti Attivi Lista 202
  }
}