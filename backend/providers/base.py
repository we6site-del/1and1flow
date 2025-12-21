from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List

class AIProvider(ABC):
    """
    Abstract Base Class for AI Providers.
    Defines the standard interface for generating images and videos.
    Updated for 2025 Async Architecture.
    """

    @abstractmethod
    async def generate_image(
        self,
        prompt: str,
        model_path: str,
        aspect_ratio: str = "1:1",
        references: Optional[List[str]] = None,
        parameters: Optional[Dict[str, Any]] = None,
        resolution: Optional[str] = None,
        num_images: int = 1
    ) -> str:
        """
        Generates an image asynchronously.
        Returns the URL of the generated image.
        """
        pass

    @abstractmethod
    async def generate_video(
        self,
        prompt: str,
        model_path: str,
        duration: str = "5s",
        aspect_ratio: str = "16:9",
        references: Optional[List[str]] = None,
        parameters: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generates a video asynchronously.
        Returns the URL of the generated video.
        """
        pass

    def normalize_parameters(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Optional hook to normalize or clean parameters before sending to API.
        """
        return params or {}
