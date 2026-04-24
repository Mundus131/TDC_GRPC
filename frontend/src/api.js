import axios from 'axios';

const API_BASE_URL = '/api';

export const fetchDigitalDevices = async () => {
  const response = await axios.get(`${API_BASE_URL}/devices/digital`);
  return response.data;
};

export const setGpioState = async (name, state) => {
  await axios.post(`${API_BASE_URL}/devices/digital/state`, { name, state });
};

export const setGpioDirection = async (name, direction) => {
  await axios.post(`${API_BASE_URL}/devices/digital/direction`, { name, direction });
};

export const fetchAnalogDevices = async () => {
  const res = await fetch(`${API_BASE_URL}/devices/analog`);
  if (!res.ok) throw new Error('Failed to fetch analog devices');
  return res.json();
};

export const setAnalogMode = async (name, mode) => {
  const res = await fetch(`${API_BASE_URL}/devices/analog/${name}/mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: mode.toLowerCase() }) // <-- lowercase
  });
  if (!res.ok) throw new Error('Failed to set analog mode');
  return res.json();
};

// GET /devices/serial/status
export const fetchSerialStatus = async () => {
  const res = await axios.get(`${API_BASE_URL}/devices/serial/status`);
  return res.data;
};

// GET /devices/serial/mode
export const fetchSerialMode = async () => {
  const res = await axios.get(`${API_BASE_URL}/devices/serial/mode`);
  return res.data.mode;
};

// POST /devices/serial/mode
export const setSerialMode = async (mode) => {
  if (!['RS485', 'RS422'].includes(mode)) {
    throw new Error('Invalid serial mode');
  }
  const res = await axios.post(`${API_BASE_URL}/devices/serial/mode`, { mode });
  return res.data.success;
};

// GET /devices/serial/termination
export const fetchSerialTermination = async () => {
  const res = await axios.get(`${API_BASE_URL}/devices/serial/termination`);
  return res.data.termination;
};

// POST /devices/serial/termination
export const setSerialTermination = async (enable) => {
  if (typeof enable !== 'boolean') throw new Error('Invalid parameter');
  const res = await axios.post(`${API_BASE_URL}/devices/serial/termination`, { enable });
  return res.data.success;
};

// GET /devices/serial/statistics
export const fetchSerialStatistics = async () => {
  const res = await axios.get(`${API_BASE_URL}/devices/serial/statistics`);
  return res.data;
};

// GET /devices/serial/available-modes
export const fetchSerialAvailableModes = async () => {
  const res = await axios.get(`${API_BASE_URL}/devices/serial/available-modes`);
  return res.data.modes;
};

// GET /devices/serial/baud-rate
export const fetchSerialBaudRate = async () => {
  const res = await axios.get(`${API_BASE_URL}/devices/serial/baud-rate`);
  return res.data.baudRate;
};

// GET /devices/serial/slew-rate
export const fetchSerialSlewRate = async () => {
  const res = await axios.get(`${API_BASE_URL}/devices/serial/slew-rate`);
  return res.data.slewRate;
};

// POST /devices/serial/slew-rate
export const setSerialSlewRate = async (slewRate) => {
  if (typeof slewRate !== 'number') throw new Error('Invalid slew rate');
  const res = await axios.post(`${API_BASE_URL}/devices/serial/slew-rate`, { slewRate });
  return res.data.success;
};

// GET /devices/serial/power
export const fetchSerialPowerStatus = async () => {
  const res = await axios.get(`${API_BASE_URL}/devices/serial/power`);
  return res.data.powerOn;
};

// POST /devices/serial/power
export const setSerialPower = async (powerOn) => {
  if (typeof powerOn !== 'boolean') throw new Error('Invalid power parameter');
  const res = await axios.post(`${API_BASE_URL}/devices/serial/power`, { powerOn });
  return res.data.success;
};

// GET /devices/serial/interfaces
export const fetchSerialInterfaces = async () => {
  const res = await axios.get(`${API_BASE_URL}/devices/serial/interfaces`);
  return res.data.interfaces;
};

// GET /devices/serial/last
export const fetchSerialLastData = async () => {
  const res = await axios.get(`${API_BASE_URL}/devices/serial/last`);
  return res.data.data;
};

// GET /devices/serial/config
export const fetchSerialConfig = async () => {
  const res = await axios.get(`${API_BASE_URL}/devices/serial/config`);
  return res.data;
};

// POST /devices/serial/config
export const setSerialConfig = async (config) => {
  const res = await axios.post(`${API_BASE_URL}/devices/serial/config`, config);
  return res.data.message;
};

// POST /devices/serial/send
export const sendSerialData = async (data) => {
  if (typeof data !== 'string' || data.length === 0) throw new Error('Missing data');
  const res = await axios.post(`${API_BASE_URL}/devices/serial/send`, { data });
  return res.data.message;
};

// POST /devices/serial/restart
export const restartSerial = async () => {
  const res = await axios.post(`${API_BASE_URL}/devices/serial/restart`);
  return res.data.message;
};
