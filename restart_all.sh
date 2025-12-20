#!/bin/bash

echo "Starting 11Flow Comprehensive Restart..."

# 1. Check for PM2
if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found in PATH. Trying to locate..."
    # Try common locations
    export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
    if ! command -v pm2 &> /dev/null; then
         echo "Still cannot find PM2. Please run this script in an environment where PM2 is matching."
         echo "Or manually run: pm2 restart all"
    fi
fi

# 2. Restart Backend
echo "Restarting Backend..."
# Try common names
pm2 restart backend || pm2 restart api || pm2 restart server || echo "Could not restart backend via PM2 (names 'backend', 'api', 'server' not found). trying 'all'..."

# 3. Restart Frontend
echo "Restarting Frontend..."
pm2 restart frontend || echo "Could not restart frontend via PM2."

# 4. Fallback
echo "Restarting ALL PM2 processes..."
pm2 restart all --update-env

echo "Services restarted. Please check 'pm2 list' to verify status."
