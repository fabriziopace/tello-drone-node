const socket = io();

socket.on('battery', (battery) => {
    $('.progress-bar')[0].style.width = `${battery}%`;
    $('.progress-bar').text(`Tello Battery ${battery}%`);
});