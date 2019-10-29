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

const dgram = require('dgram');
const telloSocket = dgram.createSocket('udp4');

const fs = require('fs');

const telloHost = '192.168.10.1';
const telloPortCamera = 11111;
const localPort = 3000;
const localHost = 'localhost';
const wsPort = 3002;
const telloPort = 8889;

// Vars
let barcodeAlreadyScanned = [];

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public');

// Setup static directory to serve
app.use(express.static(publicDirectoryPath));

// Ws Tello streaming
app.post('/streaming', (req, res) => {
    res.connection.setTimeout(0);
    req.on('data', function (data) {
        webSocket.broadcast(data);
    });
});

io.on('connection', (socket) => {
    console.log('New websocket connection');

    socket.on('connection', async () => {
        try {
            await sdk.control.connect();
            await telloSocket.bind(telloPort);
            const battery = await sdk.read.battery();
            const height = await sdk.read.height();
            socket.emit('isConnected', true, battery, height);
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
            await telloSocket.send('command', telloPort, telloHost);
            await telloSocket.send('streamon', telloPort, telloHost);
        } catch (error) {
            console.log(error);
        }
    });

    socket.on('streamoff', async () => {
        try {
            await telloSocket.send('command', telloPort, telloHost);
            await telloSocket.send('streamoff', telloPort, telloHost);
        } catch (error) {
            console.log(error);
        }
    });

    socket.on('detectbarcode', async (params) => {
        try {
            const base64 = params.base64png;
            await fs.writeFile("barcode.png", base64, 'base64', () => { return; });

            const zbarimg = spawn('zbarimg', ['./barcode.png']);
            zbarimg.stdout.setEncoding('utf8');
            zbarimg.stderr.setEncoding('utf8');
            zbarimg.stdout.on('data', function (data) {
                if (!barcodeAlreadyScanned.includes(data.split(':')[1].trim(''))) {
                    barcodeAlreadyScanned.push(data.split(':')[1].trim(''));
                    socket.emit('newbarcodescanned', data.split(':')[1].trim(''));
                };
            });
        } catch (error) {
            //console.log(error);
        }
    });

    socket.on('route1', async () => {
        try {
            sdk.control.connect()
                .then(() => sdk.control.takeOff())
                .then(() => sdk.control.move.up(130))
                .then(() => sdk.control.move.down(130))
                .then(() => sdk.control.move.left(60))
                .then(() => sdk.control.move.up(130))
                .then(() => sdk.control.move.down(130))
                .then(() => sdk.control.land())
                .then(result => console.log(result))
                .catch(error => console.error(error))
        } catch (error) {
            console.log(error);
        }
    });
});

// Express server
server.listen(localPort, localHost);

// WebSocket Server for stream Tello Camera
const webSocket = new ws.Server({ port: wsPort, host: localHost });

// WebSocket Server Broadcast, when the video data is sent to client 
webSocket.broadcast = function (data) {
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