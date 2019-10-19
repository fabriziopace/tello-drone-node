const express = require('express');
const app = express();
const path = require('path');
const dgram = require('dgram');

const port = '8889'; // Tello UDP port
const host = '192.168.10.1'; // Tello ip
const portState = '8890'; // Tello state UDP port
const portVideo = '11111'; // Tello video stream UDP port
const hostVideo = '0.0.0.0'; // Tello video stream UDP ip
const interfacePort = '3000'; // Front-end interface port

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public');
const viewsPath = path.join(__dirname, '../templates/views');

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
    console.log(`Tello says: ${message}`);
});

// In order to receive Tello state
telloState.bind(portState, hostVideo);
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

telloCamera.bind(portVideo, hostVideo);

// Interface Front-End
// Setup handlebars engine and views location
app.set('view engine', 'hbs');
app.set('views', viewsPath);

// Setup static directory to serve
app.use(express.static(publicDirectoryPath));

app.get('', (req, res) => {
    res.render('index')
});

app.listen(interfacePort, () => {
    console.log(`Server is up on port ${interfacePort}`)
})