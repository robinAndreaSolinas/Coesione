#!/bin/bash

# Script di test per l'API Newsletter Piano ESP
# Uso: ./test-newsletter-api.sh [JWT_TOKEN]

BASE_URL="http://localhost:3001"
JWT_TOKEN="${1:-}"

if [ -z "$JWT_TOKEN" ]; then
  echo "❌ Errore: JWT token richiesto"
  echo "Uso: ./test-newsletter-api.sh YOUR_JWT_TOKEN"
  echo ""
  echo "Per ottenere il token:"
  echo "1. Fai login su http://localhost:5173"
  echo "2. Apri la console del browser (F12)"
  echo "3. Esegui: localStorage.getItem('token')"
  exit 1
fi

echo "🧪 Test API Newsletter Piano ESP"
echo "================================"
echo ""

# Test 1: Lista publisher
echo "📋 Test 1: Lista publisher"
echo "GET $BASE_URL/api/v1/publishers"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  "$BASE_URL/api/v1/publishers")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Status: $HTTP_CODE"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ Status: $HTTP_CODE"
  echo "$BODY"
fi
echo ""

# Test 2: Metriche newsletter
echo "📊 Test 2: Metriche newsletter"
echo "GET $BASE_URL/api/v1/newsletter/metrics"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  "$BASE_URL/api/v1/newsletter/metrics")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Status: $HTTP_CODE"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  
  # Verifica valori
  OPEN_RATE=$(echo "$BODY" | jq -r '.openRate // 0' 2>/dev/null || echo "0")
  CLICK_RATE=$(echo "$BODY" | jq -r '.clickRate // 0' 2>/dev/null || echo "0")
  SUBSCRIBERS_TOTAL=$(echo "$BODY" | jq -r '.subscribersTotal // 0' 2>/dev/null || echo "0")
  SUBSCRIBERS_ACTIVE=$(echo "$BODY" | jq -r '.subscribersActive // 0' 2>/dev/null || echo "0")
  
  echo ""
  echo "📈 Metriche:"
  echo "  Open Rate: ${OPEN_RATE}%"
  echo "  Click Rate: ${CLICK_RATE}%"
  echo "  Iscritti Totali: ${SUBSCRIBERS_TOTAL}"
  echo "  Iscritti Attivi: ${SUBSCRIBERS_ACTIVE}"
else
  echo "❌ Status: $HTTP_CODE"
  echo "$BODY"
fi
echo ""

# Test 3: Health check
echo "🏥 Test 3: Health check"
echo "GET $BASE_URL/api/v1/health"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  "$BASE_URL/api/v1/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Status: $HTTP_CODE"
  echo "$BODY"
else
  echo "❌ Status: $HTTP_CODE"
  echo "$BODY"
fi
echo ""

echo "✅ Test completati!"
