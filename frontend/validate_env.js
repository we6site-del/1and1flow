const fs = require('fs');
const path = require('path');

function checkFile(filename) {
    const filePath = path.join(process.cwd(), filename);
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${filename} (not found)`);
        return;
    }

    console.log(`Checking ${filename}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        const parts = trimmed.split('=');
        const key = parts[0];
        let value = parts.slice(1).join('=');

        // Remove wrapping quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
        }

        if (value.startsWith('{') || value.startsWith('[')) {
            try {
                JSON.parse(value);
                console.log(`✅ ${key} is valid JSON`);
            } catch (e) {
                console.error(`❌ ${key} at line ${index + 1} is INVALID JSON: ${e.message}`);
                // identify position
                if (e.message.includes('position')) {
                    const pos = parseInt(e.message.match(/position (\d+)/)[1]);
                    const start = Math.max(0, pos - 10);
                    const end = Math.min(value.length, pos + 10);
                    console.error(`   Context: ...${value.substring(start, end)}...`);
                    console.error(`            ${' '.repeat(pos - start)}^`);
                }
            }
        } else if (value.includes('\\')) {
            // Check for potential bad escapes in non-JSON checking context if logical
            console.warn(`⚠️ ${key} contains backslashes. Check if these are intended: ${value.substring(0, 20)}...`);
        }
    });
}

checkFile('.env');
checkFile('.env.local');
checkFile('.env.production');
