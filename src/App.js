import React, { useState } from 'react';
import ImageUpload from './components/ImageUpload';
import UserForm from './components/UserForm';

function App() {
  const [presetOpen, setPresetOpen] = useState(true);
  const [presetData, setPresetData] = useState({
    name: '',
    preference: '',
    complexion: '',
    heightFeet: '',
    heightInches: '',
    buildType: '',
    weather: '',
    temperature: ''
  });

  return (
    <div className="App" style={{ fontFamily: 'Arial, sans-serif', padding: '1rem', background: '#f0f0f0', minHeight: '100vh' }}>
      {presetOpen ? (
        <UserForm
          onSubmit={(data) => {
            setPresetData(data);
            setPresetOpen(false);
          }}
        />
      ) : (
        <ImageUpload presetData={presetData} />
      )}
    </div>
  );
}

export default App;
