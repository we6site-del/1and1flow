from dotenv import load_dotenv
load_dotenv()

import os
import boto3
from botocore.exceptions import ClientError

def test_r2_upload():
    print("Testing R2 Upload...")
    
    # Check credentials
    access_key = os.getenv("R2_ACCESS_KEY_ID")
    secret_key = os.getenv("R2_SECRET_ACCESS_KEY")
    bucket_name = os.getenv("R2_BUCKET_NAME")
    endpoint_url = os.getenv("R2_ENDPOINT_URL")
    
    if not access_key or not secret_key:
        print("ERROR: R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY is missing.")
        return
        
    print(f"Bucket: {bucket_name}")
    print(f"Endpoint: {endpoint_url}")

    try:
        s3 = boto3.client(
            's3',
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name='auto'
        )
        
        # List buckets to verify auth
        print("\nListing buckets...")
        response = s3.list_buckets()
        print("Buckets:", [b['Name'] for b in response['Buckets']])
        
        # Test Upload
        print("\nUploading test file...")
        test_content = b"Hello R2 World! This is a test upload."
        key = "test_upload.txt"
        
        s3.put_object(
            Bucket=bucket_name,
            Key=key,
            Body=test_content,
            ContentType="text/plain"
        )
        print(f"Successfully uploaded {key}")
        
        # Verify public access (optional)
        public_domain = os.getenv("R2_PUBLIC_DOMAIN")
        if public_domain:
            print(f"Public URL: {public_domain}/{key}")
        else:
            print("Public domain not configured.")

    except ClientError as e:
        print(f"AWS ClientError: {e}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_r2_upload()
