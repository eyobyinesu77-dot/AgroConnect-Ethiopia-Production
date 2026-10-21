import React from 'react';
import { regionsData, logisticsRegions } from '../../utils/constants';

const fieldStyle = {
  width: '100%',
  padding: '0.7rem',
  borderRadius: '4px',
  border: '1px solid #ccc',
  boxSizing: 'border-box',
  backgroundColor: 'white',
};

const wrapperStyle = { minWidth: 0 };

const labelStyle = {
  display: 'block',
  marginBottom: '0.3rem',
  color: '#333',
  fontSize: '0.9rem',
};

const kebeleOptions = Array.from(
  { length: 12 },
  (_, index) => String(index + 1).padStart(2, '0')
);

export default function LogisticsPickupDropdown({ value, onChange }) {
  const regionEntry = Object.entries(regionsData).find(
    ([key, data]) =>
      key === value.pickupRegion || data.name === value.pickupRegion
  );

  const regionKey = regionEntry?.[0] || '';
  const regionData = regionEntry?.[1];
  const zones = regionData?.zones || {};

  const zoneEntry = Object.entries(zones).find(
    ([key, data]) =>
      key === value.pickupZone || data.name === value.pickupZone
  );

  const zoneKey = zoneEntry?.[0] || '';
  const zoneData = zoneEntry?.[1];
  const woredas = zoneData?.woredas || {};

  const update = (changes) => onChange(changes);

  return (
    <>
      <div style={wrapperStyle}>
        <label style={labelStyle} htmlFor="pickupRegion">
          Pickup Region
        </label>
        <select
          id="pickupRegion"
          name="pickupRegion"
          value={regionData?.name || value.pickupRegion || ''}
          onChange={(event) => {
            const selectedName = event.target.value;
            update({
              pickupRegion: selectedName,
              pickupZone: '',
              pickupWoreda: '',
              pickupKebele: '',
            });
          }}
          required
          style={fieldStyle}
        >
          <option value="">Select pickup region</option>
          {logisticsRegions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      <div style={wrapperStyle}>
        <label style={labelStyle} htmlFor="pickupZone">
          Pickup Zone
        </label>
        {regionData ? (
          <select
            id="pickupZone"
            name="pickupZone"
            value={zoneData?.name || ''}
            onChange={(event) =>
              update({
                pickupZone: event.target.value,
                pickupWoreda: '',
                pickupKebele: '',
              })
            }
            disabled={!regionKey}
            style={fieldStyle}
          >
            <option value="">Select pickup zone</option>
            {Object.entries(zones)
              .sort((a, b) => a[1].name.localeCompare(b[1].name))
              .map(([key, zone]) => (
                <option key={key} value={zone.name}>
                  {zone.name}
                </option>
              ))}
          </select>
        ) : (
          <input
            id="pickupZone"
            name="pickupZone"
            value={value.pickupZone || ''}
            onChange={(event) =>
              update({
                pickupZone: event.target.value,
                pickupWoreda: '',
                pickupKebele: '',
              })
            }
            placeholder="Enter pickup zone"
            style={fieldStyle}
          />
        )}
      </div>

      <div style={wrapperStyle}>
        <label style={labelStyle} htmlFor="pickupWoreda">
          Pickup Woreda
        </label>
        {zoneData ? (
          <select
            id="pickupWoreda"
            name="pickupWoreda"
            value={value.pickupWoreda || ''}
            onChange={(event) =>
              update({
                pickupWoreda: event.target.value,
                pickupKebele: '',
              })
            }
            style={fieldStyle}
          >
            <option value="">Select pickup woreda</option>
            {Object.entries(woredas)
              .sort((a, b) => a[1].name.localeCompare(b[1].name))
              .map(([key, woreda]) => (
                <option key={key} value={woreda.name}>
                  {woreda.name}
                </option>
              ))}
          </select>
        ) : (
          <input
            id="pickupWoreda"
            name="pickupWoreda"
            value={value.pickupWoreda || ''}
            onChange={(event) =>
              update({
                pickupWoreda: event.target.value,
                pickupKebele: '',
              })
            }
            placeholder="Enter pickup woreda"
            style={fieldStyle}
          />
        )}
      </div>


    </>
  );
}
