#!/bin/bash

echo ""
echo "========== DATABASE ISOLATION CHECK =========="
echo ""

DEV_COUNT=$(mongosh --quiet mongodb://localhost:27017/bingo-builder --eval 'db.cards.countDocuments({$or: [{playerName: "TestPlayer"}, {playerName: "E2EPlayer"}]})' 2>/dev/null)
TEST_COUNT=$(mongosh --quiet mongodb://localhost:27018/bingo-test --eval 'db.cards.countDocuments({$or: [{playerName: "TestPlayer"}, {playerName: "E2EPlayer"}]})' 2>/dev/null)

echo "📊 DEV Database (port 27017):   $DEV_COUNT test cards"
echo "📊 TEST Database (port 27018):  $TEST_COUNT test cards"
echo ""

if [ "$DEV_COUNT" = "0" ]; then
    echo "✅ SUCCESS: Dev database is clean! No test data found."
else
    echo "❌ PROBLEM: Test data found in dev database!"
fi

echo "=============================================="
echo ""
