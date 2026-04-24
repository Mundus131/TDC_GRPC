const express = require('express');
const router = express.Router();
const grpc = require('@grpc/grpc-js');


const serialClient = require('../../resources/scripts/rs');
const DigitalIO = require('../../resources/scripts/digitalio');
const AnalogIn = require('../../resources/scripts/analogin');
const TemperatureSensor = require('../../resources/scripts/Temperatura');
const IMU = require('../../resources/scripts/imu');
const GNSS = require('../../resources/scripts/gnss-client');






const handleGrpcError = (res, error) => {
  console.error('gRPC Error:', {
    code: error.code,
    message: error.message,
    details: error.details,
  });

  const statusMap = {
    [grpc.status.UNAUTHENTICATED]: 401,
    [grpc.status.INVALID_ARGUMENT]: 400,
    [grpc.status.NOT_FOUND]: 404,
  };

  const statusCode = statusMap[error.code] || 500;

  res.status(statusCode).json({
    error: {
      code: grpc.status[error.code] || 'INTERNAL_ERROR',
      message: error.message,
      details: error.details,
    },
  });
};

// Middleware: możesz tu wstawić ustawianie req.grpcMetadata jeśli potrzebujesz
router.use((req, res, next) => {
  if (!req.grpcMetadata) {
    // np. ustaw req.grpcMetadata = coś z nagłówków lub tokena
  }
  next();
});

router.get('/serial/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.flushHeaders();

  serialClient.addSseClient(res); // dodaj klienta do listy

  // opcjonalnie: od razu wyślij ostatnie dane
  const last = serialClient.getLastSerialData();
  if (last) {
    res.write(`data: ${JSON.stringify({ data: last })}\n\n`);
  }

  req.on('close', () => {
    serialClient.removeSseClient(res); // usuń klienta
    res.end();
  });
});

router.get('/serial/last', (req, res) => {
  const data = serialClient.getLastSerialData();
  res.json({ data });
});

// GET /serial/config
router.get('/serial/config', (req, res) => {
  try {
    const config = serialClient.loadConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load config', details: err.message });
  }
});

// POST /serial/config
router.post('/serial/config', (req, res) => {
  try {
    serialClient.saveConfig(req.body);
    res.json({ message: 'Config saved and serial restarted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save config', details: err.message });
  }
});

// POST /serial/send
router.post('/serial/send', (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ error: 'Missing data to send' });

  try {
    serialClient.sendData(data);
    res.json({ message: 'Data sent to serial' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send data', details: err.message });
  }
});

// POST /serial/restart
router.post('/serial/restart', (req, res) => {
  try {
    serialClient.restartSerial();
    res.json({ message: 'Serial port restarted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to restart serial', details: err.message });
  }
});
/** Serial Interface */
router.get('/serial/status', async (req, res) => {
  try {
    if (!req.grpcMetadata) throw new Error('Missing gRPC metadata');
    const status = await serialClient.checkStatus(req.grpcMetadata);
    res.json(status);
  } catch (error) {
    handleGrpcError(res, error);
  }
});



// SERIAL INTERFACE - ROZSZERZONY
router.get('/serial/status', async (req, res) => {
  try {
    if (!req.grpcMetadata) throw new Error('Missing gRPC metadata');
    const status = await serialClient.checkStatus(req.grpcMetadata);
    res.json(status);
  } catch (error) {
    handleGrpcError(res, error);
  }
});

// POST /serial/mode

router.post('/serial/mode', async (req, res) => {
  try {
    const { mode } = req.body;
    if (!['RS485', 'RS422'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode. Use RS485 or RS422.' });
    }
    if (!req.grpcMetadata) throw new Error('Missing gRPC metadata');
    await serialClient.setMode(mode, req.grpcMetadata);
    res.json({ success: true });
  } catch (error) {
    handleGrpcError(res, error);
  }
});

// GET /serial/mode
router.get('/serial/mode', async (req, res) => {
  try {
    if (!req.grpcMetadata) throw new Error('Missing gRPC metadata');
    const mode = await serialClient.getMode(req.grpcMetadata);
    res.json({ mode });
  } catch (error) {
    handleGrpcError(res, error);
  }
});

// POST /serial/termination
router.post('/serial/termination', async (req, res) => {
  try {
    const { enable } = req.body;
    if (!req.grpcMetadata) throw new Error('Missing gRPC metadata');
    if (enable) {
      await serialClient.enableTermination(req.grpcMetadata);
    } else {
      await serialClient.disableTermination(req.grpcMetadata);
    }
    res.json({ success: true });
  } catch (error) {
    handleGrpcError(res, error);
  }
});

// GET /serial/termination
router.get('/serial/termination', async (req, res) => {
  try {
    if (!req.grpcMetadata) throw new Error('Missing gRPC metadata');
    const termination = await serialClient.getTermination(req.grpcMetadata);
    res.json({ termination });
  } catch (error) {
    handleGrpcError(res, error);
  }
});

// GET /serial/statistics
router.get('/serial/statistics', async (req, res) => {
  try {
    if (!req.grpcMetadata) throw new Error('Missing gRPC metadata');
    const stats = await serialClient.getStatistics(req.grpcMetadata);
    res.json(stats);
  } catch (error) {
    handleGrpcError(res, error);
  }
});

// GET /serial/available-modes
router.get('/serial/available-modes', async (req, res) => {
  try {
    if (!req.grpcMetadata) throw new Error('Missing gRPC metadata');
    const modes = await serialClient.getAvailableModes(req.grpcMetadata);
    res.json({ modes });
  } catch (error) {
    handleGrpcError(res, error);
  }
});

// GET /serial/available-slew-rates
router.get('/serial/available-slew-rates', async (req, res) => {
  try {
    if (!req.grpcMetadata) throw new Error('Missing gRPC metadata');
    const rates = await serialClient.getAvailableSlewRates(req.grpcMetadata);
    res.json({ rates });
  } catch (error) {
    handleGrpcError(res, error);
  }
});

// GET /serial/baud-rate
router.get('/serial/baud-rate', async (req, res) => {
  try {
    if (!req.grpcMetadata) throw new Error('Missing gRPC metadata');
    const baudRate = await serialClient.getBaudRate(req.grpcMetadata);
    res.json({ baudRate });
  } catch (error) {
    handleGrpcError(res, error);
  }
});

// GET /serial/slew-rate
router.get('/serial/slew-rate', async (req, res) => {
  try {
    if (!req.grpcMetadata) throw new Error('Missing gRPC metadata');
    const slewRate = await serialClient.getSlewRate(req.grpcMetadata);
    res.json({ slewRate });
  } catch (error) {
    handleGrpcError(res, error);
  }
});

// POST /serial/slew-rate
router.post('/serial/slew-rate', async (req, res) => {
  try {
    const { slewRate } = req.body;
    if (!req.grpcMetadata) throw new Error('Missing gRPC metadata');
    await serialClient.setSlewRate(slewRate, req.grpcMetadata);
    res.json({ success: true });
  } catch (error) {
    handleGrpcError(res, error);
  }
});

// GET /serial/power
router.get('/serial/power', async (req, res) => {
  try {
    if (!req.grpcMetadata) throw new Error('Missing gRPC metadata');
    const powerOn = await serialClient.getTransceiverPower(req.grpcMetadata);
    res.json({ powerOn });
  } catch (error) {
    handleGrpcError(res, error);
  }
});

// POST /serial/power
router.post('/serial/power', async (req, res) => {
  try {
    const { powerOn } = req.body;
    if (!req.grpcMetadata) throw new Error('Missing gRPC metadata');
    await serialClient.setTransceiverPower(powerOn, req.grpcMetadata);
    res.json({ success: true });
  } catch (error) {
    handleGrpcError(res, error);
  }
});

// GET /serial/interfaces
router.get('/serial/interfaces', async (req, res) => {
  try {
    if (!req.grpcMetadata) throw new Error('Missing gRPC metadata');
    const interfaces = await serialClient.listInterfaces(false, req.grpcMetadata);
    res.json({ interfaces });
  } catch (error) {
    handleGrpcError(res, error);
  }
});


/** Digital IO */
router.get('/digital', async (req, res) => {
  try {
    const devices = await DigitalIO.listDevices(req.grpcMetadata);
    const devicesWithState = await Promise.all(
      devices.map(async (device) => {
        let state = 'ERROR';
        try {
          state = await DigitalIO.read(device.name, req.grpcMetadata);
        } catch (e) {
          console.error(`Error reading ${device.name}:`, e.message);
        }
        return { ...device, state };
      })
    );
    res.json({
      status: 'OK',
      count: devicesWithState.length,
      devices: devicesWithState,
    });
  } catch (error) {
    handleGrpcError(res, error);
  }
});

router.post('/digital/direction', async (req, res) => {
  try {
    const { name, direction } = req.body;
    if (!name || !['IN', 'OUT'].includes(direction)) {
      return res.status(400).json({ error: 'Provide valid "name" and "direction" (IN or OUT).' });
    }
    await DigitalIO.setDirection(name, direction, req.grpcMetadata);
    res.json({ success: true, message: `Direction of ${name} set to ${direction}` });
  } catch (error) {
    handleGrpcError(res, error);
  }
});

router.post('/digital/state', async (req, res) => {
  try {
    const { name, state } = req.body;
    if (!name || !['HIGH', 'LOW'].includes(state)) {
      return res.status(400).json({ error: 'Provide valid "name" and "state" (HIGH or LOW).' });
    }
    await DigitalIO.write(name, state, req.grpcMetadata);
    res.json({ success: true, message: `State of ${name} set to ${state}` });
  } catch (error) {
    handleGrpcError(res, error);
  }
});

router.get('/digital/:name', async (req, res) => {
  try {
    const pinName = req.params.name;
    const devices = await DigitalIO.listDevices(req.grpcMetadata);
    const device = devices.find((d) => d.name === pinName);
    if (!device) return res.status(404).json({ error: `Device "${pinName}" not found` });

    let state = 'ERROR';
    try {
      state = await DigitalIO.read(pinName, req.grpcMetadata);
    } catch {}

    res.json({ ...device, state });
  } catch (error) {
    handleGrpcError(res, error);
  }
});

/** Analog Input */
router.get('/analog', async (req, res) => {
  try {
    const devices = await AnalogIn.listDevices(req.grpcMetadata);
    const readings = await Promise.all(
      devices.map(async (device) => ({
        ...device,
        reading: await AnalogIn.read(device.name, req.grpcMetadata),
      }))
    );
    res.json(readings);
  } catch (error) {
    handleGrpcError(res, error);
  }
});

router.get('/analog/:name', async (req, res) => {
  try {
    const name = req.params.name;
    const devices = await AnalogIn.listDevices(req.grpcMetadata);
    const device = devices.find((d) => d.name === name);
    if (!device) return res.status(404).json({ error: `Analog input "${name}" not found` });

    let value;
    try {
      value = await AnalogIn.read(name, req.grpcMetadata);
    } catch {
      value = { error: 'Error reading value' };
    }

    res.json({ ...device, value });
  } catch (error) {
    handleGrpcError(res, error);
  }
});

router.post('/analog/:name/mode', async (req, res) => {
  try {
    const name = req.params.name;
    const { mode } = req.body;
    if (!['voltage', 'current'].includes(mode)) {
      return res.status(400).json({ error: 'Mode must be "voltage" or "current".' });
    }
    const modeEnum = mode === 'voltage' ? AnalogIn.AnalogInMode.Voltage : AnalogIn.AnalogInMode.Current;
    await AnalogIn.setMeasureMode(name, modeEnum, req.grpcMetadata);
    res.json({ message: `Mode set to ${mode} for ${name}` });
  } catch (error) {
    handleGrpcError(res, error);
  }
});

/** Temperature Sensor */
router.get('/temperature', async (req, res) => {
  try {
    const devices = await TemperatureSensor.listDevices(req.grpcMetadata);
    const readings = await Promise.all(
      devices.map(async (device) => ({
        ...device,
        reading: await TemperatureSensor.readTemperature(device.name, req.grpcMetadata),
      }))
    );
    res.json(readings);
  } catch (error) {
    handleGrpcError(res, error);
  }
});

/** IMU */
router.get('/imu', async (req, res) => {
  try {
    const devices = await IMU.listDevices(req.grpcMetadata);
    const readings = await Promise.all(
      devices.map(async (device) => ({
        ...device,
        channels: await IMU.readSampleScaled(device.name, req.grpcMetadata),
      }))
    );
    res.json(readings);
  } catch (error) {
    handleGrpcError(res, error);
  }
});

async function getImuSection(name, metadata) {
  const devices = await IMU.listDevices(metadata);
  const device = devices.find((d) => d.name === name);
  if (!device) throw new Error(`IMU section "${name}" not found`);
  const channels = await IMU.readSampleScaled(name, metadata);
  return { name: device.name, channels };
}

router.get('/imu/gyroscope', async (req, res) => {
  try {
    const result = await getImuSection('gyroscope', req.grpcMetadata);
    res.json(result);
  } catch (error) {
    handleGrpcError(res, error);
  }
});

router.get('/imu/accelerometer', async (req, res) => {
  try {
    const result = await getImuSection('accelerometer', req.grpcMetadata);
    res.json(result);
  } catch (error) {
    handleGrpcError(res, error);
  }
});

router.get('/imu/magnetometer', async (req, res) => {
  try {
    const result = await getImuSection('magnetometer', req.grpcMetadata);
    res.json(result);
  } catch (error) {
    handleGrpcError(res, error);
  }
});

/** GNSS */
router.get('/gnss', async (req, res) => {
  try {
    const [status, constellations, nmeaFrequency] = await Promise.all([
      GNSS.getDeviceStatus(req.grpcMetadata),
      GNSS.getConstellations(req.grpcMetadata),
      GNSS.getNmeaOutputFrequency(req.grpcMetadata),
    ]);
    res.json({ status, constellations, nmeaFrequency });
  } catch (error) {
    handleGrpcError(res, error);
  }
});

router.get('/gnss/status', async (req, res) => {
  try {
    const status = await GNSS.getDeviceStatus(req.grpcMetadata);
    res.json(status);
  } catch (error) {
    handleGrpcError(res, error);
  }
});

router.post('/gnss/status', async (req, res) => {
  try {
    const { enableReciever, enableAntenna } = req.body;
    await GNSS.setDeviceStatus({ enableReciever, enableAntenna }, req.grpcMetadata);
    res.status(204).send();
  } catch (error) {
    handleGrpcError(res, error);
  }
});

router.get('/gnss/constellations', async (req, res) => {
  try {
    const constellations = await GNSS.getConstellations(req.grpcMetadata);
    res.json(constellations);
  } catch (error) {
    handleGrpcError(res, error);
  }
});

router.post('/gnss/constellations', async (req, res) => {
  try {
    const settings = req.body;
    await GNSS.setConstellations(settings, req.grpcMetadata);
    res.status(204).send();
  } catch (error) {
    handleGrpcError(res, error);
  }
});

router.get('/gnss/nmea/frequency', async (req, res) => {
  try {
    const freq = await GNSS.getNmeaOutputFrequency(req.grpcMetadata);
    res.json(freq);
  } catch (error) {
    handleGrpcError(res, error);
  }
});

router.post('/gnss/nmea/frequency', async (req, res) => {
  try {
    const { frequency } = req.body;
    if (typeof frequency !== 'number' || frequency <= 0) {
      return res.status(400).json({ error: 'Invalid frequency value' });
    }
    await GNSS.setNmeaOutputFrequency(frequency, req.grpcMetadata);
    res.status(204).send();
  } catch (error) {
    handleGrpcError(res, error);
  }
});

// Streaming GNSS data in JSON format via Server-Sent Events (SSE)
router.get('/gnss/stream/json', (req, res) => {
  if (!req.grpcMetadata) {
    return res.status(401).json({ error: 'Missing authentication metadata' });
  }

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.flushHeaders();

  const stream = GNSS.streamDataJson(
    (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    },
    (error) => {
      console.error('GNSS JSON stream error:', error);
      res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
      res.end();
    },
    () => {
      res.end();
    },
    req.grpcMetadata
  );

  req.on('close', () => {
    stream.cancel();
    res.end();
  });
});

// Streaming raw GNSS data via Server-Sent Events (SSE) - alternatywna wersja do istniejącego /gnss/nmea/stream
router.get('/gnss/stream/raw', (req, res) => {
  if (!req.grpcMetadata) {
    return res.status(401).json({ error: 'Missing authentication metadata' });
  }

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.flushHeaders();

  const stream = GNSS.streamDataRaw(
    (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    },
    (error) => {
      console.error('GNSS raw stream error:', error);
      res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
      res.end();
    },
    () => {
      res.end();
    },
    req.grpcMetadata
  );

  req.on('close', () => {
    stream.cancel();
    res.end();
  });
});

// Streaming NMEA sentences via Server-Sent Events (SSE)
router.get('/gnss/nmea/stream', (req, res) => {
  if (!req.grpcMetadata) {
    return res.status(401).json({ error: 'Missing authentication metadata' });
  }

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.flushHeaders();

  const stream = GNSS.getNmeaStream(req.grpcMetadata);

  stream.on('data', (nmeaSentence) => {
    res.write(`data: ${JSON.stringify(nmeaSentence)}\n\n`);
  });

  stream.on('error', (error) => {
    console.error('NMEA stream error:', error);
    res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
    res.end();
  });

  stream.on('end', () => {
    res.end();
  });

  req.on('close', () => {
    stream.cancel();
    res.end();
  });
});

module.exports = router;