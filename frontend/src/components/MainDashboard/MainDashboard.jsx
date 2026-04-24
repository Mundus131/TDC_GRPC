import React, { useEffect, useState } from 'react';
import './MainDashboard.css';
import { useTranslation } from 'react-i18next';

const WEBSOCKET_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;

const MainDashboard = () => {
  const [data, setData] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const ws = new WebSocket(WEBSOCKET_URL);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'DEVICE_UPDATE') {
        setData(msg.data);
      }
    };
    return () => ws.close();
  }, []);

  if (!data) return <div className="loading">Loading...</div>;

  const renderSection = (title, icon, content) => (
    <div className="dashboard-section chessboard-section">
      <h3>{icon} {title}</h3>
      <div className="chessboard-grid">
        {content}
      </div>
    </div>
  );

  const renderSerialCard = () => {
    const s = data.serial;
    return (
      <div className="card chessboard-card serial-card">
        <h4>{t('dashboard.serial.title')}</h4>
        <div className="serial-content">
          <div className="serial-row">
            <span className="label">{t('dashboard.serial.mode')}:</span>
            <span className="value">{s.mode}</span>
          </div>
          <div className="serial-row">
            <span className="label">{t('dashboard.serial.baudRate')}:</span>
            <span className="value">{s.baudRate}</span>
          </div>
          <div className="serial-row">
            <span className="label">{t('dashboard.serial.slewRate')}:</span>
            <span className="value">{s.slewRate}</span>
          </div>
          <div className="serial-row">
            <span className="label">{t('dashboard.serial.termination')}:</span>
            <span className="value">{s.termination ? '✅' : '❌'}</span>
          </div>
          <div className="serial-row">
            <span className="label">{t('dashboard.serial.transceiverPower')}:</span>
            <span className="value">{s.transceiverPower ? '✅' : '❌'}</span>
          </div>
          <div className="serial-row">
            <span className="label">{t('dashboard.serial.status')}:</span>
            <span className="value">{s.status}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderGNSSCard = () => {
    const g = data.gnss;
    return (
      <div className="card chessboard-card gnss-card">
        <h4>{t('dashboard.gnss.title')}</h4>
        <div className="gnss-content">
          <div className="gnss-row">
            <span className="label">{t('dashboard.gnss.overallStatus')}:</span>
            <span className="value">{g.overallStatus}</span>
          </div>
          <div className="gnss-row">
            <span className="label">{t('dashboard.gnss.nmeaFrequency')}:</span>
            <span className="value">{g.nmeaFrequency.frequency}</span>
          </div>
          <div className="gnss-status">
            <h5>{t('dashboard.gnss.status')}</h5>
            <div className="status-grid">
              <div className="status-item">
                <span className="label">{t('dashboard.gnss.receiver')}:</span>
                <span className="value">{g.status.enableReciever ? '✅' : '❌'}</span>
              </div>
              <div className="status-item">
                <span className="label">{t('dashboard.gnss.antenna')}:</span>
                <span className="value">{g.status.enableAntenna ? '✅' : '❌'}</span>
              </div>
              <div className="status-item">
                <span className="label">{t('dashboard.gnss.session')}:</span>
                <span className="value">{g.status.sessionActive ? '✅' : '❌'}</span>
              </div>
              <div className="status-item">
                <span className="label">{t('dashboard.gnss.reboot')}:</span>
                <span className="value">{g.status.rebootRequired ? '✅' : '❌'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="main-dashboard-container">
      <div className="dashboard-header">
        <h2 className="main-title">📡 {t('dashboard.mainTitle')}</h2>
      </div>

      {renderSection('', '', [
        renderSerialCard(),
        renderGNSSCard()
      ])}

      {renderSection(t('dashboard.analogInputs'), '🔋',
        data.analog.map(a => (
          <div key={a.name} className="card chessboard-card analog-card">
            <div className="analog-name">{a.name}</div>
            <div className="analog-value">
              {a.converted.toFixed(3)} <span className="unit">{a.unit}</span>
            </div>
          </div>
        ))
      )}

      {renderSection(t('dashboard.digitalIO'), '⚙️',
        ['DI_A', 'DI_B', 'DI_C', 'DIO_A', 'DIO_B', 'DIO_C', 'DIO_D']
          .map(name => data.digital.find(d => d.name === name))
          .filter(Boolean)
          .map(d => (
            <div key={d.name} className="card chessboard-card digital-card">
              <div className="digital-name">{d.name}</div>
              <div className={`digital-status ${d.state.toLowerCase()}`}>
                {d.state === 'HIGH' ? (
                  <>
                    <span className="indicator green"></span>
                    <span>ON</span>
                  </>
                ) : (
                  <>
                    <span className="indicator red"></span>
                    <span>OFF</span>
                  </>
                )}
              </div>
            </div>
          ))
      )}

      {renderSection(t('dashboard.temperature'), '🌡️',
        data.temperature.map(t => (
          <div key={t.name} className="card chessboard-card temp-card">
            <div className="temp-name">{t.name}</div>
            <div className="temp-value">
              {t.value.toFixed(1)} <span className="unit">{t.unit}</span>
            </div>
          </div>
        ))
      )}

      {renderSection(t('dashboard.imu'), '🧭',
        data.imu.map(sensor => (
          <div key={sensor.name} className="card chessboard-card imu-card">
            <div className="imu-name">{t(`dashboard.${sensor.name}`)}</div>
            <div className="imu-channels">
              {sensor.channels.map(ch => (
                <div key={ch.name} className="channel">
                  <span className="channel-name">{t(`dashboard.channel.${ch.name}`)}:</span>
                  <span className="channel-value">{ch.value.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MainDashboard;
