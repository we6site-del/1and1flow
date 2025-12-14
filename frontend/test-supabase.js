const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://bamcwwtwtvxjjcdfbmdr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhbWN3d3R3dHZ4ampjZGZibWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNjk4NDAsImV4cCI6MjA3OTY0NTg0MH0._FQ2o4S0UxUpOHrrSfk6FnMyRCL2byOkWdUHGWEqy2U';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
    console.log('Testing Supabase connection...');
    try {
        const { data, error } = await supabase.from('projects').select('count', { count: 'exact', head: true });
        if (error) {
            console.error('Supabase Error:', error);
        } else {
            console.log('Supabase Connection Successful!');
            console.log('Data:', data);
        }
    } catch (err) {
        console.error('Unexpected Error:', err);
    }
}

testConnection();
