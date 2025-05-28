import React, { useState, useEffect } from "react";

function ImageUpload() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    setIsMobile(mobile);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setResult(null); // Clear previous result
    }
  };

  const handleUpload = async () => {
    if (!image) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("image", image);

    try {
      const res = await fetch("http://localhost:8000/api/analyze", {
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

export default ImageUpload;
