"""
Smart Model Router Service
Handles intelligent model selection with rate limit tracking and fallback
"""
import time
from typing import Optional, Dict, List
from datetime import datetime, timedelta

class ModelRouter:
    def __init__(self):
        # Track failed models with cooldown periods
        self.failed_models: Dict[str, float] = {}  # model_path -> timestamp
        self.cooldown_seconds = 300  # 5 minutes
        
    def is_model_available(self, model_path: str) -> bool:
        """Check if a model is available (not in cooldown)"""
        if model_path not in self.failed_models:
            return True
            
        failed_time = self.failed_models[model_path]
        if time.time() - failed_time > self.cooldown_seconds:
            # Cooldown expired, remove from failed list
            del self.failed_models[model_path]
            return True
            
        return False
    
    def mark_model_failed(self, model_path: str):
        """Mark a model as failed (rate limited)"""
        self.failed_models[model_path] = time.time()
        print(f"Model {model_path} marked as failed. Cooldown: {self.cooldown_seconds}s")
    
    def get_next_available_model(self, models: List[Dict]) -> Optional[Dict]:
        """
        Get the next available model from a priority-sorted list
        Returns None if all models are in cooldown
        """
        for model in sorted(models, key=lambda m: m.get('priority', 999)):
            if self.is_model_available(model['api_path']):
                return model
        
        return None
    
    def get_cooldown_info(self) -> Dict[str, int]:
        """Get remaining cooldown time for each failed model"""
        result = {}
        current_time = time.time()
        
        for model_path, failed_time in self.failed_models.items():
            remaining = int(self.cooldown_seconds - (current_time - failed_time))
            if remaining > 0:
                result[model_path] = remaining
                
        return result

# Global instance
model_router = ModelRouter()
