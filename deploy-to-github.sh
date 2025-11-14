#!/bin/bash

echo "========================================="
echo "Deploying AI ATC to GitHub (for Vercel)"
echo "========================================="
echo ""

# Check if index.html exists
if [ ! -f "index.html" ]; then
    echo "❌ ERROR: index.html not found in root directory!"
    exit 1
fi

echo "✅ index.html found in root"
echo ""

# Show what will be committed
echo "Files to be committed:"
git status --short

echo ""
read -p "Continue with commit? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Add all files
echo "Adding files..."
git add .

# Commit
echo "Committing..."
git commit -m "Fix Vercel deployment - move frontend to root"

# Push
echo "Pushing to GitHub..."
git push origin main

echo ""
echo "========================================="
echo "✅ Pushed to GitHub!"
echo "========================================="
echo ""
echo "Vercel will auto-deploy in ~30-60 seconds."
echo ""
echo "If still getting 404:"
echo "1. Go to Vercel Dashboard"
echo "2. Your project → Settings → General"
echo "3. Scroll to 'Root Directory'"
echo "4. Make sure it's set to: ./ (or empty)"
echo "5. Click 'Save'"
echo "6. Redeploy from Deployments tab"
echo ""
