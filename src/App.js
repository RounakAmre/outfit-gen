import React, { useState, useEffect } from "react";

function App() {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Analyzing...");
  const [isMobile, setIsMobile] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [prompt, setPrompt] = useState("Casual outfit for a hot day");
  const [gender, setGender] = useState("");

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

  useEffect(() => {
    let interval;
    if (loading) {
      const messages = [
        "Detecting image...",
        "Identifying outfit...",
        "Getting outfit suggestions..."
      ];
      let i = 0;
      setLoadingMessage(messages[i]);
      interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingMessage(messages[i]);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

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
    formData.append("gender", gender);
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

      <div
        style={{
          backgroundColor: "#fff9db",
          border: "1px solid #ffe58f",
          padding: "0.75rem",
          borderRadius: "6px",
          marginBottom: "1rem",
          fontSize: "0.9rem"
        }}
      >
        📸 <strong>Please take a <u>full picture</u></strong> of the clothing article for accurate detection.
      </div>

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
        onFocus={() => {
          if (prompt === "Casual outfit for a hot day") setPrompt("");
        }}
        rows={3}
        style={{ width: "100%", marginBottom: "1rem", padding: "0.5rem" }}
      />

      <label style={{ display: "block", marginBottom: "0.5rem" }}>Gender:</label>
      <select
        value={gender}
        onChange={(e) => setGender(e.target.value)}
        style={{ width: "100%", marginBottom: "1rem", padding: "0.5rem" }}
      >
        <option value="">Select Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
      </select>

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
          cursor: "pointer",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px"
        }}
      >
        {loading && (
          <span style={{
            width: "16px",
            height: "16px",
            border: "2px solid #fff",
            borderTop: "2px solid transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }} />
        )}
        {loading ? loadingMessage : "Analyze Outfit"}
      </button>

      <style>
        {`@keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }`}
      </style>

      {result && (
        <div style={{ marginTop: "1rem" }}>
          {result.error ? (
            <p style={{ color: "red" }}>{result.error}</p>
          ) : (
            <div>
              {result.summary && (
                <p><strong>Detected:</strong> {result.summary.replace(/^.*?\s/, '')}</p>
              )}
              {result.color && (
                <p>
                  <strong>Color:</strong>{" "}
                  <span style={{
                    display: "inline-block",
                    width: "16px",
                    height: "16px",
                    backgroundColor: result.color,
                    border: "1px solid #ccc",
                    marginRight: "8px",
                    verticalAlign: "middle"
                  }}></span>
                  {result.color}
                </p>
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
