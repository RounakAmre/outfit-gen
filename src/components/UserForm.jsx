import React, { useState } from 'react';

const UserForm = ({ onSubmit }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', preference: '', complexion: '', heightFeet: '', heightInches: '', buildType: '', weather: '', temperature: ''
  });

  const next = () => setStep(step + 1);
  const back = () => setStep(step - 1);
  const handleChange = (field, value) => setFormData({ ...formData, [field]: value });
  const handleSubmit = () => onSubmit(formData);

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', background: 'white', padding: '1.5rem', borderRadius: '10px' }}>
      <div style={{ borderBottom: '1px solid #ddd', marginBottom: '1rem', fontWeight: 'bold' }}>
        {step === 1 ? 'Basic Info' : 'Confirm Season'}
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <input placeholder="Name" className="input" value={formData.name} onChange={e => handleChange('name', e.target.value)} />
          <select className="input" value={formData.preference} onChange={e => handleChange('preference', e.target.value)}>
            <option value="">Dressing Preference</option>
            <option>Trendy</option><option>Traditional</option><option>Minimal</option><option>Sporty</option>
          </select>
          <select className="input" value={formData.complexion} onChange={e => handleChange('complexion', e.target.value)}>
            <option value="">Complexion</option>
            <option>Fair</option><option>Medium</option><option>Olive</option><option>Dark</option>
          </select>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select className="input" value={formData.heightFeet} onChange={e => handleChange('heightFeet', e.target.value)}>
              <option value="">Feet</option>{[...Array(8)].map((_, i) => <option key={i}>{i + 1}</option>)}
            </select>
            <select className="input" value={formData.heightInches} onChange={e => handleChange('heightInches', e.target.value)}>
              <option value="">Inches</option>{[...Array(12)].map((_, i) => <option key={i}>{i}</option>)}
            </select>
          </div>
          <select className="input" value={formData.buildType} onChange={e => handleChange('buildType', e.target.value)}>
            <option value="">Build Type</option>
            <option>Slim</option><option>Athletic</option><option>Average</option><option>Heavyset</option>
          </select>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <select className="input" value={formData.weather} onChange={e => handleChange('weather', e.target.value)}>
            <option value="">Weather</option><option>Sunny</option><option>Rainy</option><option>Cloudy</option><option>Snowy</option>
          </select>
          <select className="input" value={formData.temperature} onChange={e => handleChange('temperature', e.target.value)}>
            <option value="">Temperature</option><option>Hot</option><option>Warm</option><option>Cool</option><option>Freezing</option>
          </select>
        </div>
      )}

      <div className="flex justify-between mt-6">
        {step > 1 && <button onClick={back} className="text-gray-600">← Back</button>}
        <button
          onClick={step === 2 ? handleSubmit : next}
          style={{ marginLeft: 'auto', backgroundColor: 'black', color: 'white', padding: '0.5rem 1rem', borderRadius: '999px' }}>
          →
        </button>
      </div>
    </div>
  );
};

export default UserForm;
