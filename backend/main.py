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
    allow_origins=["*"],
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
    name: str = Form(...),
    gender: str = Form(...),
    complexion: str = Form(...),
    heightFeet: str = Form(...),
    heightInches: str = Form(...),
    buildType: str = Form(...),
    occasion: str = Form(...),
    weather: str = Form(...),
    temperature: str = Form(None)
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
    suggestions = get_ai_suggestions(article, rgb, name, gender, complexion, heightFeet, heightInches, buildType, occasion, weather, temperature)

    return {
        "article": article,
        "color": rgb_str,
        "suggestions": suggestions
    }

def get_ai_suggestions(article, rgb, name, gender, complexion, heightFeet, heightInches, buildType, occasion, weather, temperature):
    prompt = (
    f"User: {name}, {gender}, complexion: {complexion}, "
    f"Height: {heightFeet} feet {heightInches} inches, Build: {buildType}.\n"
    f"Context: Occasion: {occasion}, Weather: {weather}, Temperature: {temperature or 'not specified'}.\n"
    f"The user is wearing a {article.lower()} in color rgb{rgb}. "
    f"Do not suggest another {article.lower()}. "
    f"Instead, suggest 3 stylish full outfit combinations that complement this item based on the user's profile and context."
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
            return suggestions or suggest_outfits(article, rgb)
        except Exception as e:
            print("⚠️ ChatGPT fallback triggered:", str(e))

    return suggest_outfits(article, rgb)

# Rule-based fallback suggestions
def suggest_outfits(article, rgb):
    r, g, b = rgb
    color = "red" if r > 180 else "neutral"

    style_db = {
        "Jacket": {
            "red": ["Pair with black jeans and white sneakers", "Layer over a white tee"],
            "neutral": ["Try navy chinos", "Go with a pastel shirt underneath"]
        },
        "T-shirt": {
            "red": ["Match with denim shorts", "Add black joggers and sneakers"],
            "neutral": ["Go with beige pants", "Throw on a denim jacket"]
        },
        "Shoes": {
            "red": ["Use with neutral pants and white shirt", "Add ankle socks and dark jeans"],
            "neutral": ["Pair with slim trousers", "Balance with a bold top"]
        }
    }

    return style_db.get(article, {}).get(color, ["Explore classic outfit pairings for this piece."])
