const socket = io();

// Elements
const $btnTakeOff = document.querySelector('#btnTakeOff');
const $btnLand = document.querySelector('#btnLand');
const $btnUp = document.querySelector('#btnUp');
const $btnDown = document.querySelector('#btnDown');
const $btnTakePicture = document.querySelector('#btnTakePicture');
const $btnStreamOn = document.querySelector('#btnStreamOn');

async function init() {
    connect();
}

const connect = async function () {
    socket.emit('connection');
};

$btnTakeOff.addEventListener('click', () => {
    socket.emit('command', {
        name: 'takeoff',
        val: 0
    });
});

$btnLand.addEventListener('click', () => {
    socket.emit('command', {
        name: 'land',
        val: 0
    });
});

$btnUp.addEventListener('click', () => {
    socket.emit('command', {
        name: 'up',
        val: 40
    });
});

$btnDown.addEventListener('click', () => {
    socket.emit('command', {
        name: 'down',
        val: 40
    });
});

$btnStreamOn.addEventListener('click', () => {

    const tellocamera = document.getElementById('tellocamera');
    const winLoc = window.location;
    const webSockUrl = `ws://${winLoc.hostname}:3002/`;

    const telloPlayer = new JSMpeg.Player(webSockUrl, {
        canvas: tellocamera,
        audio: false,
        videoBufferSize: 512 * 1024,
        preserveDrawingBuffer: true
    });
    
    socket.emit('streamon');
});

const toggleButtons = (enable) => {
    $btnTakeOff.disabled = enable;
    $btnLand.disabled = enable;
    $btnUp.disabled = enable;
    $btnDown.disabled = enable;
    $btnTakePicture.disabled = enable;
    $btnStreamOn.disabled = enable;
};

socket.on('isConnected', (status, battery) => {
    if (status) {
        $('.statusDisconnected').hide();
        $('.statusConnected').show();
    } else {
        $('.statusConnected').hide();
        $('.statusDisconnected').show();
    }

    $('.battery > p').text(`Battery ${battery.toString().trim('')}%`);
    $('.batterylevel').width(`${battery.toString().trim('')}%`)

    toggleButtons(!status);

});

socket.on('commandError', (error) => {
    console.log(error);
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
} else {
    setTimeout(init, 500)
};