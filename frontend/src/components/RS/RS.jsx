import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  fetchSerialStatus,
  fetchSerialMode,
  setSerialMode,
  fetchSerialTermination,
  setSerialTermination,
  fetchSerialPowerStatus,
  setSerialPower,
  fetchSerialConfig,
  setSerialConfig,
  sendSerialData,
  fetchSerialLastData
} from '../../api';
import SwitchToggle from './SwitchToggle';
import './RS.css';

const RS = () => {
  const { t } = useTranslation();

  const [status, setStatus] = useState(null);
  const [mode, setMode] = useState('');
  const [termination, setTermination] = useState(false);
  const [powerOn, setPowerOn] = useState(false);
  const [config, setConfig] = useState({
    baudRate: '',
    dataBits: '',
    stopBits: '',
    parity: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendData, setSendData] = useState('');
  const [sendStatus, setSendStatus] = useState(null);
  const [lastReceived, setLastReceived] = useState('');




  const availableModes = ['RS485', 'RS422'];

  const baudRates = [
    110, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 28800,
    38400, 57600, 115200, 230400, 460800, 921600, 12600, 56000, 128000, 256000,
  ];

  const dataBitsOptions = [5, 6, 7, 8];
  const stopBitsOptions = [1, 1.5, 2];
  const parityOptions = ['none', 'even', 'odd', 'mark', 'space'];

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const stat = await fetchSerialStatus();
        const m = await fetchSerialMode();
        const term = await fetchSerialTermination();
        const power = await fetchSerialPowerStatus();
        const conf = await fetchSerialConfig();

        setStatus(stat);
        setMode(m.mode || '');
        setTermination(Boolean(term.termination ?? term));
        setPowerOn(Boolean(power.powerOn ?? power));

        if (conf && conf.serial) {
          setConfig({
            baudRate: parseInt(conf.serial.baudRate) || '',
            dataBits: parseInt(conf.serial.dataBits) || '',
            stopBits: parseFloat(conf.serial.stopBits) || '',
            parity: conf.serial.parity || '',
          });
        }
      } catch (e) {
        setError(t('serial.errorLoading'));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [t]);

  useEffect(() => {
  const interval = setInterval(async () => {
    try {
      const data = await fetchSerialLastData();
      setLastReceived(data);
    } catch (e) {
      console.error('Error fetching last serial data:', e);
    }
  }, 2000); // co 2 sekundy

  return () => clearInterval(interval); // czyszczenie po unmount
}, []);

  const onChangeMode = async (e) => {
    const newMode = e.target.value;
    try {
      await setSerialMode(newMode);
      setMode(newMode);
    } catch {
      alert(t('serial.errorSetMode'));
    }
  };

  const toggleTermination = async () => {
    try {
      await setSerialTermination(!termination);
      setTermination(!termination);
    } catch {
      alert(t('serial.errorSetTermination'));
    }
  };

  const togglePower = async () => {
    try {
      await setSerialPower(!powerOn);
      setPowerOn(!powerOn);
    } catch {
      alert(t('serial.errorSetPower'));
    }
  };

  const onConfigChange = (field) => async (e) => {
  let value = e.target.value;

  if (field === 'baudRate' || field === 'dataBits') {
    value = parseInt(value, 10);
  } else if (field === 'stopBits') {
    value = parseFloat(value);
  }

  const newConfig = { ...config, [field]: value };
  setConfig(newConfig);

  const payload = {
    serial: {
      ...newConfig,
      path: '/dev/ttyUSB0',
    },
  };

  try {
    console.log('[SET SERIAL CONFIG] Payload:', payload);
    await setSerialConfig(payload);

    // odśwież dane po zapisie configa
    setLoading(true);
    setError(null);

    const stat = await fetchSerialStatus();
    const m = await fetchSerialMode();
    const term = await fetchSerialTermination();
    const power = await fetchSerialPowerStatus();
    const conf = await fetchSerialConfig();

    setStatus(stat);
    setMode(m.mode || '');
    setTermination(Boolean(term.termination ?? term));
    setPowerOn(Boolean(power.powerOn ?? power));

    if (conf && conf.serial) {
      setConfig({
        baudRate: parseInt(conf.serial.baudRate) || '',
        dataBits: parseInt(conf.serial.dataBits) || '',
        stopBits: parseFloat(conf.serial.stopBits) || '',
        parity: conf.serial.parity || '',
      });
    }
  } catch (e) {
    console.error('[SET SERIAL CONFIG] Error:', e);
    alert(t('serial.errorSetConfig'));
  } finally {
    setLoading(false);
  }
};


  const handleSendData = async () => {
  try {
    setSendStatus(null);
    const msg = await sendSerialData(sendData);
    setSendStatus({ type: 'success', message: msg });
    setSendData('');
  } catch (e) {
    setSendStatus({ type: 'error', message: e.message || t('serial.errorSending') });
  }
  };


  if (loading) return <div>{t('serial.loading')}</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!status) return null;

  return (
  <div className="rs-container">
    <h2 className="rs-group-title">{t('serial.title')}</h2>

    <div className="rs-device-card">
      <div className="rs-device-header">
        <h4>{t('serial.settings')}</h4>
      </div>

      <div className="rs-device-controls">
        <label htmlFor="mode-select">{t('serial.mode')}:</label>
        <select id="mode-select" value={mode} onChange={onChangeMode}>
          {availableModes.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <div className="rs-state-controls" style={{ marginTop: 12 }}>
          <div>
            <label>{t('serial.termination')}:</label>
            <SwitchToggle
              id="termination-toggle"
              checked={termination}
              onChange={toggleTermination}
              label={termination ? t('serial.enabled') : t('serial.disabled')}
            />
          </div>

          <div>
            <label>{t('serial.power')}:</label>
            <SwitchToggle
              id="power-toggle"
              checked={powerOn}
              onChange={togglePower}
              label={powerOn ? t('serial.enabled') : t('serial.disabled')}
            />
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <label htmlFor="baudRate-select">{t('serial.baudRate')}:</label>
          <select id="baudRate-select" value={config.baudRate} onChange={onConfigChange('baudRate')}>
            {baudRates.map((rate) => (
              <option key={rate} value={rate}>{rate}</option>
            ))}
          </select>

          <label htmlFor="dataBits-select" style={{ marginLeft: 15 }}>{t('serial.dataBits')}:</label>
          <select id="dataBits-select" value={config.dataBits} onChange={onConfigChange('dataBits')}>
            {dataBitsOptions.map((bits) => (
              <option key={bits} value={bits}>{bits}</option>
            ))}
          </select>

          <label htmlFor="stopBits-select" style={{ marginLeft: 15 }}>{t('serial.stopBits')}:</label>
          <select id="stopBits-select" value={config.stopBits} onChange={onConfigChange('stopBits')}>
            {stopBitsOptions.map((stop) => (
              <option key={stop} value={stop}>{stop}</option>
            ))}
          </select>

          <label htmlFor="parity-select" style={{ marginLeft: 15 }}>{t('serial.parity')}:</label>
          <select id="parity-select" value={config.parity} onChange={onConfigChange('parity')}>
            {parityOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <h4>{t('serial.status')}</h4>
        <div><strong>{t('serial.baudRate')}:</strong> {status.baudRate}</div>
        <div><strong>{t('serial.slewRate')}:</strong> {status.slewRate}</div>
        <div><strong>{t('serial.txCount')}:</strong> {status.stats?.txCount ?? '-'} B</div>
        <div><strong>{t('serial.rxCount')}:</strong> {status.stats?.rxCount ?? '-'} B</div>
      </div>
      <div style={{ marginTop: 30 }}>
        <h4>{t('serial.sendData')}</h4>
        <input
          type="text"
          value={sendData}
          onChange={(e) => setSendData(e.target.value)}
          placeholder={t('serial.enterData')}
          style={{ width: '60%', marginRight: 10 }}
        />
        <button onClick={handleSendData}>{t('serial.send')}</button>
        {sendStatus && (
          <div style={{ color: sendStatus.type === 'success' ? 'green' : 'red', marginTop: 8 }}>
            {sendStatus.message}
          </div>
        )}
      </div>
      <div style={{ marginTop: 30 }}>
        <h4>{t('serial.lastReceived')}</h4>
        <div
          style={{
            border: '1px solid #ccc',
            borderRadius: 6,
            padding: 10,
            backgroundColor: '#f7f7f7',
            minHeight: 40,
            whiteSpace: 'pre-wrap',
          }}
        >
          {lastReceived || t('serial.noData')}
        </div>
      </div>
    </div>
  </div>
);

};

export default RS;
