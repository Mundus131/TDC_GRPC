const express = require('express');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const http = require('http');
const { exec } = require('child_process');

const {
  setupSerialPort,
  writeToSerial,
  loadConfig,
  saveConfig,
  wsClients
} = require('./serialManager');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 5555;


app.use(bodyParser.json());

// === WebSocket ===
wss.on('connection', (ws) => {
  wsClients.push(ws);
  ws.on('close', () => {
    const idx = wsClients.indexOf(ws);
    if (idx !== -1) wsClients.splice(idx, 1);
  });
});

// === API do wysyłania danych na port szeregowy ===
app.post('/send', (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).send('Brak wiadomości');
  writeToSerial(message);
  res.send('Wysłano');
});

// === API: pobierz konfigurację ===
app.get('/config', (req, res) => {
  res.json(loadConfig());
});

// === API: ustaw konfigurację i przeładuj port ===
app.post('/config', (req, res) => {
  const newConfig = req.body;
  saveConfig(newConfig);
  setupSerialPort((data) => {
    console.log('>>', data);
  });
  res.send('Konfiguracja zapisana i port przeładowany.');
});

app.post('/command', (req, res) => {
  const { command } = req.body;
  if (!command) {
    return res.status(400).json({ error: 'Brak komendy' });
  }

  exec(command, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: stderr || error.message });
    }
    res.json({ output: stdout });
  });
});


// === Start ===
setupSerialPort((data) => {
  console.log('>>', data);
});

server.listen(PORT, () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
});
