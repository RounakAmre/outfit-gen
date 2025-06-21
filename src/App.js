import React, { useState } from "react";

function App() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isMobile, setIsMobile] = useState(
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    heightFeet: "",
    heightInches: "",
    buildType: "",
    complexion: "",
    weather: "",
    occasion: "",
  });

  const handleUpload = async () => {
    if (!image) return;
    setLoading(true);
    const data = new FormData();
    data.append("image", image);
    data.append("customPrompt", customPrompt);
    Object.entries(formData).forEach(([k, v]) =>
      data.append(k, v || "")
    );

    try {
      const res = await fetch("https://outfitter-backend-n1hd.onrender.com/api/analyze", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      setResult(json);
    } catch (err) {
      setResult({ error: "Failed to connect to the backend." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "1rem", fontFamily: "sans-serif" }}>
      <h2 style={{ textAlign: "center" }}>👕 Outfit Analyzer</h2>

      <input
        type="file"
        accept="image/*"
        capture={isMobile ? "environment" : undefined}
        onChange={(e) => setImage(e.target.files[0])}
        style={{ margin: "1rem 0", width: "100%" }}
      />

      <textarea
        placeholder="Optional: Describe your style goal..."
        value={customPrompt}
        onChange={(e) => setCustomPrompt(e.target.value)}
        style={{
          width: "100%",
          minHeight: "60px",
          padding: "0.5rem",
          border: "1px solid #ccc",
          borderRadius: "6px",
        }}
      />

      <button
        onClick={() => setShowAdvanced((prev) => !prev)}
        style={{
          marginTop: "1rem",
          backgroundColor: "#eee",
          padding: "0.5rem",
          width: "100%",
          border: "1px solid #ccc",
          borderRadius: "6px",
        }}
      >
        {showAdvanced ? "Hide Optional Fields ▲" : "Add Optional Fields ▼"}
      </button>

      {showAdvanced && (
        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label><strong>Height</strong></label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="number"
              placeholder="Feet"
              value={formData.heightFeet}
              onChange={(e) => setFormData({ ...formData, heightFeet: e.target.value })}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              placeholder="Inches"
              value={formData.heightInches}
              onChange={(e) => setFormData({ ...formData, heightInches: e.target.value })}
              style={{ flex: 1 }}
            />
          </div>

          <select
            value={formData.buildType}
            onChange={(e) => setFormData({ ...formData, buildType: e.target.value })}
          >
            <option value="">Build Type</option>
            <option>Slim</option>
            <option>Athletic</option>
            <option>Average</option>
            <option>Heavyset</option>
          </select>

          <select
            value={formData.complexion}
            onChange={(e) => setFormData({ ...formData, complexion: e.target.value })}
          >
            <option value="">Complexion</option>
            <option>Fair</option>
            <option>Medium</option>
            <option>Olive</option>
            <option>Dark</option>
          </select>

          <label><strong>Context</strong></label>
          <select
            value={formData.occasion}
            onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
          >
            <option value="">Occasion</option>
            <option>Work</option>
            <option>Casual</option>
            <option>Date</option>
            <option>Party</option>
          </select>

          <select
            value={formData.weather}
            onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
          >
            <option value="">Weather</option>
            <option>Sunny</option>
            <option>Rainy</option>
            <option>Cloudy</option>
            <option>Snowy</option>
          </select>
        </div>
      )}

      <button
        onClick={handleUpload}
        style={{
          marginTop: "1.5rem",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          padding: "0.75rem",
          width: "100%",
          borderRadius: "6px",
          fontWeight: "bold",
          cursor: "pointer"
        }}
      >
        {loading ? "Analyzing..." : "Analyze Outfit"}
      </button>

      {result && (
        <div style={{ marginTop: "1.5rem" }}>
          {result.error ? (
            <p style={{ color: "red" }}>{result.error}</p>
          ) : (
            <>
              <p><strong>Detected:</strong> {result.article}</p>
              <p><strong>Color:</strong> {result.color}</p>
              <p><strong>Suggestions:</strong></p>
              <ul>
                {result.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
