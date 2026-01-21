
from PIL import Image, ImageDraw, ImageFont
import os
import random

def create_gradient(width, height, start_color, end_color):
    base = Image.new('RGB', (width, height), start_color)
    top = Image.new('RGB', (width, height), end_color)
    mask = Image.new('L', (width, height))
    mask_data = []
    for y in range(height):
        mask_data.extend([int(255 * (y / height))] * width)
    mask.putdata(mask_data)
    base.paste(top, (0, 0), mask)
    return base

def generate_mockup(filename, text, subtitle, start_color, end_color):
    width, height = 1024, 1024
    img = create_gradient(width, height, start_color, end_color)
    draw = ImageDraw.Draw(img)
    
    # Try to load a nice font, fallback to default
    try:
        font_title = ImageFont.truetype("Arial.ttf", 80)
        font_sub = ImageFont.truetype("Arial.ttf", 40)
    except:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    # Draw Text (Centered)
    # Simple clear visual for ad structure
    draw.text((width/2, height/3), text, font=font_title, fill="white", anchor="mm")
    draw.text((width/2, height/2), subtitle, font=font_sub, fill="white", anchor="mm")
    
    # Add CTA Button look
    btn_w, btn_h = 300, 80
    btn_x, btn_y = (width - btn_w) / 2, height * 0.7
    draw.rectangle([btn_x, btn_y, btn_x + btn_w, btn_y + btn_h], fill="white", outline=None)
    draw.text((width/2, btn_y + btn_h/2), "BOOK NOW", font=font_sub, fill="black", anchor="mm")

    # Save artifact path
    output_dir = "/Users/rept0rix/.gemini/antigravity/brain/2fa79087-e236-43ed-8ac1-59b44952b3a2"
    path = os.path.join(output_dir, filename)
    img.save(path)
    print(f"Generated: {path}")

# 1. Food (Orange/Red)
generate_mockup("ad_carousel_food.png", "Taste Samui", "Authentic Premium Cuisine", (255, 100, 0), (200, 50, 0))

# 2. Tours (Blue/Green)
generate_mockup("ad_carousel_tours.png", "Explore the Islands", "Boat Trips & Adventures", (0, 150, 255), (0, 100, 200))

# 3. Relax (Purple/Teal)
generate_mockup("ad_carousel_relax.png", "Pure Relaxation", "Spas & Massages", (150, 0, 255), (0, 200, 200))
