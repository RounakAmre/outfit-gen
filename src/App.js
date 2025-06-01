import React, { useState } from 'react';
import ImageUpload from './components/ImageUpload';

function App() {
  const [presetOpen, setPresetOpen] = useState(true);
  const [preAnalyzeOpen, setPreAnalyzeOpen] = useState(false);

  const [presetData, setPresetData] = useState({
    name: '', gender: '', complexion: '', heightFeet: '', heightInches: '', buildType: ''
  });

  const [analyzeContext, setAnalyzeContext] = useState({
    occasion: '', weather: '', temperature: ''
  });

  return (
    <div className="App">
      {presetOpen && (
        <div className="popup">
          <div className="popup-content">
            <h2>Your Info</h2>
            <input placeholder="Name" onChange={e => setPresetData({ ...presetData, name: e.target.value })} />
            <select onChange={e => setPresetData({ ...presetData, gender: e.target.value })}>
              <option value="">Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
            <select onChange={e => setPresetData({ ...presetData, complexion: e.target.value })}>
              <option value="">Complexion</option>
              <option>Fair</option>
              <option>Medium</option>
              <option>Olive</option>
              <option>Dark</option>
            </select>
            <input placeholder="Height (feet)" onChange={e => setPresetData({ ...presetData, heightFeet: e.target.value })} />
            <input placeholder="Height (inches)" onChange={e => setPresetData({ ...presetData, heightInches: e.target.value })} />
            <select onChange={e => setPresetData({ ...presetData, buildType: e.target.value })}>
              <option value="">Build Type</option>
              <option>Slim</option>
              <option>Athletic</option>
              <option>Average</option>
              <option>Heavyset</option>
            </select>
            <button onClick={() => setPresetOpen(false)}>Continue</button>
          </div>
        </div>
      )}

      {preAnalyzeOpen && (
        <div className="popup">
          <div className="popup-content">
            <h2>Context Info</h2>
            <select onChange={e => setAnalyzeContext({ ...analyzeContext, occasion: e.target.value })}>
              <option value="">Occasion</option>
              <option>Casual</option>
              <option>Work</option>
              <option>Formal</option>
              <option>Party</option>
            </select>
            <select onChange={e => setAnalyzeContext({ ...analyzeContext, weather: e.target.value })}>
              <option value="">Weather</option>
              <option>Sunny</option>
              <option>Rainy</option>
              <option>Cloudy</option>
              <option>Snowy</option>
            </select>
            <select onChange={e => setAnalyzeContext({ ...analyzeContext, temperature: e.target.value })}>
              <option value="">Temperature (optional)</option>
              <option>Hot</option>
              <option>Warm</option>
              <option>Cool</option>
              <option>Freezing</option>
            </select>
            <button onClick={() => setPreAnalyzeOpen(false)}>Analyze</button>
          </div>
        </div>
      )}

      <ImageUpload
        presetData={presetData}
        analyzeContext={analyzeContext}
        openPreAnalyzePopup={() => setPreAnalyzeOpen(true)}
      />
    </div>
  );
}

export default App;
