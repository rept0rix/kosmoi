import sys
from PIL import Image, ImageDraw, ImageFont
import os

def create_placeholder(text="Placeholder", filename="placeholder.png", width=800, height=600):
    image = Image.new("RGB", (width, height), (240, 240, 240))
    draw = ImageDraw.Draw(image)
    
    # Border
    draw.rectangle([(0,0), (width-1, height-1)], outline=(200,200,200), width=10)
    
    # Cross
    draw.line([(0,0), (width, height)], fill=(220,220,220), width=5)
    draw.line([(0,height), (width, 0)], fill=(220,220,220), width=5)

    try:
        # Try Mac font
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 40)
    except:
        try:
            # Try default
            font = ImageFont.load_default()
        except:
            print("Could not load fonts")
            return

    # Text wrapping (simple)
    text_color = (50, 50, 50)
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    
    x = (width - text_w) // 2
    y = (height - text_h) // 2
    
    draw.text((x, y), text, fill=text_color, font=font)
    
    image.save(filename)
    print(f"Generated {filename}")

if __name__ == "__main__":
    txt = sys.argv[1] if len(sys.argv) > 1 else "Placeholder"
    fname = sys.argv[2] if len(sys.argv) > 2 else "generated_placeholder.png"
    create_placeholder(txt, fname)