const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const sdk = require('tellojs');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const { spawn } = require('child_process');
const ws = require('ws');

const telloHost = '192.168.10.1';
const telloPortCamera = 11111;
const localPort = 3000;
const localHost = 'localhost';
const wsPort = 3002;

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public');

// Setup static directory to serve
app.use(express.static(publicDirectoryPath));

// Ws Tello streaming
app.post('/streaming', (req, res) => {
    res.connection.setTimeout(0);
    req.on('data', function(data) {
        webSocket.broadcast(data)
    });
});

io.on('connection', (socket) => {
    console.log('New websocket connection');

    socket.on('connection', async () => {
        try {
            await sdk.control.connect();
            const battery = await sdk.read.battery();
            socket.emit('isConnected', true, battery);
        } catch (error) {
            socket.emit('isConnected', false, 0);
        }
    });

    socket.on('command', async (params) => {
        try {
            switch (params.name) {
                case 'takeoff':
                    await sdk.control.takeOff();
                    break;
                case 'land':
                    await sdk.control.land();
                    break;
                case 'up':
                    await sdk.control.move.up(params.val);
                    break;
                case 'down':
                    await sdk.control.move.down(params.val);
                    break;
            }
        } catch (error) {
            socket.emit('commandError', error);
        }
    });

    socket.on('streamon', async () => {
        try {
            const bindVideo = async () => {
                const videoEmitter = await sdk.receiver.video.bind();
                videoEmitter.on('message', msg => {
                    webSocket.broadcast(msg)
                });
            };
            sdk.control.connect()
                .then(() => bindVideo())
                .then((result) => console.log(result))
                .catch((error) => console.error(error))
        } catch (error) {
            socket.emit('commandError', error);
        }
    });

});

// Express server
server.listen(localPort, localHost);

// WebSocket Server for stream Tello Camera
const webSocket = new ws.Server({ port: wsPort, host: localHost });

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