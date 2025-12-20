#!/usr/bin/env python3
import os
import sys
sys.path.insert(0, 'backend')

from services.supabase_client import supabase

# Query all CHAT models
result = supabase.table('ai_models').select('*').eq('type', 'CHAT').execute()

print("=== CHAT Models in Database ===")
print(f"Total found: {len(result.data)}")
print()

for model in result.data:
    print(f"ID: {model['id']}")
    print(f"Name: {model['name']}")
    print(f"API Path: {model['api_path']}")
    print(f"Provider: {model['provider']}")
    print(f"Is Active: {model['is_active']}")
    print(f"Created: {model.get('created_at', 'N/A')}")
    print("-" * 50)
