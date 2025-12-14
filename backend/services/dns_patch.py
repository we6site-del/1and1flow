
import socket

# Save original getaddrinfo to avoid infinite recursion or losing functionality
_original_getaddrinfo = socket.getaddrinfo

def custom_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    """
    Custom getaddrinfo wrapper that intercepts lookups for specific hosts
    and returns a hardcoded IP.
    """
    if host == "openrouter.ai" or host == "bamcwwtwtvxjjcdfbmdr.supabase.co" or "r2.cloudflarestorage.com" in host:
        # Return a hardcoded valid Cloudflare IP for openrouter.ai, Supabase, and R2
        # Format: list of (family, type, proto, canonname, sockaddr)
        # sockaddr for AF_INET (IPv4) is (address, port)
        # 104.18.3.115 is a known valid Cloudflare Anycast IP working for both
        # print(f"DEBUG: Resolving {host} to 104.18.3.115")
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('104.18.3.115', port))]
    
    return _original_getaddrinfo(host, port, family, type, proto, flags)

def install_patch():
    """
    Installs the getaddrinfo patch. Call this once at application startup.
    Respects DISABLE_DNS_PATCH environment variable for production (HK/US servers).
    """
    import os
    if os.getenv("DISABLE_DNS_PATCH", "false").lower() == "true":
        print("INFO: DNS patch disabled via environment variable.")
        return

    if socket.getaddrinfo != custom_getaddrinfo:
        socket.getaddrinfo = custom_getaddrinfo
        print("INFO: DNS patch installed for openrouter.ai, supabase, and R2")

def uninstall_patch():
    """
    Restores the original getaddrinfo.
    """
    socket.getaddrinfo = _original_getaddrinfo
    print("INFO: DNS patch uninstalled")
