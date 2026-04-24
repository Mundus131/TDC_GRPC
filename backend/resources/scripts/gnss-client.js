const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const GRPC_TARGET = '192.168.0.100:8081';  // adres serwera gRPC
const PROTO_PATH = path.join(__dirname, '../protofiles/gnss-services.proto'); // podmień na właściwą nazwę pliku

function createGrpcClient() {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
  const gnss = protoDescriptor.hal.gnss;
  return new gnss.Gnss(GRPC_TARGET, grpc.credentials.createInsecure());
}

function getDeviceStatus(metadata) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.GetDeviceStatus({}, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
}

function setDeviceStatus({ enableReciever, enableAntenna }, metadata) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.SetDeviceStatus({ enableReciever, enableAntenna }, metadata, (err, _) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function getConstellations(metadata) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.GetConstellations({}, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
}

function setConstellations(settings, metadata) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.SetConstellations(settings, metadata, (err, _) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function getNmeaOutputFrequency(metadata) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.GetNmeaOutputFrequency({}, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
}

function setNmeaOutputFrequency(frequency, metadata) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.SetNmeaOutputFrequency({ frequency }, metadata, (err, _) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function listNmeaOutputFrequencies(metadata) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.ListNmeaOutputFrequencies({}, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response.frequencies);
    });
  });
}

function listAvailableConstellations(metadata) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.ListAvailableConstellations({}, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response.constellations);
    });
  });
}

function streamDataJson(onData, onError, onEnd, metadata) {
  const client = createGrpcClient();
  const call = client.StreamDataJson({}, metadata);

  call.on('data', onData);
  call.on('error', onError);
  call.on('end', onEnd);

  return call;
}

function streamDataRaw(onData, onError, onEnd, metadata) {
  const client = createGrpcClient();
  const call = client.StreamDataRaw({}, metadata);

  call.on('data', onData);
  call.on('error', onError);
  call.on('end', onEnd);

  return call;
}

module.exports = {
  getDeviceStatus,
  setDeviceStatus,
  getConstellations,
  setConstellations,
  getNmeaOutputFrequency,
  setNmeaOutputFrequency,
  listNmeaOutputFrequencies,
  listAvailableConstellations,
  streamDataJson,
  streamDataRaw,
};
