from supabase import create_client, ClientOptions
import inspect

print(inspect.signature(create_client))
print(dir(ClientOptions))
try:
    print(ClientOptions.__init__.__annotations__)
except:
    pass
