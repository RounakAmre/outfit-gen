import React, { useState, useEffect } from "react";

function App() {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [prompt, setPrompt] = useState("");

  const [optionalFields, setOptionalFields] = useState({
    heightFeet: "",
    heightInches: "",
    buildType: "",
    complexion: "",
    occasion: "",
    weather: "",
    temperature: ""
  });

  useEffect(() => {
    const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    setIsMobile(mobile);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!image) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("image", image);
    formData.append("prompt", prompt);
    Object.entries(optionalFields).forEach(([key, value]) =>
      formData.append(key, value)
    );

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
    <div style={{ fontFamily: "Arial", maxWidth: "420px", margin: "2rem auto", padding: "1rem" }}>
      <h2 style={{ textAlign: "center" }}>🧥 Outfit Analyzer</h2>

      <input
        type="file"
        accept="image/*"
        capture={isMobile ? "environment" : undefined}
        onChange={handleFileChange}
        style={{ marginBottom: "1rem", width: "100%" }}
      />

      {previewUrl && (
        <img
          src={previewUrl}
          alt="Uploaded preview"
          style={{
            width: "100%",
            borderRadius: "8px",
            marginBottom: "1rem",
            boxShadow: "0 0 6px rgba(0,0,0,0.1)"
          }}
        />
      )}

      <textarea
        placeholder="Optional: Describe your style goal..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        style={{ width: "100%", marginBottom: "1rem", padding: "0.5rem" }}
      />

      <button
        onClick={() => setShowOptional(!showOptional)}
        style={{
          width: "100%",
          padding: "0.6rem",
          backgroundColor: "#eee",
          border: "1px solid #ccc",
          borderRadius: "5px",
          marginBottom: "1rem",
          cursor: "pointer"
        }}
      >
        {showOptional ? "Hide Optional Fields ▲" : "Add Optional Fields ▼"}
      </button>

      {showOptional && (
        <div style={{ marginBottom: "1rem" }}>
          <label>Height:</label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "0.5rem" }}>
            <select onChange={e => setOptionalFields({ ...optionalFields, heightFeet: e.target.value })}>
              <option value="">Feet</option>
              {[...Array(8)].map((_, i) => (
                <option key={i}>{i + 4}</option>
              ))}
            </select>
            <select onChange={e => setOptionalFields({ ...optionalFields, heightInches: e.target.value })}>
              <option value="">Inches</option>
              {[...Array(12)].map((_, i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </div>

          <label>Build Type:</label>
          <select onChange={e => setOptionalFields({ ...optionalFields, buildType: e.target.value })}>
            <option value="">Select</option>
            <option>Slim</option>
            <option>Athletic</option>
            <option>Average</option>
            <option>Heavyset</option>
          </select>

          <label style={{ marginTop: "0.5rem", display: "block" }}>Complexion:</label>
          <select onChange={e => setOptionalFields({ ...optionalFields, complexion: e.target.value })}>
            <option value="">Select</option>
            <option>Fair</option>
            <option>Medium</option>
            <option>Olive</option>
            <option>Dark</option>
          </select>

          <label style={{ marginTop: "0.5rem", display: "block" }}>Occasion:</label>
          <select onChange={e => setOptionalFields({ ...optionalFields, occasion: e.target.value })}>
            <option value="">Select</option>
            <option>Casual</option>
            <option>Work</option>
            <option>Date</option>
            <option>Party</option>
          </select>

          <label style={{ marginTop: "0.5rem", display: "block" }}>Weather:</label>
          <select onChange={e => setOptionalFields({ ...optionalFields, weather: e.target.value })}>
            <option value="">Select</option>
            <option>Sunny</option>
            <option>Rainy</option>
            <option>Cloudy</option>
            <option>Snowy</option>
          </select>

          <label style={{ marginTop: "0.5rem", display: "block" }}>Temperature:</label>
          <select onChange={e => setOptionalFields({ ...optionalFields, temperature: e.target.value })}>
            <option value="">Select</option>
            <option>Hot</option>
            <option>Warm</option>
            <option>Cool</option>
            <option>Freezing</option>
          </select>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={loading}
        style={{
          width: "100%",
          padding: "0.75rem",
          fontSize: "1rem",
          backgroundColor: "#4CAF50",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
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
              {result.summary && (
                <p><strong>Detected:</strong> {result.summary}</p>
              )}
              {result.color && (
                <p><strong>Color (RGB):</strong> {result.color}</p>
              )}
              <p><strong>Suggestions:</strong></p>
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

export default App;
