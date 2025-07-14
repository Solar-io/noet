#!/bin/bash

echo "🧪 BATCH TAGGING MANUAL TEST"
echo "============================"

BACKEND_URL="http://localhost:3004"
USER_ID="user-1"

# Step 1: Get notes
echo "📋 Step 1: Getting notes..."
NOTES_JSON=$(curl -s "${BACKEND_URL}/api/${USER_ID}/notes")
if [ $? -ne 0 ]; then
  echo "❌ Failed to get notes"
  exit 1
fi
echo "✅ Notes retrieved successfully"

# Step 2: Get tags
echo "🏷️ Step 2: Getting tags..."
TAGS_JSON=$(curl -s "${BACKEND_URL}/api/${USER_ID}/tags")
if [ $? -ne 0 ]; then
  echo "❌ Failed to get tags"
  exit 1
fi
echo "✅ Tags retrieved successfully"

# Step 3: Show current state
echo "📊 Current state:"
echo "  Notes count: $(echo "$NOTES_JSON" | jq 'length')"
echo "  Tags count: $(echo "$TAGS_JSON" | jq 'length')"

# Step 4: Get first three notes
echo "📝 Step 3: Getting first 3 notes for testing..."
NOTE1_ID=$(echo "$NOTES_JSON" | jq -r '.[0].id')
NOTE2_ID=$(echo "$NOTES_JSON" | jq -r '.[1].id')
NOTE3_ID=$(echo "$NOTES_JSON" | jq -r '.[2].id')

NOTE1_TITLE=$(echo "$NOTES_JSON" | jq -r '.[0].title')
NOTE2_TITLE=$(echo "$NOTES_JSON" | jq -r '.[1].title')
NOTE3_TITLE=$(echo "$NOTES_JSON" | jq -r '.[2].title')

echo "  Note 1: $NOTE1_TITLE (ID: $NOTE1_ID)"
echo "  Note 2: $NOTE2_TITLE (ID: $NOTE2_ID)"
echo "  Note 3: $NOTE3_TITLE (ID: $NOTE3_ID)"

# Step 5: Get first tag
echo "🏷️ Step 4: Getting first tag for testing..."
TAG_ID=$(echo "$TAGS_JSON" | jq -r '.[0].id')
TAG_NAME=$(echo "$TAGS_JSON" | jq -r '.[0].name')

echo "  Test tag: $TAG_NAME (ID: $TAG_ID)"

# Step 6: Show current tags on test notes
echo "📋 Step 5: Current tags on test notes..."
NOTE1_TAGS=$(echo "$NOTES_JSON" | jq -r ".[0].tags // []")
NOTE2_TAGS=$(echo "$NOTES_JSON" | jq -r ".[1].tags // []")
NOTE3_TAGS=$(echo "$NOTES_JSON" | jq -r ".[2].tags // []")

echo "  Note 1 tags: $NOTE1_TAGS"
echo "  Note 2 tags: $NOTE2_TAGS"
echo "  Note 3 tags: $NOTE3_TAGS"

# Step 7: Test batch tag application
echo "🔄 Step 6: Testing batch tag application..."

# Apply tag to Note 1
echo "  Applying tag to Note 1..."
NOTE1_CURRENT_TAGS=$(echo "$NOTES_JSON" | jq -r ".[0].tags // []")
NOTE1_NEW_TAGS=$(echo "$NOTE1_CURRENT_TAGS" | jq ". + [\"$TAG_ID\"] | unique")

RESPONSE1=$(curl -s -X PUT "${BACKEND_URL}/api/${USER_ID}/notes/${NOTE1_ID}" \
  -H "Content-Type: application/json" \
  -d "{\"metadata\": {\"tags\": $NOTE1_NEW_TAGS}}")

if [ $? -eq 0 ]; then
  echo "  ✅ Note 1 updated successfully"
else
  echo "  ❌ Note 1 update failed"
fi

# Apply tag to Note 2
echo "  Applying tag to Note 2..."
NOTE2_CURRENT_TAGS=$(echo "$NOTES_JSON" | jq -r ".[1].tags // []")
NOTE2_NEW_TAGS=$(echo "$NOTE2_CURRENT_TAGS" | jq ". + [\"$TAG_ID\"] | unique")

RESPONSE2=$(curl -s -X PUT "${BACKEND_URL}/api/${USER_ID}/notes/${NOTE2_ID}" \
  -H "Content-Type: application/json" \
  -d "{\"metadata\": {\"tags\": $NOTE2_NEW_TAGS}}")

if [ $? -eq 0 ]; then
  echo "  ✅ Note 2 updated successfully"
else
  echo "  ❌ Note 2 update failed"
fi

# Apply tag to Note 3
echo "  Applying tag to Note 3..."
NOTE3_CURRENT_TAGS=$(echo "$NOTES_JSON" | jq -r ".[2].tags // []")
NOTE3_NEW_TAGS=$(echo "$NOTE3_CURRENT_TAGS" | jq ". + [\"$TAG_ID\"] | unique")

RESPONSE3=$(curl -s -X PUT "${BACKEND_URL}/api/${USER_ID}/notes/${NOTE3_ID}" \
  -H "Content-Type: application/json" \
  -d "{\"metadata\": {\"tags\": $NOTE3_NEW_TAGS}}")

if [ $? -eq 0 ]; then
  echo "  ✅ Note 3 updated successfully"
else
  echo "  ❌ Note 3 update failed"
fi

# Step 8: Verify the changes
echo "🔍 Step 7: Verifying changes..."
sleep 1

UPDATED_NOTES=$(curl -s "${BACKEND_URL}/api/${USER_ID}/notes")
if [ $? -ne 0 ]; then
  echo "❌ Failed to get updated notes"
  exit 1
fi

# Check if tags were applied
UPDATED_NOTE1_TAGS=$(echo "$UPDATED_NOTES" | jq -r ".[] | select(.id == \"$NOTE1_ID\") | .tags // []")
UPDATED_NOTE2_TAGS=$(echo "$UPDATED_NOTES" | jq -r ".[] | select(.id == \"$NOTE2_ID\") | .tags // []")
UPDATED_NOTE3_TAGS=$(echo "$UPDATED_NOTES" | jq -r ".[] | select(.id == \"$NOTE3_ID\") | .tags // []")

echo "  Note 1 tags after update: $UPDATED_NOTE1_TAGS"
echo "  Note 2 tags after update: $UPDATED_NOTE2_TAGS"
echo "  Note 3 tags after update: $UPDATED_NOTE3_TAGS"

# Check if test tag is present
NOTE1_HAS_TAG=$(echo "$UPDATED_NOTE1_TAGS" | jq "any(. == \"$TAG_ID\")")
NOTE2_HAS_TAG=$(echo "$UPDATED_NOTE2_TAGS" | jq "any(. == \"$TAG_ID\")")
NOTE3_HAS_TAG=$(echo "$UPDATED_NOTE3_TAGS" | jq "any(. == \"$TAG_ID\")")

SUCCESS_COUNT=0
if [ "$NOTE1_HAS_TAG" = "true" ]; then
  echo "  ✅ Note 1: Tag applied successfully"
  SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
  echo "  ❌ Note 1: Tag NOT applied"
fi

if [ "$NOTE2_HAS_TAG" = "true" ]; then
  echo "  ✅ Note 2: Tag applied successfully"
  SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
  echo "  ❌ Note 2: Tag NOT applied"
fi

if [ "$NOTE3_HAS_TAG" = "true" ]; then
  echo "  ✅ Note 3: Tag applied successfully"
  SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
  echo "  ❌ Note 3: Tag NOT applied"
fi

echo ""
echo "📊 BATCH TAGGING TEST SUMMARY:"
echo "=============================="
echo "✅ Successful applications: $SUCCESS_COUNT/3"

if [ $SUCCESS_COUNT -eq 3 ]; then
  echo "🎉 BATCH TAGGING IS WORKING CORRECTLY!"
  exit 0
else
  echo "❌ BATCH TAGGING HAS ISSUES"
  echo "   - Failed applications: $((3 - SUCCESS_COUNT))"
  exit 1
fi 