import os
from PIL import Image

# Path to generated high-res logo
source_image_path = r"C:\Users\HEMANT\.gemini\antigravity-ide\brain\84fe89f5-5bed-4365-b8b5-f665deaf5c9c\farmer_app_logo_1786110785340.png"

# Target Android resource directories and their corresponding pixel sizes
icon_configs = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192
}

# Android resources base path
res_base_path = r"C:\Users\HEMANT\AgriSense AI\farmerapp\android\app\src\main\res"

def resize_and_replace():
    if not os.path.exists(source_image_path):
        print(f"Error: Source image not found at {source_image_path}")
        return

    # Load source image
    with Image.open(source_image_path) as img:
        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            img = img.convert('RGBA')

        for folder, size in icon_configs.items():
            dest_dir = os.path.join(res_base_path, folder)
            os.makedirs(dest_dir, exist_ok=True)
            dest_path = os.path.join(dest_dir, "ic_launcher.png")

            # Resize image with high-quality resampling
            resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
            resized_img.save(dest_path, "PNG")
            print(f"Successfully generated {size}x{size} icon in {folder}")

        # Also update logo-transparent.png in the project root
        root_logo_path = r"C:\Users\HEMANT\AgriSense AI\logo-transparent.png"
        img.save(root_logo_path, "PNG")
        print("Updated logo-transparent.png in the project root")

if __name__ == "__main__":
    resize_and_replace()
