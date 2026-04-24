const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const GRPC_TARGET = '192.168.0.100:8081';  // dopasuj adres serwera gRPC
const PROTO_PATH = path.join(__dirname, '../protofiles/can_services.proto'); // dopasuj nazwę pliku .proto

// Tworzymy klienta gRPC dla serwisu Can
function createGrpcClient() {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
  const can = protoDescriptor.hal.can;
  return new can.Can(GRPC_TARGET, grpc.credentials.createInsecure());
}

// Każda funkcja wywołuje odpowiednią metodę na kliencie
function getBitrate(interfaceName, metadata = new grpc.Metadata()) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.GetBitrate({ interfaceName }, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response.bitrate);
    });
  });
}

function getBusState(interfaceName, metadata = new grpc.Metadata()) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.GetBusState({ interfaceName }, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response.state);
    });
  });
}

function getInterfaceToContainerMapping(metadata = new grpc.Metadata()) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.GetInterfaceToContainerMapping({}, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response.items);
    });
  });
}

function getStatistics(interfaceName, metadata = new grpc.Metadata()) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.GetStatistics({ interfaceName }, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
}

function getTermination(interfaceName, metadata = new grpc.Metadata()) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.GetTermination({ interfaceName }, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response.terminationEnabled);
    });
  });
}

function getTransceiverPower(interfaceName, metadata = new grpc.Metadata()) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.GetTransceiverPower({ interfaceName }, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response.powerOn);
    });
  });
}

function listInterfaces(metadata = new grpc.Metadata()) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.ListInterfaces({}, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response.interfaceNames);
    });
  });
}

function setInterfaceToContainer(interfaceName, containerName, metadata = new grpc.Metadata()) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.SetInterfaceToContainer({ interfaceName, containerName }, metadata, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function setTermination(interfaceName, enableTermination, metadata = new grpc.Metadata()) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.SetTermination({ interfaceName, enableTermination }, metadata, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function setTransceiverPower(interfaceName, powerOn, metadata = new grpc.Metadata()) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.SetTransceiverPower({ interfaceName, powerOn }, metadata, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

module.exports = {
  getBitrate,
  getBusState,
  getInterfaceToContainerMapping,
  getStatistics,
  getTermination,
  getTransceiverPower,
  listInterfaces,
  setInterfaceToContainer,
  setTermination,
  setTransceiverPower,
};
