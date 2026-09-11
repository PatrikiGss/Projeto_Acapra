from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

BASE = Path(r"c:/Users/Kaue Kluska/Documents/Chatito/projeto/Projeto_Acapra")
SOURCE = BASE / "backend/media/fotos/2026/06/03/alma.jpeg"
LOGO_CANDIDATES = [
    BASE / "frontend/public/Acapra_logo - Sfundo.png",
    BASE / "frontend/public/logo.png",
    BASE / "frontend/public/logo-acapra.jpeg",
]
OUTPUT_DIR = BASE / "backend/media/social_frames"
OUTPUT_PATH = OUTPUT_DIR / "preview_acapra_social_3.jpg"


def main() -> None:
    logo_path = next((path for path in LOGO_CANDIDATES if path.exists()), None)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with Image.open(SOURCE) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")

        canvas_size = (1080, 1080)
        frame_color = (252, 249, 244)
        accent_color = (243, 132, 30)
        border_color = (234, 221, 204)
        text_color = (174, 97, 21)

        canvas = Image.new("RGB", canvas_size, frame_color)
        draw = ImageDraw.Draw(canvas)

        draw.rounded_rectangle(
            [24, 24, canvas_size[0] - 24, canvas_size[1] - 24],
            radius=42,
            fill=(255, 255, 255),
            outline=border_color,
            width=4,
        )
        draw.rounded_rectangle(
            [48, 48, canvas_size[0] - 48, canvas_size[1] - 48],
            radius=30,
            outline=accent_color,
            width=8,
        )

        max_image_width = canvas_size[0] - 144
        footer_height = 160
        max_image_height = canvas_size[1] - 144 - footer_height
        fitted = ImageOps.contain(image, (max_image_width, max_image_height))
        paste_x = (canvas_size[0] - fitted.width) // 2
        paste_y = 72 + ((max_image_height - fitted.height) // 2)
        canvas.paste(fitted, (paste_x, paste_y))

        footer_left = 72
        footer_top = canvas_size[1] - 72 - footer_height
        footer_right = canvas_size[0] - 72
        footer_bottom = canvas_size[1] - 72

        draw.rounded_rectangle(
            [footer_left, footer_top, footer_right, footer_bottom],
            radius=24,
            fill=(255, 255, 255),
            outline=accent_color,
            width=5,
        )

        text = "Disponível para adoção!"
        font = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 56)
        bbox = draw.textbbox((0, 0), text, font=font)
        text_height = bbox[3] - bbox[1]
        text_x = footer_left + 28
        text_y = footer_top + ((footer_height - text_height) // 2)
        draw.text((text_x, text_y), text, fill=text_color, font=font)

        if logo_path:
            with Image.open(logo_path) as logo:
                logo = ImageOps.exif_transpose(logo)
                if logo.mode != "RGBA":
                    logo = logo.convert("RGBA")

                logo.thumbnail((300, footer_height - 18), Image.Resampling.LANCZOS)
                logo_x = footer_right - logo.width - 20
                logo_y = footer_top + ((footer_height - logo.height) // 2)
                canvas.paste(logo, (logo_x, logo_y), logo)

        canvas.save(OUTPUT_PATH, format="JPEG", quality=92, optimize=True)

    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
