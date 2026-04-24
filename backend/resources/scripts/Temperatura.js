const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '../protofiles/temperature-sensor-service.proto');
const GRPC_TARGET = '192.168.0.100:8081';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: [path.join(__dirname, 'node_modules/google-proto-files')]
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const temperatureSensor = protoDescriptor.hal.temperaturesensor;

function createGrpcClient() {
  return new temperatureSensor.TemperatureSensor(GRPC_TARGET, grpc.credentials.createInsecure());
}

/**
 * Pobiera listę urządzeń.
 * @param {grpc.Metadata} metadata 
 * @returns {Promise<Array<{name: string}>>}
 */
function listDevices(metadata) {
  const client = createGrpcClient();

  return new Promise((resolve, reject) => {
    client.ListDevices({}, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response.devices);
    });
  });
}

/**
 * Odczytuje temperaturę z urządzenia o podanej nazwie.
 * @param {string} deviceName 
 * @param {grpc.Metadata} metadata 
 * @returns {Promise<{value: number, unit: string}>}
 */
function readTemperature(deviceName, metadata) {
  const client = createGrpcClient();

  return new Promise((resolve, reject) => {
    client.Read({ name: deviceName }, metadata, (err, response) => {
      if (err) return reject(err);
      resolve({ value: response.value, unit: response.unit });
    });
  });
}

module.exports = { listDevices, readTemperature };
