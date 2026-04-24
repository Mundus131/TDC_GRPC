const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const GRPC_TARGET = '192.168.0.100:8081';  // adres serwera gRPC
const PROTO_PATH = path.join(__dirname, '../protofiles/digitalio-service.proto'); // dopasuj nazwę pliku .proto

// Ładowanie protokołu i tworzenie klienta
function createGrpcClient() {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
    // includeDirs: [path.join(__dirname, 'node_modules/google-proto-files')] // jeśli potrzebne
  });
  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
  const digitalio = protoDescriptor.hal.digitalio;
  return new digitalio.DigitalIO(GRPC_TARGET, grpc.credentials.createInsecure());
}

// Pobierz listę urządzeń digital IO
function listDevices(metadata) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.ListDevices({}, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response.devices);
    });
  });
}

// Ustaw kierunek pinu (IN / OUT)
function setDirection(name, direction, metadata) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.SetDirection({ name, direction }, metadata, (err, _) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// Odczytaj stan pinu (LOW / HIGH / ERROR)
function read(name, metadata) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.Read({ name }, metadata, (err, response) => {
      if (err) return reject(err);
      resolve(response.state);
    });
  });
}

// Zapisz stan pinu (LOW / HIGH)
function write(name, state, metadata) {
  const client = createGrpcClient();
  return new Promise((resolve, reject) => {
    client.Write({ name, state }, metadata, (err, _) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// Podpięcie (stream) do zdarzeń pinu
function attach(metadata, onData, onError, onEnd) {
  const client = createGrpcClient();
  const call = client.Attach({}, metadata);

  call.on('data', onData);
  call.on('error', onError);
  call.on('end', onEnd);

  return call;
}

module.exports = {
  listDevices,
  setDirection,
  read,
  write,
  attach,
};
