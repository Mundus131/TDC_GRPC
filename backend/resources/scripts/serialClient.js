const { SerialPort } = require('serialport');
const EventEmitter = require('events');
const fs = require('fs');

class SerialClient extends EventEmitter {
  constructor(configPath = './config.json') {
    super();
    this.configPath = configPath;
    this.port = null;
    this.config = this.loadConfig();
  }

  loadConfig() {
    return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
  }

  saveConfig(newConfig) {
    fs.writeFileSync(this.configPath, JSON.stringify(newConfig, null, 2));
    this.config = newConfig;
  }

  openPort() {
    if (this.port && this.port.isOpen) {
      this.port.close(() => this._open());
    } else {
      this._open();
    }
  }

  _open() {
    this.port = new SerialPort({
      path: this.config.serial.path,
      baudRate: this.config.serial.baudRate,
      dataBits: this.config.serial.dataBits,
      stopBits: this.config.serial.stopBits,
      parity: this.config.serial.parity,
      autoOpen: true
    });

    this.port.on('open', () => {
      console.log(`Serial port opened on ${this.config.serial.path}`);
      this.emit('open');
    });

    this.port.on('data', (data) => {
      const strData = data.toString();
      this.emit('data', strData);
    });

    this.port.on('error', (err) => {
      console.error('Serial port error:', err.message);
      this.emit('error', err);
    });
  }

  write(message) {
    if (!this.port || !this.port.isOpen) {
      console.warn('Serial port not open, cannot write.');
      return;
    }
    this.port.write(message + '\n', (err) => {
      if (err) {
        console.error('Error writing to serial port:', err.message);
        this.emit('error', err);
      } else {
        this.emit('write', message);
      }
    });
  }

  close() {
    if (this.port && this.port.isOpen) {
      this.port.close();
      this.emit('close');
    }
  }
}

module.exports = SerialClient;
