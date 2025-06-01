from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import vision
import io
import numpy as np
import cv2
import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Google Vision client
client = vision.ImageAnnotatorClient()

# Normalize vague labels to standard terms
label_map = {
    "Top": "T-shirt",
    "Footwear": "Shoes",
    "Clothing": "Outfit",
    "Apparel": "Outfit"
}

@app.post("/api/analyze")
async def analyze_image(
    image: UploadFile = File(...),
    occasion: str = Form(...),
    weather: str = Form(...),
    temperature: str = Form(...)
):
    content = await image.read()
    vision_image = vision.Image(content=content)

    # Step 1: Detect clothing objects
    objects = client.object_localization(image=vision_image).localized_object_annotations
    clothing_labels = [
        'Jacket', 'Shirt', 'T-shirt', 'Pants', 'Jeans', 'Dress',
        'Clothing', 'Coat', 'Hoodie', 'Sweater', 'Shorts', 'Skirt',
        'Shoe', 'Shoes', 'Footwear', 'Blazer', 'Apparel', 'Top'
    ]

    print("Detected objects:")
    for obj in objects:
        print(f"- {obj.name} ({obj.score:.2f})")

    clothing_obj = next((obj for obj in objects if obj.name in clothing_labels), None)
    if not clothing_obj:
        return {"error": "No recognizable clothing item found."}

    article_raw = clothing_obj.name
    article = label_map.get(article_raw, article_raw)

    # Step 2: Crop bounding box
    box = clothing_obj.bounding_poly.normalized_vertices
    npimg = np.frombuffer(content, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    h, w = img.shape[:2]

    x1, y1 = int(box[0].x * w), int(box[0].y * h)
    x2, y2 = int(box[2].x * w), int(box[2].y * h)
    cropped = img[y1:y2, x1:x2]

    _, buffer = cv2.imencode('.jpg', cropped)
    cropped_bytes = buffer.tobytes()
    cropped_vision_img = vision.Image(content=cropped_bytes)

    # Step 3: Extract color
    color_resp = client.image_properties(image=cropped_vision_img)
    if not color_resp.image_properties_annotation.dominant_colors.colors:
        return {"error": "Could not extract color."}

    color = color_resp.image_properties_annotation.dominant_colors.colors[0].color
    rgb = (int(color.red), int(color.green), int(color.blue))
    rgb_str = f"rgb({rgb[0]}, {rgb[1]}, {rgb[2]})"

    # Step 4: AI outfit suggestions
    suggestions = get_ai_suggestions(article, rgb, occasion, weather, temperature)

    return {
        "article": article,
        "color": rgb_str,
        "suggestions": suggestions
    }

def get_ai_suggestions(article, rgb, occasion, weather, temperature):
    prompt = (
        f"Suggest 3 stylish and practical outfits featuring a {article.lower()} of color rgb{rgb}. "
        f"The user will wear it for a '{occasion}' in '{weather}' weather around {temperature}°F. "
        f"Give complete outfits that match the scenario, and ensure the styles are wearable and trendy."
    )

    if OPENAI_API_KEY:
        try:
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                },
                timeout=30,
            )
            data = response.json()
            text = data["choices"][0]["message"]["content"]
            suggestions = [
                line.strip("-• ").strip()
                for line in text.strip().split("\n")
                if line.strip()
            ]
            return suggestions or suggest_outfits(article, rgb, occasion, weather, temperature)
        except Exception as e:
            print("⚠️ ChatGPT fallback triggered:", str(e))

    return suggest_outfits(article, rgb, occasion, weather, temperature)

# Rule-based fallback suggestions
def suggest_outfits(article, rgb, occasion, weather, temperature):
    r, g, b = rgb
    color_category = "red" if r > 180 else "neutral"

    # Example rules (expand as needed)
    style_db = {
        "T-shirt": {
            "casual stroll": ["Pair with joggers and slip-ons", "Add a flannel shirt for layering"],
            "workout": ["Match with breathable shorts and trainers", "Use moisture-wicking materials"],
            "vacation": ["Combine with cargo shorts and sunglasses", "Top off with a straw hat"],
            "date": ["Pair with chinos and loafers", "Add a casual blazer over the tee"],
        },
        "Jacket": {
            "formal": ["Wear over a dress shirt and wool trousers", "Add a tie and leather shoes"],
            "vacation": ["Layer over a hoodie with ripped jeans", "Use with canvas sneakers"],
        },
        "Shoes": {
            "date": ["Pair with a sharp shirt and jeans", "Use with a leather belt to match"],
            "workout": ["Match with gym wear", "Ensure comfort and breathability"],
        }
    }

    article_suggestions = style_db.get(article, {})
    return article_suggestions.get(occasion, [
        "Explore classic outfit pairings for this piece.",
        "Try layering and balancing colors for versatility."
    ])
