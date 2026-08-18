import React from 'react';
import { regionsData } from '../../utils/constants';

// Kebele is a fixed 01–12 range per the spec, independent of region/zone/woreda.
const KEBELE_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

const selectStyle = {
  width: '100%',
  padding: '0.6rem',
  borderRadius: '4px',
  border: '1px solid #ccc',
  boxSizing: 'border-box',
  backgroundColor: 'white',
};

const fieldWrapperStyle = { flex: '1 1 160px', minWidth: '150px' };

/**
 * Self-contained cascading location picker: Region -> Zone -> Woreda -> Kebele.
 *
 * `value`    — { region, zone, woreda, kebele } (any/all may be '')
 * `onChange` — called with the FULL updated { region, zone, woreda, kebele }
 *              object every time any field changes. The component handles
 *              the "changing a parent clears its children" rule internally,
 *              so callers just merge whatever they receive into their state:
 *
 *   <AddressDropdown
 *     value={{ region: formData.region, zone: formData.zone, woreda: formData.woreda, kebele: formData.kebele }}
 *     onChange={(loc) => setFormData((prev) => ({ ...prev, ...loc }))}
 *   />
 */
export default function AddressDropdown({ value = {}, onChange }) {
  const { region = '', zone = '', woreda = '', kebele = '' } = value;

  const zones = region ? regionsData[region]?.zones || {} : {};
  const woredas = zone ? zones[zone]?.woredas || {} : {};

  const handleRegionChange = (e) => {
    onChange({ region: e.target.value, zone: '', woreda: '', kebele: '' });
  };

  const handleZoneChange = (e) => {
    onChange({ region, zone: e.target.value, woreda: '', kebele: '' });
  };

  const handleWoredaChange = (e) => {
    onChange({ region, zone, woreda: e.target.value, kebele: '' });
  };

  const handleKebeleChange = (e) => {
    onChange({ region, zone, woreda, kebele: e.target.value });
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', width: '100%' }}>
      <div style={fieldWrapperStyle}>
        <label style={{ display: 'block', marginBottom: '0.3rem', color: '#333', fontSize: '0.9rem' }}>Region</label>
        <select name="region" value={region} onChange={handleRegionChange} required style={selectStyle}>
          <option value="">Select Region</option>
          {Object.keys(regionsData).map((regKey) => (
            <option key={regKey} value={regKey}>{regionsData[regKey].name}</option>
          ))}
        </select>
      </div>

      <div style={fieldWrapperStyle}>
        <label style={{ display: 'block', marginBottom: '0.3rem', color: '#333', fontSize: '0.9rem' }}>Zone</label>
        <select name="zone" value={zone} onChange={handleZoneChange} disabled={!region} required style={selectStyle}>
          <option value="">Select Zone</option>
          {Object.keys(zones).map((zoneKey) => (
            <option key={zoneKey} value={zoneKey}>{zones[zoneKey].name}</option>
          ))}
        </select>
      </div>

      <div style={fieldWrapperStyle}>
        <label style={{ display: 'block', marginBottom: '0.3rem', color: '#333', fontSize: '0.9rem' }}>Wereda</label>
        <select name="woreda" value={woreda} onChange={handleWoredaChange} disabled={!zone} required style={selectStyle}>
          <option value="">Select Wereda</option>
          {Object.keys(woredas).map((woredaKey) => (
            <option key={woredaKey} value={woredaKey}>{woredas[woredaKey].name}</option>
          ))}
        </select>
      </div>

      <div style={fieldWrapperStyle}>
        <label style={{ display: 'block', marginBottom: '0.3rem', color: '#333', fontSize: '0.9rem' }}>Kebele</label>
        <select name="kebele" value={kebele} onChange={handleKebeleChange} disabled={!woreda} required style={selectStyle}>
          <option value="">Select Kebele</option>
          {KEBELE_OPTIONS.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
