const {createSocket} = require('dgram');

const telloPort = 8889; 
const telloHost = '192.168.10.1';
const udpTimeout = 5000; // 5 Seconds

class tello {
    constructor() {
        this.udpSocket = createSocket('udp4'); 
        this.udpSocket.bind(telloPort); 

        // For keep the connection with Tello alive
        setInterval(async() => {
            await this.sendCommand('command');
        }, 10 * 1000);
    }

    async sendCommand(command) {
        return new Promise(resolve => {            
            // After 5 seconds remove listeners
            const timeoutUdpList = setTimeout(() => {
                resolve();
                this.udpSocket.removeListener('message', msgFromTello);
            }, udpTimeout);

            // Messages from tello 
            const msgFromTello = msg => {
                resolve(msg);
                clearTimeout(timeoutUdpList);
                this.udpSocket.removeListener('message', msgFromTello);
            }

            this.udpSocket.on('message', msgFromTello);         // Get ready to receive message from Tello
            this.udpSocket.send(command, telloPort, telloHost); // Send command to drone
        })
    };
}

module.exports = tello;