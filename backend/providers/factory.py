from .base import AIProvider
from .fal import FalProvider
from .replicate import ReplicateProvider
from .openrouter import OpenRouterProvider

class ProviderFactory:
    _providers = {}

    @classmethod
    def get_provider(cls, provider_name: str) -> AIProvider:
        provider_name = provider_name.upper()
        
        if provider_name in cls._providers:
            return cls._providers[provider_name]
            
        if provider_name == "FAL":
            instance = FalProvider()
        elif provider_name == "REPLICATE":
            instance = ReplicateProvider()
        elif provider_name == "OPENROUTER" or provider_name == "GOOGLE":
            instance = OpenRouterProvider()
        else:
            # Default to FAL if unknown, or raise error
            print(f"Unknown provider {provider_name}, defaulting to FAL")
            instance = FalProvider()
            
        cls._providers[provider_name] = instance
        return instance
