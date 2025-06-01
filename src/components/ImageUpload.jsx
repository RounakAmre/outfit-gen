import React, { useState, useEffect } from "react";

function ImageUpload({ presetData }) {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [context, setContext] = useState({
    occasion: "", weather: "", temperature: ""
  });

  useEffect(() => {
    const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    setIsMobile(mobile);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!image) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("image", image);
    formData.append("name", presetData.name);
    formData.append("gender", presetData.gender);
    formData.append("complexion", presetData.complexion);
    formData.append("heightFeet", presetData.heightFeet);
    formData.append("heightInches", presetData.heightInches);
    formData.append("buildType", presetData.buildType);
    formData.append("occasion", context.occasion);
    formData.append("weather", context.weather);
    formData.append("temperature", context.temperature);

    try {
      const res = await fetch("https://outfitter-backend-n1hd.onrender.com/api/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ error: "Failed to connect to the backend." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "auto" }}>
      <h2>👕 Outfit Analyzer</h2>

      {isMobile ? (
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
        />
      ) : (
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
      )}

      {image && (
        <div style={{ marginTop: "1rem" }}>
          <img
            src={URL.createObjectURL(image)}
            alt="preview"
            style={{ width: "100%", borderRadius: "8px" }}
          />
          <div style={{ marginTop: "1rem" }}>
            <h3>Context Info</h3>
            <select onChange={e => setContext({ ...context, occasion: e.target.value })}>
              <option value="">Occasion</option>
              <option>Casual</option>
              <option>Work</option>
              <option>Formal</option>
              <option>Party</option>
            </select>
            <select onChange={e => setContext({ ...context, weather: e.target.value })} style={{ marginLeft: "8px" }}>
              <option value="">Weather</option>
              <option>Sunny</option>
              <option>Rainy</option>
              <option>Cloudy</option>
              <option>Snowy</option>
            </select>
            <select onChange={e => setContext({ ...context, temperature: e.target.value })} style={{ marginLeft: "8px" }}>
              <option value="">Temperature (optional)</option>
              <option>Hot</option>
              <option>Warm</option>
              <option>Cool</option>
              <option>Freezing</option>
            </select>
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        style={{
          marginTop: "1rem",
          padding: "0.5rem 1rem",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        {loading ? "Analyzing..." : "Analyze Outfit"}
      </button>

      {result && (
        <div style={{ marginTop: "1rem" }}>
          {result.error ? (
            <p style={{ color: "red" }}>{result.error}</p>
          ) : (
            <div>
              <p><strong>Detected:</strong> {result.article}</p>
              <p><strong>Color:</strong> {result.color}</p>
              <p><strong>Outfit Suggestions (complementing your {result.article.toLowerCase()}):</strong></p>
              <ul>
                {result.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
