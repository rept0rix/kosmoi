
import requests
import json
import time

URL = "http://localhost:8000/chat"

def test_chat():
    payload = {"message": "Hello, are you the Video Agent?"}
    try:
        print(f"Sending request to {URL}...")
        response = requests.post(URL, json=payload, timeout=10)
        
        if response.status_code == 200:
            print("Status: 200 OK")
            print("Response:", response.json())
            
            # Check structure
            data = response.json()
            if isinstance(data, str):
                try:
                     parsed = json.loads(data)
                     print("Parsed JSON:", parsed)
                except:
                     print("Response is a raw string.")
            elif isinstance(data, dict):
                 print("Response is a dict.")
        else:
            print(f"Failed. Status: {response.status_code}")
            print("Body:", response.text)

    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_chat()
