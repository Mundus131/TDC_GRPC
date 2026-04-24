const express = require('express');
const http = require('http');
const { getToken } = require('../resources/scripts/getToken');
const WebSocketServer = require('./websocket/server');
const deviceRoutes = require('./routes/devices');
const grpc = require('@grpc/grpc-js');
const cors = require('cors');

class RESTServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer(this.server);
    this.port = process.env.PORT || 5010;
    this.token = null;
    this.tokenRefreshInterval = 25 * 60 * 1000; // 25 minut
    this.tokenRefreshTimer = null;

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeWebSocket();
    this.initializeTokenRefresh();
  }

  initializeMiddlewares() {
    this.app.use(cors({
      origin: true,
      credentials: true
    }));
    this.app.use(express.json());
    
    this.app.use(async (req, res, next) => {
      try {
        if (!this.token) {
          await this.refreshToken();
        }
        
        req.grpcMetadata = new grpc.Metadata();
        req.grpcMetadata.add('authorization', `Bearer ${this.token}`);
        req.grpcMetadata.add('content-type', 'application/grpc');
        
        next();
      } catch (error) {
        console.error('Authentication middleware error:', error);
        res.status(500).json({ 
          error: 'Authentication failed',
          details: error.message 
        });
      }
    });
  }

  initializeRoutes() {
    this.app.use('/api/devices', deviceRoutes);
    
    this.app.get('/api/status', (req, res) => {
      res.json({ 
        status: 'running',
        websocket: this.wss ? 'active' : 'inactive',
        clients: this.wss ? this.wss.getClientCount() : 0
      });
    });
  }

  initializeWebSocket() {
    this.wss.initialize(this);
  }

  async refreshToken() {
    try {
      this.token = await getToken();
      console.log('Token refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh token:', error);
      this.token = null;
      throw error;
    }
  }

  initializeTokenRefresh() {
    this.refreshToken().catch(error => {
      console.error('Initial token fetch failed:', error);
    });
    
    this.tokenRefreshTimer = setInterval(() => {
      this.refreshToken().catch(error => {
        console.error('Background token refresh failed:', error);
      });
    }, this.tokenRefreshInterval);
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
      console.log(`WebSocket server is running`);
    });
  }
}

const server = new RESTServer();
server.start();

module.exports = server;