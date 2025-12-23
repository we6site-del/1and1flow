#!/bin/bash

# ==========================================
# 🚨 11Flow Security Cleanup Script 🚨
# ==========================================
# Usage: sudo ./security_cleanup.sh
# description: Detects and removes the 'javae' (XMRig) crypto miner.

echo "=== 🛡️  Starting Security Cleanup ==="
echo "Time: $(date)"

# --- 1. Identify and Kill Malicious Process ---
echo -e "\n>> Step 1: Searching for malicious process 'javae'..."

# Find PIDs associated with 'javae'
PIDS=$(pgrep -f "javae")

if [ -n "$PIDS" ]; then
    echo "⚠️  Found malicious processes: $PIDS"
    echo "    Killing processes..."
    kill -9 $PIDS
    echo "✅  Processes killed."
else
    echo "✅  No running 'javae' process found."
fi

# Also check for commonminer names just in case
OTHER_MINERS="xmrig kinsing kdevtmpfsi"
for miner in $OTHER_MINERS; do
    if pgrep -f "$miner" > /dev/null; then
        echo "⚠️  Found other suspicious process: $miner"
        pkill -9 -f "$miner"
        echo "✅  Killed $miner"
    fi
done

# --- 2. Locate and Delete the Binary ---
echo -e "\n>> Step 2: Searching for 'javae' binary files..."

# Use find to locate the file (ignoring permission errors)
FOUND_FILES=$(find / -name "javae" -type f 2>/dev/null)

if [ -n "$FOUND_FILES" ]; then
    echo "⚠️  Found suspicious files:"
    echo "$FOUND_FILES"
    
    for file in $FOUND_FILES; do
        echo "    Removing illegal file: $file"
        rm -f "$file"
        
        # Check if it was immutable
        if [ -f "$file" ]; then
             echo "    File is locked. Attempting to unlock..."
             chattr -i "$file"
             rm -f "$file"
        fi
    done
    echo "✅  Files deleted."
else
    echo "✅  No 'javae' files found on disk."
fi

# --- 3. Block Mining Domains (Network Level) ---
echo -e "\n>> Step 3: Blocking mining pools in /etc/hosts..."

DOMAINS_TO_BLOCK="xmrig.com stratum.xdag.org supportxmr.com minexmr.com"
HOSTS_FILE="/etc/hosts"

for domain in $DOMAINS_TO_BLOCK; do
    if ! grep -q "$domain" "$HOSTS_FILE"; then
        echo "127.0.0.1 $domain" >> "$HOSTS_FILE"
        echo "    Blocked $domain"
    else
        echo "    Already blocked: $domain"
    fi
done

# --- 4. Check Persistence (Cron) ---
echo -e "\n>> Step 4: Checking for suspicious Cron jobs..."
echo "---------------------------------------------------"
# List all cron jobs
for user in $(cut -f1 -d: /etc/passwd); do
    crontab -l -u $user 2>/dev/null | grep -E "javae|xmrig|pastebin|base64" && echo "⚠️  SUSPICIOUS CRON FOUND FOR USER: $user"
done
echo "---------------------------------------------------"
echo "👉 If you saw any output above, run 'crontab -e -u <user>' to remove it manually."

# --- 5. Cleanup Temp Directories ---
echo -e "\n>> Step 5: Cleaning temp directories..."
# Miners often hide in /tmp or /var/tmp
rm -rf /tmp/javae
rm -rf /var/tmp/javae
echo "✅  Temp directories verified."

echo -e "\n=== 🛡️  Cleanup Complete ==="
echo "🔴 URGENT: Please CHANGE YOUR SSH PASSWORD IMMEDIATELY!"
echo "   Command: passwd"
echo "🔴 Check your Security Group to ensure ports (Redis: 6379, Docker: 2375) are NOT open to the public."
