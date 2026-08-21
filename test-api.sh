#!/bin/bash

# Buy Nothing API Test Script
# Tests core endpoints to verify implementation

API_URL="http://localhost:3000"
NONPROFIT_ID=""
INVENTORY_ID=""
NEED_ID=""

echo "🧪 Buy Nothing API Test Suite"
echo "================================"
echo ""

# Health Check
echo "1️⃣  Testing Health Check..."
HEALTH=$(curl -s "$API_URL/health")
echo "Response: $HEALTH"
echo ""

# API Root
echo "2️⃣  Testing API Root..."
API_ROOT=$(curl -s "$API_URL/api")
echo "Response: $API_ROOT"
echo ""

# Register Nonprofit
echo "3️⃣  Testing POST /api/nonprofits/register..."
NONPROFIT_RESPONSE=$(curl -s -X POST "$API_URL/api/nonprofits/register" \
  -H "Content-Type: application/json" \
  -d '{
    "legalName": "Senior Living Coalition",
    "operatingName": "Senior Living Coalition",
    "primaryServices": ["geriatric_care", "permanent_supportive_housing"],
    "demographics": ["age_55_plus"],
    "serviceAreaZipCodes": ["92101", "92102", "92103"],
    "bedCapacity": 50,
    "ftesCount": 12
  }')
echo "Response: $NONPROFIT_RESPONSE"
NONPROFIT_ID=$(echo "$NONPROFIT_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Nonprofit ID: $NONPROFIT_ID"
echo ""

# Get Nonprofit
echo "4️⃣  Testing GET /api/nonprofits/:id..."
GET_NONPROFIT=$(curl -s "$API_URL/api/nonprofits/$NONPROFIT_ID")
echo "Response: $GET_NONPROFIT"
echo ""

# List Nonprofits
echo "5️⃣  Testing GET /api/nonprofits..."
LIST_NONPROFITS=$(curl -s "$API_URL/api/nonprofits?limit=10")
echo "Response: $LIST_NONPROFITS"
echo ""

# Create Inventory
echo "6️⃣  Testing POST /api/nonprofits/:nonprofitId/inventory..."
INVENTORY_RESPONSE=$(curl -s -X POST "$API_URL/api/nonprofits/$NONPROFIT_ID/inventory" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "geriatric_care",
    "quantity": 10,
    "quantityUnit": "hours",
    "description": "Medical assessment & care coordination for seniors",
    "demographics": ["age_55_plus"],
    "availableFrom": "2026-08-25T00:00:00Z",
    "availableUntil": "2026-12-31T23:59:59Z"
  }')
echo "Response: $INVENTORY_RESPONSE"
INVENTORY_ID=$(echo "$INVENTORY_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Inventory ID: $INVENTORY_ID"
echo ""

# List Inventory for Nonprofit
echo "7️⃣  Testing GET /api/nonprofits/:nonprofitId/inventory..."
LIST_INVENTORY=$(curl -s "$API_URL/api/nonprofits/$NONPROFIT_ID/inventory")
echo "Response: $LIST_INVENTORY"
echo ""

# Register Second Nonprofit
echo "8️⃣  Testing registration of second nonprofit..."
NONPROFIT2_RESPONSE=$(curl -s -X POST "$API_URL/api/nonprofits/register" \
  -H "Content-Type: application/json" \
  -d '{
    "legalName": "Rachels Promise Center",
    "operatingName": "Rachels Promise",
    "primaryServices": ["family_counseling", "emergency_shelter"],
    "demographics": ["family_with_children"],
    "serviceAreaZipCodes": ["92104", "92105"],
    "bedCapacity": 40,
    "ftesCount": 10
  }')
echo "Response: $NONPROFIT2_RESPONSE"
NONPROFIT2_ID=$(echo "$NONPROFIT2_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Nonprofit 2 ID: $NONPROFIT2_ID"
echo ""

# Create Need for Second Nonprofit
echo "9️⃣  Testing POST /api/nonprofits/:nonprofitId/needs..."
NEED_RESPONSE=$(curl -s -X POST "$API_URL/api/nonprofits/$NONPROFIT2_ID/needs" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "case_management",
    "quantity": 40,
    "quantityUnit": "hours",
    "urgency": "high",
    "deadline": "2026-09-30T23:59:59Z",
    "demographics": ["family_with_children"],
    "fairnessCriteria": "Case mgmt hours that help families transition to housing"
  }')
echo "Response: $NEED_RESPONSE"
NEED_ID=$(echo "$NEED_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Need ID: $NEED_ID"
echo ""

# List Needs for Nonprofit
echo "🔟 Testing GET /api/nonprofits/:nonprofitId/needs..."
LIST_NEEDS=$(curl -s "$API_URL/api/nonprofits/$NONPROFIT2_ID/needs")
echo "Response: $LIST_NEEDS"
echo ""

echo "✅ API Test Complete!"
echo ""
echo "📝 Notes:"
echo "- Nonprofit 1 (Senior Living): $NONPROFIT_ID"
echo "- Nonprofit 2 (Rachel's Promise): $NONPROFIT2_ID"
echo "- Inventory (Geriatric Care): $INVENTORY_ID"
echo "- Need (Case Management): $NEED_ID"
echo ""
echo "Next steps:"
echo "- Test matching: curl -X POST http://localhost:3000/api/matches"
echo "- Accept match: curl -X PATCH http://localhost:3000/api/matches/:id/accept"
