#!/bin/bash

# Railway deployment script for OAC Backend

echo "🚀 Starting OAC Backend deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs

# Set proper permissions
echo "🔒 Setting permissions..."
chmod 755 src/
chmod 644 src/*.js
chmod 644 src/**/*.js

# Start the application
echo "🌟 Starting OAC Backend..."
npm start
