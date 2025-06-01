import React, { useState } from "react";

function ImageUpload() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [occasion, setOccasion] = useState("");
  const [weather, setWeather] = useState("");
  const [temperature, setTemperature] = useState("");

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleAnalyze = async () => {
    if (!image || !occasion || !weather || !temperature) {
      alert("Please select image and fill all fields.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("image", image);
    formData.append("occasion", occasion);
    formData.append("weather", weather);
    formData.append("temperature", temperature);

    const response = await fetch("http://localhost:8000/api/analyze", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div>
      <h2>Upload Clothing Image</h2>
      <input type="file" onChange={handleImageChange} />
      <div>
        <label>Occasion:</label>
        <select onChange={(e) => setOccasion(e.target.value)} defaultValue="">
          <option value="" disabled>Select Occasion</option>
          <option value="date">Date</option>
          <option value="workout">Workout</option>
          <option value="casual stroll">Casual Stroll</option>
          <option value="vacation">Vacation</option>
          <option value="formal">Formal</option>
        </select>
      </div>
      <div>
        <label>Weather:</label>
        <select onChange={(e) => setWeather(e.target.value)} defaultValue="">
          <option value="" disabled>Select Weather</option>
          <option value="sunny">Sunny</option>
          <option value="cloudy">Cloudy</option>
          <option value="rainy">Rainy</option>
          <option value="snowy">Snowy</option>
        </select>
      </div>
      <div>
        <label>Temperature (°F):</label>
        <input type="number" onChange={(e) => setTemperature(e.target.value)} />
      </div>
      <button onClick={handleAnalyze}>Analyze</button>

      {loading && <p>Analyzing...</p>}
      {result && (
        <div>
          <h3>Results</h3>
          <p><strong>Detected:</strong> {result.article}</p>
          <p><strong>Color:</strong> {result.color}</p>
          <ul>
            {result.suggestions && result.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
