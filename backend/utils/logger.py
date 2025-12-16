import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("backend.log")
    ]
)


def get_logger(name: str):
    return logging.getLogger(name)

# Create a default logger instance for direct import
logger = get_logger("backend")
