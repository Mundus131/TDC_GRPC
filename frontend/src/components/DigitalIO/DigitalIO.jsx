import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchDigitalDevices, setGpioState, setGpioDirection } from '../../api';
import './DigitalIO.css';

const groupByPrefix = (devices) => {
  const groups = {};
  devices.forEach(device => {
    const prefixMatch = device.name.match(/^[A-Z]+_/);
    const prefix = prefixMatch ? prefixMatch[0] : 'OTHER';
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(device);
  });

  Object.keys(groups).forEach(prefix => {
    groups[prefix].sort((a, b) => a.name.localeCompare(b.name));
  });

  return groups;
};

const DigitalIO = () => {
  const { t } = useTranslation();
  const [devices, setDevices] = useState({});

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const data = await fetchDigitalDevices();
      const grouped = groupByPrefix(data.devices || []);
      setDevices(grouped);
    } catch (error) {
      console.error('Error fetching digital devices:', error);
    }
  };

  const handleDirectionChange = async (name, direction) => {
    try {
      await setGpioDirection(name, direction);
      loadDevices();
    } catch (e) {
      alert(t('digital.errors.setDirection'));
    }
  };

  const handleStateChange = async (name, newState) => {
    try {
      await setGpioState(name, newState);
      loadDevices();
    } catch (e) {
      alert(t('digital.errors.setState'));
    }
  };

  return (
    <div className="digital-io-container">
      <h2>{t('digital.title')}</h2>

      {Object.entries(devices).map(([prefix, group]) => (
        <div key={prefix} className="device-group">
          <h3 className="group-title">{prefix}</h3>
          <div className="device-list-vertical">
            {group.map(({ name, type, direction, state }) => (
              <div key={name} className="device-card">
                <div className="device-header">
                  <h4>{name}</h4>
                  <p>
                    {t('digital.type')}: {t(`digital.types.${type.toLowerCase()}`)}
                  </p>
                </div>

                <div className="device-controls">
                  <label>{t('digital.direction')}:</label>
                  <select
                    value={direction}
                    onChange={(e) => handleDirectionChange(name, e.target.value)}
                    disabled={type !== 'BIDIRECTIONAL'}
                  >
                    <option value="IN">{t('digital.directions.in')}</option>
                    <option value="OUT">{t('digital.directions.out')}</option>
                  </select>

                  <label>{t('digital.state')}:</label>
                  {direction === 'IN' ? (
                    <button
                      className={`state-button ${
                        state === 'HIGH' ? 'high-active' : 'low-active'
                      } no-dim`}
                      disabled
                    >
                      {t(`digital.stateValues.${state.toLowerCase()}`)}
                    </button>
                  ) : (
                    <div className="state-controls">
                      <button
                        className={`state-button low-active ${
                          state === 'LOW' ? 'active' : 'inactive'
                        }`}
                        onClick={() => handleStateChange(name, 'LOW')}
                      >
                        {t('digital.stateValues.LOW')}
                      </button>
                      <button
                        className={`state-button high-active ${
                          state === 'HIGH' ? 'active' : 'inactive'
                        }`}
                        onClick={() => handleStateChange(name, 'HIGH')}
                      >
                        {t('digital.stateValues.HIGH')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DigitalIO;
