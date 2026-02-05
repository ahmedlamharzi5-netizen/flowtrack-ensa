#!/bin/bash

# Railway Initialization Script
# This script initializes the database when deployed to Railway

echo "🚀 FlowTrack Database Initialization"
echo "======================================"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set!"
  exit 1
fi

echo "📊 Database URL detected"
echo ""

# Reset and setup database
echo "🔄 Resetting database..."
export PATH="/tmp/node-v18.17.0-darwin-x64/bin:$PATH"
node reset-db.js

if [ $? -eq 0 ]; then
  echo "✅ Database reset successful"
else
  echo "❌ Database reset failed"
  exit 1
fi

echo ""
echo "🌱 Setting up schema and test data..."
npm run setup-db

if [ $? -eq 0 ]; then
  echo "✅ Database setup complete!"
  exit 0
else
  echo "❌ Database setup failed"
  exit 1
fi
