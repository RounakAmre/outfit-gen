import React, { useState } from 'react';
import ImageUpload from './components/ImageUpload';

function App() {
  const [presetOpen, setPresetOpen] = useState(true);
  const [presetData, setPresetData] = useState({
    name: '',
    gender: '',
    complexion: '',
    heightFeet: '',
    heightInches: '',
    buildType: ''
  });

  return (
    <div className="App" style={{ fontFamily: 'Arial, sans-serif', padding: '1rem' }}>
      {presetOpen ? (
        <div
          style={{
            maxWidth: '420px',
            margin: '2rem auto',
            padding: '1.5rem',
            border: '1px solid #ccc',
            borderRadius: '10px',
            backgroundColor: '#f9f9f9',
            boxShadow: '0 2px 12px rgba(0,0,0,0.1)'
          }}
        >
          <h2 style={{ marginBottom: '1rem' }}>Your Info</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              placeholder="Name"
              onChange={e => setPresetData({ ...presetData, name: e.target.value })}
            />
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
            <input
              placeholder="Height (feet)"
              onChange={e => setPresetData({ ...presetData, heightFeet: e.target.value })}
            />
            <input
              placeholder="Height (inches)"
              onChange={e => setPresetData({ ...presetData, heightInches: e.target.value })}
            />
            <select onChange={e => setPresetData({ ...presetData, buildType: e.target.value })}>
              <option value="">Build Type</option>
              <option>Slim</option>
              <option>Athletic</option>
              <option>Average</option>
              <option>Heavyset</option>
            </select>
            <button
              style={{
                padding: '0.5rem 1rem',
                fontSize: '1rem',
                cursor: 'pointer',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px'
              }}
              onClick={() => setPresetOpen(false)}
            >
              Continue
            </button>
          </div>
        </div>
      ) : (
        <ImageUpload presetData={presetData} />
      )}
    </div>
  );
}

export default App;
