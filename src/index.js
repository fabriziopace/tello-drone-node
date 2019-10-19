const express = require('express');
const app = express();
const path = require('path');
const dgram = require('dgram');
const http = require('http');
const socketio = require('socket.io');
const server = http.Server(app);
const io = socketio(server);

const port = '8889'; // Tello UDP port
const host = '192.168.10.1'; // Tello ip
const portState = '8890'; // Tello state UDP port
const portVideo = '11111'; // Tello video stream UDP port
const hostVideo = '0.0.0.0'; // Tello video stream UDP ip
const interfacePort = '3000'; // Front-end interface port

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public');

// Create sockets for Tello commands and Tello video streaming
const tello = dgram.createSocket('udp4');
const telloState = dgram.createSocket('udp4');
const telloCamera = dgram.createSocket('udp4');

// Tello socket error messages handler
const errorFromTello = (errorMessage) => {
    return errorMessage ? console.log(`Error ${errorMessage}`) : '';
};

// In order to send command and receive response
tello.bind(port);
tello.on('message', message => {
    // console.log(`Tello says: ${message}`);
    io.sockets.emit('battery', parseInt(message));
});

// In order to receive Tello state
telloState.bind(portState);
telloState.on('message', function(state) {
    console.log(state);
});

// Before sending any commands is required to send the following command 
tello.send('command', 0, 'command'.length, port, host, errorFromTello);

// Tello starts streaming
tello.send('streamon', 0, 'streamon'.length, port, host, errorFromTello);

telloCamera.on('listening', function() {
    var address = telloCamera.address();
    console.log(`UDP server listening on ${address.address} : ${address.port}`);
});


// tello.send('takeoff', 0, 'command'.length, port, host, errorFromTello);

// setTimeout(function() {
//     tello.send('land', 0, 'command'.length, port, host, errorFromTello);
// }, 3000);

telloCamera.bind(portVideo, hostVideo);

// Interface Front-End
// Setup static directory to serve
app.use(express.static(publicDirectoryPath));

app.get('', (req, res) => {
    res.render('index');
});

io.on('connection', (socket) => {
    socket.on('command', command => {
        tello.send(command, 0, command.length, port, host, errorFromTello);

        // socket.emit, io.emit, socket.broadcast.emit
        // io.to.emit, socket.broadcast.to.emit
    });

    // Check Tello Battery Each 5 Seconds
    setInterval(function() {
        tello.send('battery?', 0, 'battery?'.length, port, host, errorFromTello);
    }, 5000);
});

server.listen(interfacePort, () => {
    console.log(`Server is up on port ${interfacePort}`)
});