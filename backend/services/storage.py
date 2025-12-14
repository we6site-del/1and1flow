import boto3
import os
import requests
import uuid
from fastapi import HTTPException

from botocore.config import Config

# R2 Configuration
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME")
R2_ENDPOINT_URL = os.getenv("R2_ENDPOINT_URL")
# Public domain for R2 bucket (optional, if mapped)
R2_PUBLIC_DOMAIN = os.getenv("R2_PUBLIC_DOMAIN") 

if not R2_ACCESS_KEY_ID or not R2_SECRET_ACCESS_KEY:
    print("Warning: R2 credentials not set in environment variables")

def get_s3_client():
    
    return boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        region_name='auto' # R2 uses 'auto'
    )

def upload_to_r2(file_url: str, folder: str = "generations") -> str:
    """
    Downloads a file from a URL and uploads it to Cloudflare R2.
    Returns the public URL of the uploaded file.
    """
import base64 

# ... (existing imports)

def upload_to_r2(file_url: str, folder: str = "generations") -> str:
    """
    Downloads a file from a URL (or data URI) and uploads it to Cloudflare R2.
    Returns the public URL of the uploaded file.
    """
    try:
        # 1. Handle Data URI
        if file_url.startswith("data:"):
            try:
                header, encoded = file_url.split(",", 1)
                # header example: data:image/png;base64
                content_type = header.split(":")[1].split(";")[0]
                file_content = base64.b64decode(encoded)
                return upload_bytes_to_r2(file_content, content_type, folder)
            except Exception as e:
                print(f"Data URI parsing failed: {e}")
                # Fallback or re-raise? If we can't parse it, we can't upload it.
                # But maybe it's cleaner to let the exception handler catch it.
                raise e

        # 2. Download the file (Standard URL)
        response = requests.get(file_url, stream=True)
        response.raise_for_status()
        
        content_type = response.headers.get('content-type')
        extension = "png"
        if "video" in content_type:
            extension = "mp4"
        elif "image/jpeg" in content_type:
            extension = "jpg"
            
        filename = f"{uuid.uuid4()}.{extension}"
        key = f"{folder}/{filename}"

        # 2. Upload to R2
        s3 = get_s3_client()
        s3.upload_fileobj(
            response.raw,
            R2_BUCKET_NAME,
            key,
            ExtraArgs={'ContentType': content_type}
        )

        # 3. Construct Public URL
        if R2_PUBLIC_DOMAIN:
            return f"{R2_PUBLIC_DOMAIN}/{key}"
        else:
            # Fallback to R2 dev URL or similar if public domain not set
            # Ideally user sets R2_PUBLIC_DOMAIN
            return f"{R2_ENDPOINT_URL}/{R2_BUCKET_NAME}/{key}"

    except Exception as e:
        print(f"R2 Upload Error: {e}")
        print(f"Falling back to original URL: {file_url}")
        # Return the original URL (which expires) so the user still gets a result
        return file_url

def upload_bytes_to_r2(file_content: bytes, content_type: str, folder: str = "masks") -> str:
    """
    Uploads bytes directly to Cloudflare R2.
    Returns the public URL of the uploaded file.
    """
    try:
        extension = "png"
        if "jpeg" in content_type or "jpg" in content_type:
            extension = "jpg"
            
        filename = f"{uuid.uuid4()}.{extension}"
        key = f"{folder}/{filename}"

        s3 = get_s3_client()
        s3.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=key,
            Body=file_content,
            ContentType=content_type
        )

        if R2_PUBLIC_DOMAIN:
            return f"{R2_PUBLIC_DOMAIN}/{key}"
        else:
            return f"{R2_ENDPOINT_URL}/{R2_BUCKET_NAME}/{key}"

    except Exception as e:
        print(f"R2 Bytes Upload Error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
