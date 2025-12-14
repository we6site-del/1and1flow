import logging
import sys
import os
from logging.handlers import RotatingFileHandler

def setup_logger(name: str):
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # Check if handlers already exist to avoid duplicate logs
    if not logger.handlers:
        # Console Handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)

        # File Handler (Optional, if logs dir exists)
        log_dir = "logs"
        if os.path.exists(log_dir):
            file_handler = RotatingFileHandler(
                os.path.join(log_dir, "app.log"),
                maxBytes=10*1024*1024, # 10MB
                backupCount=5
            )
            file_handler.setLevel(logging.INFO)
            file_formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            file_handler.setFormatter(file_formatter)
            logger.addHandler(file_handler)

    return logger

# Default app logger
logger = setup_logger("lovart_backend")
