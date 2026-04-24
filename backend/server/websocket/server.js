const WebSocket = require('ws');
const DeviceMonitor = require('../services/deviceMonitor');

class WebSocketServer {
  constructor(httpServer) {
    this.wss = new WebSocket.Server({ server: httpServer });
    this.clients = new Set();
    this.deviceMonitor = new DeviceMonitor();
  }

  initialize(restServer) {
    this.restServer = restServer;
    
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log(`New WebSocket client connected. Total: ${this.clients.size}`);

      this.sendInitialData(ws);

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`Client disconnected. Total: ${this.clients.size}`);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    this.deviceMonitor.on('data', (data) => {
      this.broadcast(data);
    });

    this.deviceMonitor.startMonitoring(restServer);
  }

  async sendInitialData(ws) {
    try {
      const initialData = await this.deviceMonitor.getCurrentState();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'INITIAL_DATA',
          data: initialData
        }));
      }
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  broadcast(data) {
    const message = JSON.stringify(data);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  getClientCount() {
    return this.clients.size;
  }
}

module.exports = WebSocketServer;