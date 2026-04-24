const EventEmitter = require('events');
const grpc = require('@grpc/grpc-js');
const SerialClient = require('../../resources/scripts/rs');
const DigitalIO = require('../../resources/scripts/digitalio');
const AnalogIn = require('../../resources/scripts/analogin');
const TemperatureSensor = require('../../resources/scripts/Temperatura');
const IMU = require('../../resources/scripts/imu');
const GNSS = require('../../resources/scripts/gnss-client');
const { getToken } = require('../../resources/scripts/getToken');

class DeviceMonitor extends EventEmitter {
  constructor() {
    super();
    this.serialClient = SerialClient;
    this.digitalIO = DigitalIO;
    this.analogIn = AnalogIn;
    this.temperatureSensor = TemperatureSensor;
    this.imu = IMU;
    this.gnss = GNSS;

    this.monitoringInterval = 1000; // 1 sekunda (możesz zmienić)
    this.intervalId = null;
    this.currentState = {};
    this.token = null;
    this.tokenRefreshInterval = 25 * 60 * 1000; // 25 minut
    this.tokenRefreshTimer = null;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  async initialize() {
    try {
      await this.initializeToken();
      return true;
    } catch (error) {
      console.error('Initialization failed:', error);
      return false;
    }
  }

  async initializeToken() {
    try {
      this.token = await this.refreshToken();

      this.tokenRefreshTimer = setInterval(async () => {
        try {
          await this.refreshToken();
        } catch (error) {
          console.error('Background token refresh failed:', error);
        }
      }, this.tokenRefreshInterval);

      return this.token;
    } catch (error) {
      console.error('Initial token fetch failed:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      throw error;
    }
  }

  async refreshToken() {
    try {
      const newToken = await getToken();
      if (!newToken) throw new Error('Empty token received');

      this.token = newToken;
      this.retryCount = 0;
      console.log('Token refreshed successfully');
      return newToken;
    } catch (error) {
      this.retryCount++;
      if (this.retryCount <= this.maxRetries) {
        console.log(`Retrying token fetch (attempt ${this.retryCount}/${this.maxRetries})`);
        await new Promise(r => setTimeout(r, 2000 * this.retryCount));
        return this.refreshToken();
      }
      console.error('Failed to refresh token after retries:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      });
      this.token = null;
      throw error;
    }
  }

  async createGrpcMetadata() {
    if (!this.token) await this.initializeToken();

    const metadata = new grpc.Metadata();
    metadata.add('authorization', `Bearer ${this.token}`);
    metadata.add('content-type', 'application/grpc');
    return metadata;
  }

  async getCurrentState() {
    try {
      const metadata = await this.createGrpcMetadata();

      const [serial, digital, analog, temp, imu, gnss] = await Promise.all([
        this.getSerialState(metadata).catch(e => this.handleGrpcError('Serial', e)),
        this.getDigitalIOState(metadata).catch(e => this.handleGrpcError('DigitalIO', e)),
        this.getAnalogInState(metadata).catch(e => this.handleGrpcError('AnalogIn', e)),
        this.getTemperatureState(metadata).catch(e => this.handleGrpcError('Temperature', e)),
        this.getIMUState(metadata).catch(e => this.handleGrpcError('IMU', e)),
        this.getGNSSState(metadata).catch(e => this.handleGrpcError('GNSS', e)),
      ]);

      this.currentState = {
        serial,
        digital,
        analog,
        temperature: temp,
        imu,
        gnss,
        timestamp: new Date().toISOString(),
        status: 'OK',
      };

      return this.currentState;
    } catch (error) {
      console.error('Error in getCurrentState:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });

      this.currentState = {
        ...this.currentState,
        status: 'ERROR',
        lastError: error.message,
        timestamp: new Date().toISOString(),
      };

      throw error;
    }
  }

  handleGrpcError(deviceType, error) {
    console.error(`Error getting ${deviceType} state:`, {
      code: error.code,
      details: error.details,
      message: error.message,
    });

    if (error.code === grpc.status.UNAUTHENTICATED) {
      console.log('Authentication error detected, refreshing token...');
      this.token = null;
    }

    return {
      error: {
        type: deviceType,
        code: error.code || 'UNKNOWN',
        message: error.message || 'Unknown error',
      },
    };
  }

  async getSerialState(metadata) {
    try {
      const status = await this.serialClient.checkStatus(metadata);
      return { ...status, status: 'OK' };
    } catch (error) {
      throw this.wrapGrpcError(error, 'Serial');
    }
  }

  async getDigitalIOState(metadata) {
    try {
      const devices = await this.digitalIO.listDevices(metadata);
      const states = await Promise.all(
        devices.map(async device => {
          try {
            const state = await this.digitalIO.read(device.name, metadata);
            return { name: device.name, state, status: 'OK' };
          } catch (error) {
            return {
              name: device.name,
              status: 'ERROR',
              error: this.wrapGrpcError(error, 'DigitalIO'),
            };
          }
        }),
      );
      return states;
    } catch (error) {
      throw this.wrapGrpcError(error, 'DigitalIO');
    }
  }

  async getAnalogInState(metadata) {
    try {
      const devices = await this.analogIn.listDevices(metadata);
      const readings = await Promise.all(
        devices.map(async device => {
          try {
            const reading = await this.analogIn.read(device.name, metadata);
            return { name: device.name, ...reading, status: 'OK' };
          } catch (error) {
            return {
              name: device.name,
              status: 'ERROR',
              error: this.wrapGrpcError(error, 'AnalogIn'),
            };
          }
        }),
      );
      return readings;
    } catch (error) {
      throw this.wrapGrpcError(error, 'AnalogIn');
    }
  }

  async getTemperatureState(metadata) {
    try {
      const devices = await this.temperatureSensor.listDevices(metadata);
      const readings = await Promise.all(
        devices.map(async device => {
          try {
            const reading = await this.temperatureSensor.readTemperature(device.name, metadata);
            return { name: device.name, ...reading, status: 'OK' };
          } catch (error) {
            return {
              name: device.name,
              status: 'ERROR',
              error: this.wrapGrpcError(error, 'Temperature'),
            };
          }
        }),
      );
      return readings;
    } catch (error) {
      throw this.wrapGrpcError(error, 'Temperature');
    }
  }

  async getIMUState(metadata) {
    try {
      const devices = await this.imu.listDevices(metadata);
      const readings = await Promise.all(
        devices.map(async device => {
          try {
            const channels = await this.imu.readSampleScaled(device.name, metadata);
            return { name: device.name, channels, status: 'OK' };
          } catch (error) {
            return {
              name: device.name,
              status: 'ERROR',
              error: this.wrapGrpcError(error, 'IMU'),
            };
          }
        }),
      );
      return readings;
    } catch (error) {
      throw this.wrapGrpcError(error, 'IMU');
    }
  }

  async getGNSSState(metadata) {
    try {
      const [status, constellations, nmeaFrequency] = await Promise.all([
        this.gnss.getDeviceStatus(metadata).catch(e => ({ error: this.wrapGrpcError(e, 'GNSS Status') })),
        this.gnss.getConstellations(metadata).catch(e => ({ error: this.wrapGrpcError(e, 'GNSS Constellations') })),
        this.gnss.getNmeaOutputFrequency(metadata).catch(e => ({ error: this.wrapGrpcError(e, 'GNSS Frequency') })),
      ]);

      return {
        status: status.error ? status : { ...status, status: 'OK' },
        constellations: constellations.error ? constellations : { ...constellations, status: 'OK' },
        nmeaFrequency: nmeaFrequency.error ? nmeaFrequency : { ...nmeaFrequency, status: 'OK' },
        overallStatus: status.error || constellations.error || nmeaFrequency.error ? 'PARTIAL' : 'OK',
      };
    } catch (error) {
      throw this.wrapGrpcError(error, 'GNSS');
    }
  }

  wrapGrpcError(error, context) {
    return {
      code: error.code || grpc.status.UNKNOWN,
      message: error.message || 'Unknown gRPC error',
      details: error.details || 'No additional details',
      context: context || 'Unknown context',
      timestamp: new Date().toISOString(),
    };
  }

  async startMonitoring() {
    if (this.intervalId) clearInterval(this.intervalId);

    try {
      await this.initialize();
    } catch (error) {
      console.error('Failed to initialize monitor:', error);
      throw error;
    }

    this.intervalId = setInterval(async () => {
      try {
        const state = await this.getCurrentState();
        this.emit('data', { type: 'DEVICE_UPDATE', data: state });
      } catch (error) {
        console.error('Monitoring cycle error:', {
          message: error.message,
          code: error.code,
          stack: error.stack,
        });
        this.emit('error', {
          type: 'MONITORING_ERROR',
          error: this.wrapGrpcError(error, 'MonitoringCycle'),
          timestamp: new Date().toISOString(),
        });
      }
    }, this.monitoringInterval);
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    console.log('Device monitoring stopped');
  }

  async getStatus() {
    return {
      monitoring: !!this.intervalId,
      lastState: this.currentState,
      tokenStatus: this.token ? 'VALID' : 'INVALID',
      lastUpdate: this.currentState.timestamp || 'NEVER',
    };
  }
}

module.exports = DeviceMonitor;
