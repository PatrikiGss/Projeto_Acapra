from pathlib import Path

from PIL import Image, ImageOps

BASE_DIR = Path(__file__).resolve().parents[2]
SOURCE = BASE_DIR / "backend" / "media" / "fotos" / "2026" / "06" / "03" / "alma.jpeg"
LOGO_CANDIDATES = [
    BASE_DIR / "backend" / "media" / "social_assets" / "acapra-logo-com-texto.png",
    BASE_DIR / "backend" / "media" / "social_assets" / "Acapra_logo - Sfundo.png",
]
OUTPUT_DIR = BASE_DIR / "backend" / "media" / "social_frames"
OUTPUT_PATH = OUTPUT_DIR / "preview_acapra_social.jpg"


def main() -> None:
    logo_path = next((path for path in LOGO_CANDIDATES if path.exists()), None)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with Image.open(SOURCE) as image:
        image = ImageOps.exif_transpose(image).convert("RGB")
        canvas = image.copy()

        if logo_path:
            with Image.open(logo_path) as logo:
                logo = ImageOps.exif_transpose(logo)
                if logo.mode != "RGBA":
                    logo = logo.convert("RGBA")

                logo.thumbnail((max(220, canvas.width // 3), max(120, canvas.height // 5)), Image.Resampling.LANCZOS)
                logo_x = canvas.width - logo.width - 32
                logo_y = canvas.height - logo.height - 32
                canvas.paste(logo, (logo_x, logo_y), logo)

        canvas.save(OUTPUT_PATH, format="JPEG", quality=92, optimize=True)

    print(str(OUTPUT_PATH))


if __name__ == "__main__":
    main()
