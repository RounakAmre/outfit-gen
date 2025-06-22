from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import vision
import io
import numpy as np
import cv2
import os
import requests
from dotenv import load_dotenv

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = vision.ImageAnnotatorClient()

label_map = {
    "Top": "T-shirt",
    "Footwear": "Shoes",
    "Clothing": "Outfit",
    "Apparel": "Outfit"
}


@app.post("/api/analyze")
async def analyze_image(
    image: UploadFile = File(...),
    prompt: str = Form(""),
    gender: str = Form(""),
    heightFeet: str = Form(""),
    heightInches: str = Form(""),
    buildType: str = Form(""),
    complexion: str = Form(""),
    occasion: str = Form(""),
    weather: str = Form(""),
    temperature: str = Form("")
):
    content = await image.read()
    vision_image = vision.Image(content=content)

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

    color_resp = client.image_properties(image=cropped_vision_img)
    if not color_resp.image_properties_annotation.dominant_colors.colors:
        return {"error": "Could not extract color."}

    color = color_resp.image_properties_annotation.dominant_colors.colors[0].color
    rgb = (int(color.red), int(color.green), int(color.blue))
    rgb_str = f"rgb({rgb[0]}, {rgb[1]}, {rgb[2]})"
    color_name = get_color_name(rgb)

    suggestions = get_ai_suggestions(
        article, rgb, color_name, prompt, gender, heightFeet, heightInches, buildType,
        complexion, occasion, weather, temperature
    )

    return {
        "summary": f"{color_name.capitalize()} {article.capitalize()}",
        "article": article,
        "color": rgb_str,
        "suggestions": suggestions
    }


def get_ai_suggestions(article, rgb, color_name, prompt, gender, heightFeet, heightInches, buildType, complexion, occasion, weather, temperature):
    profile = f"Gender: {gender}. Height: {heightFeet}'{heightInches}, Build: {buildType}, Complexion: {complexion}."
    context = f"Occasion: {occasion}, Weather: {weather}, Temperature: {temperature or 'not specified'}."
    style_goal = f"User style goal: {prompt}" if prompt else ""

    final_prompt = (
        f"{style_goal}\n{profile}\n{context}\n"
        f"The user is wearing a {color_name} {article.lower()}. "
        f"Do not suggest another {article.lower()}. "
        f"Suggest 3 full outfit combinations to complement it."
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
                    "messages": [{"role": "user", "content": final_prompt}],
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
            return suggestions or suggest_outfits(article, rgb, gender)
        except Exception as e:
            print("⚠️ ChatGPT fallback triggered:", str(e))

    return suggest_outfits(article, rgb, gender)


def suggest_outfits(article, rgb, gender):
    r, g, b = rgb
    color = "red" if r > 180 else "neutral"

    style_db = {
        "T-shirt": {
            "red": [
                "Pair with light blue jeans and a denim jacket",
                "Style with black joggers and white sneakers"
            ],
            "neutral": [
                "Go with beige chinos and a casual blazer",
                "Try pairing with olive cargo pants"
            ]
        },
        "Jacket": {
            "red": [
                "Layer over a plain tee and jeans",
                "Pair with dark pants and ankle boots"
            ],
            "neutral": [
                "Try with pastel shirts underneath",
                "Wear with chinos and loafers"
            ]
        }
    }

    return style_db.get(article, {}).get(color, [
        "Explore classic outfit pairings based on gender and comfort."
    ])


def get_color_name(rgb):
    r, g, b = rgb
    if r > 200 and g > 200 and b > 200:
        return "white"
    elif r > 200 and g < 100 and b < 100:
        return "red"
    elif r < 100 and g > 200 and b < 100:
        return "green"
    elif r < 100 and g < 100 and b > 200:
        return "blue"
    elif r > 200 and g > 200 and b < 100:
        return "yellow"
    elif r > 150 and g > 100 and b < 100:
        return "orange"
    elif r > 100 and g < 100 and b > 100:
        return "purple"
    elif r < 80 and g < 80 and b < 80:
        return "black"
    else:
        return "neutral"
