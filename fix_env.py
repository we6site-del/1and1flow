import os

env_content = """NEXT_PUBLIC_SUPABASE_URL="https://bamcwwtwtvxjjcdfbmdr.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhbWN3d3R3dHZ4ampjZGZibWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNjk4NDAsImV4cCI6MjA3OTY0NTg0MH0._FQ2o4S0UxUpOHrrSfk6FnMyRCL2byOkWdUHGWEqy2U"
NEXT_PUBLIC_API_URL="/api"
NEXT_PUBLIC_TLDRAW_LICENSE_KEY="tldraw-2026-03-27/WyJrQTZ1NTJoSSIsWyIqIl0sMTYsIjIwMjYtMDMtMjciXQ.MIV1xlHTC2vlo5nh5iByVHP2mQiUHjH/HED9kB1fTz2oFzW7hcvYl2C0A+aHOAKB88v010Ns8/oF9u/ULfCS5w"
NEXT_PUBLIC_SITE_URL="https://lunyee.cn"
NEXT_PUBLIC_COOKIE_DOMAIN=".lunyee.cn"
"""

try:
    with open("/var/www/11flow/frontend/.env.local", "w", encoding="utf-8") as f:
        f.write(env_content)
    print("✅ Successfully updated .env.local with quoted values")
except Exception as e:
    print(f"❌ Error writing .env.local: {e}")
