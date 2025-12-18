const https = require('https');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bamcwwtwtvxjjcdfbmdr.supabase.co';
console.log('Testing connection to:', supabaseUrl);

const req = https.get(supabaseUrl + '/auth/v1/health', (res) => {
    console.log('StatusCode:', res.statusCode);
    console.log('Headers:', res.headers);

    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (e) => {
    console.error('Connection Error:', e);
});

req.end();
