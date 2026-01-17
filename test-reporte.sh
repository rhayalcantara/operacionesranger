#!/bin/bash
TOKEN='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwibm9tYnJlcyI6ImFkbWluIiwiYXBlbGxpZG9zIjoiYWRtaW4iLCJuaXZlbCI6OSwiaWF0IjoxNzYxMDAzMjE0LCJleHAiOjE3NjEwMDY4MTR9.LOaDLHF3aiSc3SyT1A7gHQ_fG2y-HecLc5vI2FZqqAQ'

echo "Probando endpoint: /api/reportes/empleados-por-tipo-nomina"
echo "=============================================="
echo ""

echo "1. Todos los empleados:"
curl -s 'http://localhost:3333/api/reportes/empleados-por-tipo-nomina?id_tipo_nomina=todos' -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN" | python -m json.tool

echo ""
echo ""
echo "2. Solo empleados activos:"
curl -s 'http://localhost:3333/api/reportes/empleados-por-tipo-nomina?status=1' -H 'Content-Type: application/json' -H "Authorization: Bearer $TOKEN" | python -m json.tool
