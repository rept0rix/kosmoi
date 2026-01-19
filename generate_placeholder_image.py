from PIL import Image, ImageDraw, ImageFont

# Image dimensions
width = 800
height = 600

# Create a new image with a white background
image = Image.new("RGB", (width, height), "white")
draw = ImageDraw.Draw(image)

# Add a blue rectangle as a placeholder for the air conditioner
air_conditioner_color = (173, 216, 230)  # Light blue
air_conditioner_x0 = width // 4
air_conditioner_y0 = height // 4
air_conditioner_x1 = width * 3 // 4
air_conditioner_y1 = height // 2
draw.rectangle([(air_conditioner_x0, air_conditioner_y0), (air_conditioner_x1, air_conditioner_y1)], fill=air_conditioner_color)

# Add some text indicating 'Technician on the way'
text = "Technician on the way"
font_size = 30
# Use a default font; specify the path if a custom font is needed
font = ImageFont.truetype(font="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", size=font_size)
text_color = (0, 0, 255)  # Blue
text_width, text_height = draw.textsize(text, font=font)
text_x = (width - text_width) // 2
text_y = height * 3 // 4
draw.text((text_x, text_y), text, fill=text_color, font=font)

# Save the image
image.save("repair_ad.png")