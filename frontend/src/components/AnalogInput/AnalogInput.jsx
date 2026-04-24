import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchAnalogDevices, setAnalogMode } from '../../api'; // trzeba dodać fetchAnalogDevices w api.js
import './AnalogInputs.css';

const AnalogIO = () => {
  const { t } = useTranslation();
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const data = await fetchAnalogDevices();
      setDevices(data || []);
    } catch (error) {
      console.error('Error fetching analog devices:', error);
    }
  };

  const handleModeChange = async (name, mode) => {
    try {
      await setAnalogMode(name, mode);
      loadDevices();
    } catch (error) {
      console.error('Error setting analog mode:', error);
    }
  };

  return (
    <div className="analog-io-container">
      <h2>{t('analog.title')}</h2>
      <div className="device-list-vertical">
        {devices.map(({ name, mode, reading }) => (
          <div key={name} className="device-card">
            <div className="device-header">
              <h4>{name}</h4>
              <p>
                {t('analog.mode')}: {t(`analog.modes.${mode.toLowerCase()}`)}
              </p>
            </div>

            <div className="device-controls">
              <label>{t('analog.mode')}:</label>
              <select
                value={mode}
                onChange={(e) => handleModeChange(name, e.target.value)}
              >
                <option value="Voltage">{t('analog.modes.voltage')}</option>
                <option value="Current">{t('analog.modes.current')}</option>
              </select>

              <label>{t('analog.reading')}:</label>
              <div className="analog-reading">
                {reading && typeof reading === 'object' ? (
                  <>
                    <span>{reading.converted.toFixed(4)}</span>{' '}
                    <span>{reading.unit}</span>
                  </>
                ) : (
                  <span>{reading}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalogIO;
