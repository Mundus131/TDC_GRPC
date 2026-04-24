const { SerialPort } = require('serialport');
const axios = require('axios');
const fs = require('fs');

let port;
let config = require('./config.json');
let wsClients = [];

function loadConfig() {
  config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
  return config;
}

function saveConfig(newConfig) {
  fs.writeFileSync('./config.json', JSON.stringify(newConfig, null, 2));
  config = newConfig;
}

function broadcastToWebSockets(data) {
  wsClients.forEach((ws) => {
    if (ws.readyState === 1) {
      ws.send(data);
    }
  });
}

function forwardToEndpoint(data) {
  if (!config.forwarding?.enabled) return;

  axios.post(config.forwarding.endpoint, { data: data.toString() })
    .catch(err => {
      console.error('Błąd przy wysyłaniu danych do endpointu:', err.message);
    });
}

function setupSerialPort(onData) {
  if (port && port.isOpen) {
    port.close(() => {
      console.log("Zamknięto poprzednie połączenie szeregowe.");
      openPort(onData);
    });
  } else {
    openPort(onData);
  }
}

function openPort(onData) {
  port = new SerialPort({
    path: config.serial.path,
    baudRate: config.serial.baudRate,
    dataBits: config.serial.dataBits,
    stopBits: config.serial.stopBits,
    parity: config.serial.parity,
    autoOpen: true
  });

  port.on('data', (data) => {
    const strData = data.toString();
    onData(strData);
    broadcastToWebSockets(strData);
    forwardToEndpoint(strData);
  });

  port.on('error', (err) => {
    console.error('Błąd portu szeregowego:', err.message);
  });

  port.on('open', () => {
    console.log(`Otworzono port ${config.serial.path}`);
  });
}

function writeToSerial(message) {
  if (!port || !port.isOpen) return;
  port.write(message + '\n', (err) => {
    if (err) console.error('Błąd zapisu:', err.message);
  });
}

module.exports = {
  setupSerialPort,
  writeToSerial,
  loadConfig,
  saveConfig,
  wsClients
};
