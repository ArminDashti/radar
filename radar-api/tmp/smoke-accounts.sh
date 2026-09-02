#!/bin/sh
set -e
BASE=http://radar-api:8088

echo "=== LOGIN ADMIN ==="
ADMIN=$(curl -sS -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d '{"username":"armin","password":"dopadopa123"}')
echo "$ADMIN"
ADMIN_TOKEN=$(printf '%s' "$ADMIN" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
ADMIN_ROLE=$(printf '%s' "$ADMIN" | sed -n 's/.*"role":"\([^"]*\)".*/\1/p')
echo "admin role=$ADMIN_ROLE"
test "$ADMIN_ROLE" = "admin"

USER="u$(date +%s)"
echo "=== SIGNUP $USER ==="
SIGNUP=$(curl -sS -X POST "$BASE/api/auth/signup" -H "Content-Type: application/json" -d "{\"username\":\"$USER\",\"password\":\"password123\"}")
echo "$SIGNUP"
USER_TOKEN=$(printf '%s' "$SIGNUP" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
USER_ROLE=$(printf '%s' "$SIGNUP" | sed -n 's/.*"role":"\([^"]*\)".*/\1/p')
echo "user role=$USER_ROLE"
test "$USER_ROLE" = "user"

echo "=== USER FORBIDDEN CREATE HOST ==="
CODE=$(curl -sS -o /tmp/forbid.txt -w "%{http_code}" -X POST "$BASE/api/hosts" -H "Authorization: Bearer $USER_TOKEN" -H "Content-Type: application/json" -d '{"name":"x","host":"x.test","http_enabled":true,"icmp_enabled":false,"probe_id":null,"active":true}')
echo "status=$CODE"
cat /tmp/forbid.txt; echo
test "$CODE" = "403"

echo "=== HOST REQUEST ==="
REQ=$(curl -sS -X POST "$BASE/api/host-requests" -H "Authorization: Bearer $USER_TOKEN" -H "Content-Type: application/json" -d '{"name":"Smoke Test","host":"smoke.example.com","http_enabled":true,"icmp_enabled":false}')
echo "$REQ"
REQ_ID=$(printf '%s' "$REQ" | sed -n 's/.*"id":\([0-9]*\).*/\1/p')
test -n "$REQ_ID"

echo "=== PREFS PUT/GET ==="
GRID=$(curl -sS "$BASE/api/grid/hosts?interval=minutes&protocol=http&probe=all")
HID=$(printf '%s' "$GRID" | sed -n 's/.*"id":\([0-9]*\).*/\1/p' | head -1)
echo "host id=$HID"
curl -sS -X PUT "$BASE/api/me/host-prefs" -H "Authorization: Bearer $USER_TOKEN" -H "Content-Type: application/json" -d "{\"host_ids\":[$HID]}"
echo
PREFS=$(curl -sS "$BASE/api/me/host-prefs" -H "Authorization: Bearer $USER_TOKEN")
echo "$PREFS"
echo "$PREFS" | grep -q "$HID"

echo "=== APPROVE ==="
curl -sS -X POST "$BASE/api/host-requests/$REQ_ID/approve" -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{}'
echo
echo "=== OK ==="
