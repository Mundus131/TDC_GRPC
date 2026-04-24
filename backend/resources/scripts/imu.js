const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const GRPC_TARGET = '192.168.0.100:8081'; // adres serwera gRPC
const PROTO_PATH = path.join(__dirname, '../protofiles/imu-services.proto'); // zmień jeśli masz inną nazwę pliku

// 1. Tworzy klienta
function createGrpcClient() {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
  const imu = protoDescriptor.hal.imu;
  return new imu.Imu(GRPC_TARGET, grpc.credentials.createInsecure());
}

// 2. Pobierz dostępne urządzenia IMU
function listDevices(metadata) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.ListDevices({}, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response.devices);
    });
  });
}

// 3. Pobierz próbkę skalowaną
function readSampleScaled(deviceName, metadata) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.ReadSampleScaled({ deviceName }, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response.channels); // tablica Channels { name, value }
    });
  });
}

// 4. Stream danych z czujnika
function readBufferedDataStream(deviceName, filterLength, metadata, onData, onError, onEnd) {
  const client = createGrpcClient();
  const call = client.ReadBufferedDataStream({ deviceName, filterLength }, metadata);

  call.on('data', onData);
  call.on('error', onError);
  call.on('end', onEnd);

  return call;
}

// 5. Pobierz dostępne częstotliwości próbkowania
function getAvailableSamplingFrequencies(deviceName, metadata) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.GetAvailableSamplingFrequency({ deviceName }, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response.frequencies);
    });
  });
}

// 6. Ustaw częstotliwość próbkowania
function setSamplingFrequency(deviceName, frequency, metadata) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.SetSamplingFrequency({ deviceName, frequency }, metadata, (err, _) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// 7. Pobierz dostępne skale
function getAvailableScales(deviceName, metadata) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.GetAvailableScales({ deviceName }, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response.scales);
    });
  });
}

// 8. Ustaw skalę
function setScale(deviceName, scale, metadata) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.SetScale({ deviceName, scale }, metadata, (err, _) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

module.exports = {
  listDevices,
  readSampleScaled,
  readBufferedDataStream,
  getAvailableSamplingFrequencies,
  setSamplingFrequency,
  getAvailableScales,
  setScale,
};
