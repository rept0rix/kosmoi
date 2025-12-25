
import os
from dotenv import load_dotenv

# Try loading from local .env
load_dotenv(".env") 

# Check keys
ragie = os.getenv("RAGIE_API_KEY")
google = os.getenv("GOOGLE_API_KEY")

print(f"RAGIE_API_KEY Set: {bool(ragie)}")
print(f"GOOGLE_API_KEY Set: {bool(google)}")

if ragie:
    print(f"RAGIE_API_KEY Length: {len(ragie)}")
    print(f"RAGIE_API_KEY First 4: {ragie[:4]}...")

if google:
    print(f"GOOGLE_API_KEY Length: {len(google)}")
