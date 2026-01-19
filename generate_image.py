import os
import requests

# Replace with your actual API key and endpoint for DALL-E or a similar service
API_KEY = os.environ.get("DALLE_API_KEY", "YOUR_API_KEY")
API_ENDPOINT = os.environ.get("DALLE_API_ENDPOINT", "https://api.example.com/dalle")

image_description = "modern tropical villa living room image, air conditioner leaking water, digital hologram overlay showing 'Technician on the way', blue and white color scheme. Style: ui-design"

def generate_image(description):
    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }
    data = {
        "prompt": description,
        "n": 1,
        "size": "512x512"
    }
    try:
        response = requests.post(API_ENDPOINT, headers=headers, json=data)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
        image_url = response.json().get("data")[0].get("url")
        print(f"Image URL: {image_url}")
        return image_url
    except requests.exceptions.RequestException as e:
        print(f"Error generating image: {e}")
        return None

# Placeholder function - replace with actual image saving/handling logic
def save_image(image_url):
    print(f"Saving image from {image_url}")
    # In a real implementation, you would download the image and save it to a file
    return "placeholder_image.png" # Return a placeholder filename

if __name__ == "__main__":
    print("Generating image...")
    image_url = generate_image(image_description)
    if image_url:
        image_filename = save_image(image_url)
        print(f"Image saved as {image_filename}")
    else:
        print("Image generation failed.")