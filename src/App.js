import React, { useState } from 'react';
import ImageUpload from './components/ImageUpload';

function App() {
  const [presetOpen, setPresetOpen] = useState(true);
  const [presetData, setPresetData] = useState({
    name: '', gender: '', complexion: '', heightFeet: '', heightInches: '', buildType: ''
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

      {!presetOpen && <ImageUpload presetData={presetData} />}
    </div>
  );
}

export default App;
