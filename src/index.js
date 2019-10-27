const path = require('path');
const express = require('express');
const app = express();
const Tello = require('./tello');
const { spawn } = require('child_process');
const ws = require('ws');
const sdkTello = require('tellojs');

const telloHost = '192.168.10.1';
const telloPortCamera = 11111;
const localPort = 3000;
const localHost = 'localhost';

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public');

// Create new instance of tello class
const tello = new Tello();

// Setup static directory to serve
app.use(express.static(publicDirectoryPath));

// Open Tello camera and start streaming
app.post(`/streamon`, async(req, res) => {
    await tello.sendCommand('command');
    await tello.sendCommand('streamon');
    res.end()
});

// Close Tello camera
app.post('/streamoff', async(req, res) => {
    await tello.sendCommand('command');
    await tello.sendCommand('streamoff');
});

// Ws Tello streaming
app.post('/streaming', (req, res) => {
    res.connection.setTimeout(0);
    req.on('data', function(data) {
        webSocket.broadcast(data)
    });
});

 // Connect to Tello Drone
  app.post('/connect', async(req, res) => {
    try {
        sdkTello.control.connect();
        res.send(200);
    } catch (e) {
        res.status(500).send(e);
    }
  });

// TakeOff 
app.post('/takeoff', async(req, res) => {
    try {        
        await sdkTello.control.takeOff();
    } catch (e) {
        res.status(500).send(e);
    }
});

// Land
app.post('/land', async(req,res) => {
    try {        
        await sdkTello.control.land();
    } catch (e) {
        res.status(500).send(e);
    }
});

// Up
app.post('/up', async(req,res) => {
    try {        
        await sdkTello.control.move.up(20);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Down
app.post('/down', async(req,res) => {
    try {        
        await sdkTello.control.move.down(20);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Interface
app.get('/', (req, res) => {
    res.render('index');
});

// Express server
const server = app.listen(localPort, localHost);

// WebSocket Server for stream Tello Camera
const webSocket = new ws.Server({ server });

// WebSocket Server Broadcast, when the video data is sent to client 
webSocket.broadcast = function(data) {
    webSocket.clients.forEach(function each(client) {
        if (client.readyState === ws.OPEN) {
            client.send(data);
        }
    })
};

// FFMEG - use udp for stream video
const ffmpeg = spawn('ffmpeg', [
    '-hide_banner',
    '-i',
    `udp://${telloHost}:${telloPortCamera}`,
    '-f',
    'mpegts',
    '-codec:v',
    'mpeg1video',
    '-s',
    '640x480',
    '-b:v',
    '800k',
    '-bf',
    '0',
    '-r',
    '20',
    `http://${localHost}:${localPort}/streaming`
]);