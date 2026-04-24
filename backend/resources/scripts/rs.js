const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const fs = require('fs');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const GRPC_TARGET = '192.168.0.100:8081';
const PROTO_PATH = path.join(__dirname, '../protofiles/serial-service.proto');
const CONFIG_PATH = path.join(__dirname, 'serialConfig.json');
const INTERFACE_NAME = 'SERIAL';

let serialPort = null;
let lastSerialData = ''; // przechowuje ostatni odebrany ciąg znaków
let parser;

const sseClients = [];

function addSseClient(res) {
  sseClients.push(res);
}

function removeSseClient(res) {
  const index = sseClients.indexOf(res);
  if (index !== -1) sseClients.splice(index, 1);
}

function notifySseClients(data) {
  sseClients.forEach(res => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}


function createGrpcClient() {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });

  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
  return new protoDescriptor.hal.serial.Serial(GRPC_TARGET, grpc.credentials.createInsecure());
}

// === SERIAL CONFIG FUNCTIONS ===
function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

function saveConfig(newConfig) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
  restartSerial(); // apply config immediately
}

// === SERIAL PORT FUNCTIONS ===
function startSerial() {
  const config = loadConfig().serial;

  if (serialPort && serialPort.isOpen) {
    console.log('🔁 Serial już otwarty');
    return;
  }

  serialPort = new SerialPort({
    path: config.path,
    baudRate: config.baudRate,
    dataBits: config.dataBits,
    stopBits: config.stopBits,
    parity: config.parity,
    autoOpen: false
  });

  parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

  parser.on('data', data => {
  lastSerialData = data;
  console.log('📥 Odebrano z seriala:', data);

  // powiadom wszystkich klientów SSE
  notifySseClients({ data, timestamp: new Date().toISOString() });

  // opcjonalne logowanie
  fs.appendFile('serial.log', `${new Date().toISOString()} - ${data}\n`, err => {
    if (err) console.error('Błąd zapisu logu:', err);
  });
});

  serialPort.open((err) => {
    if (err) {
      return console.error('❌ Błąd otwierania seriala:', err.message);
    }
    console.log('✅ Serial port otwarty:', config.path);
  });

  serialPort.on('error', err => {
    console.error('❗ Błąd seriala:', err);
  });
}

function getLastSerialData() {
  return lastSerialData;
}

function stopSerial() {
  if (serialPort && serialPort.isOpen) {
    serialPort.close(err => {
      if (err) {
        console.error('Error closing serial:', err.message);
      } else {
        console.log('Serial port closed');
      }
    });
  }
}

function restartSerial() {
  stopSerial();
  setTimeout(startSerial, 500); // slight delay to ensure port is released
}

function sendData(data) {
  if (serialPort && serialPort.isOpen) {
    serialPort.write(data, (err) => {
      if (err) return console.error('Write failed:', err.message);
      console.log('Data sent to serial:', data);
    });
  } else {
    console.error('Serial port not open');
  }
}

function readData() {
  // Passive read via on('data'), could extend with buffer/queue if needed
  return 'Reading from serial is event-based. Use listener.';
}

// Start serial automatically on app init
startSerial();

function setMode(mode, metadata = new grpc.Metadata()) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.SetMode({ interfaceName: INTERFACE_NAME, mode }, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
}

function getMode(metadata = new grpc.Metadata()) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.GetMode({ interfaceName: INTERFACE_NAME }, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response.mode);
    });
  });
}

function enableTermination(metadata = new grpc.Metadata()) {
  return setTermination(true, metadata);
}

function disableTermination(metadata = new grpc.Metadata()) {
  return setTermination(false, metadata);
}

function setTermination(enable, metadata = new grpc.Metadata()) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.SetTermination({ interfaceName: INTERFACE_NAME, enableTermination: enable }, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
}

function getTermination(metadata = new grpc.Metadata()) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.GetTermination({ interfaceName: INTERFACE_NAME }, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response.terminationEnabled);
    });
  });
}

function getStatistics(metadata = new grpc.Metadata()) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.GetStatistics({ interfaceName: INTERFACE_NAME }, metadata, (err, response) => {
      if (err) return reject(err);
      resolve({
        txCount: parseInt(response.txCount) || 0,
        rxCount: parseInt(response.rxCount) || 0
      });
    });
  });
}

function getAvailableModes(metadata = new grpc.Metadata()) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.GetAvailableModes({}, metadata, (err, response) => {
      if (err) return reject(err);
      if (Array.isArray(response.modes) && response.modes.some(m => m > 127)) {
        const modesStr = Buffer.from(response.modes).toString();
        resolve(modesStr.split(',').filter(Boolean));
      } else {
        resolve(response.modes || []);
      }
    });
  });
}

function getAvailableSlewRates(metadata = new grpc.Metadata()) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.GetAvailableSlewRates({}, metadata, (err, response) => {
      if (err) return reject(err);
      if (Array.isArray(response.slewRates) && response.slewRates.some(s => s > 127)) {
        const ratesStr = Buffer.from(response.slewRates).toString();
        resolve(ratesStr.split(',').filter(Boolean));
      } else {
        resolve(response.slewRates || []);
      }
    });
  });
}

function getBaudRate(metadata = new grpc.Metadata()) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.GetBaudRate({ interfaceName: INTERFACE_NAME }, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response.baudRate);
    });
  });
}

function getSlewRate(metadata = new grpc.Metadata()) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.GetSlewRate({ interfaceName: INTERFACE_NAME }, metadata, (err, response) => {
      if (err) {
        if (err.code === grpc.status.UNIMPLEMENTED) {
          console.warn('GetSlewRate not implemented on server, returning default value');
          return resolve(0);
        }
        return reject(err);
      }
      resolve(response.slewRate);
    });
  });
}

function setSlewRate(rate, metadata = new grpc.Metadata()) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.SetSlewRate({ interfaceName: INTERFACE_NAME, slewRate: rate }, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
}

function getTransceiverPower(metadata = new grpc.Metadata()) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.GetTransceiverPower({ interfaceName: INTERFACE_NAME }, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response.powerOn);
    });
  });
}

function setTransceiverPower(powerOn, metadata = new grpc.Metadata()) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.SetTransceiverPower({ interfaceName: INTERFACE_NAME, powerOn }, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
}

function listInterfaces(includeDetails = false, metadata = new grpc.Metadata()) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.ListInterfaces({ includeDetails }, metadata, (err, response) => {
      if (err) {
        console.error('ListInterfaces error:', err);
        return resolve([{
          name: INTERFACE_NAME,
          currentMode: 1,
          terminationEnabled: true,
          baudRate: 9600,
          slewRate: 0,
          transceiverPower: true
        }]);
      }
      resolve(response.interfaces || []);
    });
  });
}

async function checkStatus(metadata = new grpc.Metadata()) {
  try {
    const results = await Promise.allSettled([
      getMode(metadata),
      getTermination(metadata),
      getStatistics(metadata),
      getBaudRate(metadata).catch(() => null),
      getSlewRate(metadata).catch(() => null),
      getTransceiverPower(metadata).catch(() => null)
    ]);

    return {
      mode: results[0].value,
      termination: results[1].value,
      stats: results[2].value,
      baudRate: results[3].value || 'N/A',
      slewRate: results[4].value || 'N/A',
      transceiverPower: results[5].value !== null ? results[5].value : 'N/A'
    };
  } catch (err) {
    console.error('Error checking status:', err);
    throw err;
  }
}

module.exports = {
  loadConfig,
  saveConfig,
  sendData,
  readData,
  startSerial,
  stopSerial,
  restartSerial,
  setMode,
  getMode,
  enableTermination,
  disableTermination,
  setTermination,
  getTermination,
  getStatistics,
  getAvailableModes,
  getAvailableSlewRates,
  getBaudRate,
  getSlewRate,
  setSlewRate,
  getTransceiverPower,
  setTransceiverPower,
  listInterfaces,
  checkStatus,
  getLastSerialData
};