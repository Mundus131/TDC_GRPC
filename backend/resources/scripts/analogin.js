const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '../protofiles/analogin-service.proto'); // podmień na faktyczną ścieżkę do analogin proto
const GRPC_TARGET = '192.168.0.100:8081';  // adres Twojego serwera gRPC

// Załaduj proto
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: [path.join(__dirname, 'node_modules/google-proto-files')],
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const analoginProto = protoDescriptor.hal.analogin;

// Stwórz klienta
const client = new analoginProto.AnalogIN(GRPC_TARGET, grpc.credentials.createInsecure());

// Enumy do ułatwienia
const AnalogInMode = {
  Voltage: 0,
  Current: 1,
};

const AnalogInUnits = {
  V: 0,
  mA: 1,
};

// Lista urządzeń
function listDevices(metadata) {
  return new Promise((resolve, reject) => {
    client.ListDevices({}, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response.devices);
    });
  });
}

// Odczyt analogowego wejścia
function read(name, metadata) {
  return new Promise((resolve, reject) => {
    client.Read({ name }, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
}

// Ustaw tryb pomiaru (Voltage/Current)
function setMeasureMode(name, mode, metadata) {
  return new Promise((resolve, reject) => {
    client.SetMeasureMode({ name, mode }, metadata, (err, _) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// Stream zdarzeń Attach (opcjonalne)
function attach(metadata) {
  const call = client.Attach({}, metadata);
  return call; // call jest streamem, możesz nasłuchiwać eventów 'data', 'error', 'end'
}

module.exports = {
  listDevices,
  read,
  setMeasureMode,
  attach,
  AnalogInMode,
  AnalogInUnits,
};
