const socket = io();

// Elements
const $btnTakeOff = document.querySelector('#btnTakeOff');
const $btnLand = document.querySelector('#btnLand');
const $btnUp = document.querySelector('#btnUp');
const $btnDown = document.querySelector('#btnDown');
const $btnStreamOn = document.querySelector('#btnStreamOn');
const $btnStreamOff = document.querySelector('#btnStreamOff');
const $btnRoute1 = document.querySelector('#btnRoute1');

const $statusDisconnected = $('.statusDisconnected');
const $statusConnected = $('.statusConnected');
const $cameraoff = $('.cameraoff');
const $tellocamera = $('#tellocamera');

const $batteryText = $('.battery > p');
const $batterylevel = $('.batterylevel');
const $heightLevel = $('.heightLevel');

let barcodeAlreadyScanned = [];
let audioSuccess = new Audio('./sounds/ok.wav');


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
    $cameraoff.hide();
    $tellocamera.show();

    setInterval(() => {
        var base64png = $tellocamera[0].toDataURL('image/png').replace(/^data:image\/png;base64,/, "");
        socket.emit('detectbarcode', {
            base64png
        });
    }, 100);
});

$btnStreamOff.addEventListener('click', () => {
    socket.emit('streamoff');

    $cameraoff.show();
    $tellocamera.hide();
});

$btnRoute1.addEventListener('click', () => {
    socket.emit('route1');
});

const toggleButtons = (enable) => {
    $btnTakeOff.disabled = enable;
    $btnLand.disabled = enable;
    $btnUp.disabled = enable;
    $btnDown.disabled = enable;
    $btnStreamOn.disabled = enable;
    $btnStreamOff.disabled = enable;
    $btnRoute1.disabled = enable;
};

socket.on('isConnected', (status, battery, height) => {
    if (status) {
        $statusDisconnected.hide();
        $statusConnected.show();
    } else {
        $statusConnected.hide();
        $statusDisconnected.show();
    }

    $batteryText.text(`Battery ${battery.toString().trim('')}%`);
    $batterylevel.width(`${battery.toString().trim('')}%`)

    $heightLevel.text(height.toString().trim(''));

    toggleButtons(!status);

});

socket.on('commandError', (error) => {
    console.log(error);
});

socket.on('newbarcodescanned', (barcode) => {
    barcodeAlreadyScanned.push(barcode);
    audioSuccess.play();
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
} else {
    setTimeout(init, 500)
};