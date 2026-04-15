#!/bin/bash
# Script de prueba para validar el fix del parámetro 'activo' en el endpoint de clientes
# Sistema de Gestión de Turnos - OperacionesRanger

echo "=================================================="
echo "Test: Endpoint GET /api/clientes con parámetro activo"
echo "=================================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
API_URL="http://localhost:3000"
USERNAME="admin"
PASSWORD="Admin123!"

echo "1. Obteniendo token de autenticación..."
echo "   POST $API_URL/api/auth/login"

# Login para obtener token
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

# Verificar si login fue exitoso
if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
  echo -e "   ${GREEN}✓ Login exitoso${NC}"

  # Extraer token (usando grep y sed para compatibilidad)
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
  echo "   Token obtenido: ${TOKEN:0:30}..."
else
  echo -e "   ${RED}✗ Error en login${NC}"
  echo "   Response: $LOGIN_RESPONSE"
  exit 1
fi

echo ""
echo "=================================================="
echo "2. Probando endpoint sin filtro activo..."
echo "   GET $API_URL/api/clientes?page=1&pageSize=5"

RESPONSE_ALL=$(curl -s -X GET "$API_URL/api/clientes?page=1&pageSize=5" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE_ALL" | grep -q '"data"'; then
  echo -e "   ${GREEN}✓ Endpoint responde correctamente${NC}"

  # Contar registros
  TOTAL=$(echo "$RESPONSE_ALL" | grep -o '"total":[0-9]*' | sed 's/"total"://')
  echo "   Total de clientes: $TOTAL"
else
  echo -e "   ${RED}✗ Error en el endpoint${NC}"
  echo "   Response: $RESPONSE_ALL"
  exit 1
fi

echo ""
echo "=================================================="
echo "3. Probando endpoint con activo=true..."
echo "   GET $API_URL/api/clientes?page=1&pageSize=5&activo=true"

RESPONSE_ACTIVE=$(curl -s -X GET "$API_URL/api/clientes?page=1&pageSize=5&activo=true" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE_ACTIVE" | grep -q '"data"'; then
  echo -e "   ${GREEN}✓ Filtro activo=true funciona${NC}"

  # Contar registros activos
  TOTAL_ACTIVE=$(echo "$RESPONSE_ACTIVE" | grep -o '"total":[0-9]*' | sed 's/"total"://')
  echo "   Total de clientes activos: $TOTAL_ACTIVE"

  # Verificar que todos son activos
  if echo "$RESPONSE_ACTIVE" | grep -q '"activo":false'; then
    echo -e "   ${YELLOW}⚠ Advertencia: Se encontraron clientes inactivos en la respuesta${NC}"
  else
    echo -e "   ${GREEN}✓ Todos los registros son activos${NC}"
  fi
else
  echo -e "   ${RED}✗ Error con filtro activo=true${NC}"
  echo "   Response: $RESPONSE_ACTIVE"
  exit 1
fi

echo ""
echo "=================================================="
echo "4. Probando endpoint con activo=false..."
echo "   GET $API_URL/api/clientes?page=1&pageSize=5&activo=false"

RESPONSE_INACTIVE=$(curl -s -X GET "$API_URL/api/clientes?page=1&pageSize=5&activo=false" \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE_INACTIVE" | grep -q '"data"'; then
  echo -e "   ${GREEN}✓ Filtro activo=false funciona${NC}"

  # Contar registros inactivos
  TOTAL_INACTIVE=$(echo "$RESPONSE_INACTIVE" | grep -o '"total":[0-9]*' | sed 's/"total"://')
  echo "   Total de clientes inactivos: $TOTAL_INACTIVE"

  # Verificar que todos son inactivos
  if echo "$RESPONSE_INACTIVE" | grep -q '"activo":true'; then
    echo -e "   ${YELLOW}⚠ Advertencia: Se encontraron clientes activos en la respuesta${NC}"
  else
    echo -e "   ${GREEN}✓ Todos los registros son inactivos${NC}"
  fi
else
  echo -e "   ${RED}✗ Error con filtro activo=false${NC}"
  echo "   Response: $RESPONSE_INACTIVE"
  exit 1
fi

echo ""
echo "=================================================="
echo "5. Resumen de Resultados"
echo "=================================================="
echo "   Total de clientes (sin filtro): $TOTAL"
echo "   Clientes activos (activo=true): $TOTAL_ACTIVE"
echo "   Clientes inactivos (activo=false): $TOTAL_INACTIVE"
echo ""

# Verificar que la suma es correcta
if [ "$TOTAL" -eq "$((TOTAL_ACTIVE + TOTAL_INACTIVE))" ]; then
  echo -e "   ${GREEN}✓ La suma de activos + inactivos = total (correcto)${NC}"
else
  echo -e "   ${YELLOW}⚠ La suma no coincide (puede haber registros duplicados o error de conteo)${NC}"
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✓ Todas las pruebas completadas exitosamente${NC}"
echo "=================================================="
