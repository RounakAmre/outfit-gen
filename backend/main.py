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

label_map = {
    "Top": "T-shirt",
    "Footwear": "Shoes",
    "Clothing": "Outfit",
    "Apparel": "Outfit"
}

clothing_labels = [
    'jacket', 'shirt', 't-shirt', 'pants', 'jeans', 'dress',
    'clothing', 'coat', 'hoodie', 'sweater', 'shorts', 'skirt',
    'shoe', 'shoes', 'footwear', 'blazer', 'apparel', 'top'
]

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

    # Preprocess image with OpenCV
    npimg = np.frombuffer(content, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    if img is None:
        return {"error": "Could not decode image."}

    img = cv2.convertScaleAbs(img, alpha=1.2, beta=20)
    h, w = img.shape[:2]

    _, buffer = cv2.imencode('.jpg', img)
    enhanced_bytes = buffer.tobytes()
    vision_image = vision.Image(content=enhanced_bytes)

    # Try object localization
    objects = client.object_localization(image=vision_image).localized_object_annotations
    clothing_obj = next((obj for obj in objects if obj.name.lower() in clothing_labels), None)

    if clothing_obj:
        article_raw = clothing_obj.name
        article = label_map.get(article_raw, article_raw)

        box = clothing_obj.bounding_poly.normalized_vertices
        x1, y1 = int(box[0].x * w), int(box[0].y * h)
        x2, y2 = int(box[2].x * w), int(box[2].y * h)
        cropped = img[y1:y2, x1:x2]

    else:
        # Improved fallback using label detection with score filtering
        label_response = client.label_detection(image=vision_image)
        labels = label_response.label_annotations

        detected_labels = [
            label.description for label in labels
            if any(cloth in label.description.lower() for cloth in clothing_labels)
            and label.score > 0.6
        ]

        if not detected_labels:
            return {"error": "No recognizable clothing item found."}

        article_raw = detected_labels[0]
        article = label_map.get(article_raw, article_raw)
        cropped = img  # fallback uses full image

    # Extract color
    _, cropped_buf = cv2.imencode('.jpg', cropped)
    cropped_bytes = cropped_buf.tobytes()
    color_resp = client.image_properties(image=vision.Image(content=cropped_bytes))

    if not color_resp.image_properties_annotation.dominant_colors.colors:
        return {"error": "Could not extract color."}

    color = color_resp.image_properties_annotation.dominant_colors.colors[0].color
    rgb = (int(color.red), int(color.green), int(color.blue))
    rgb_str = f"rgb({rgb[0]}, {rgb[1]}, {rgb[2]})"

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
