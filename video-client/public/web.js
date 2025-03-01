let herokuLink = "https://cinecast4.onrender.com/"; 

let localDeploy = "http://localhost:3000/";

// Linking to socket connection
var socket = io.connect(localDeploy, {
    reconnection: true
});

// Divs
const form = document.getElementById('input-form');
const videoContainer = document.getElementById('videoContainer');
const toFull = document.getElementById('toFull');

// Form Div
// Input Fields
const joinRoomInput = document.getElementById('join-room-input');
const createRoomInput = document.getElementById('create-room-input');

const socketData = {
    roomCode: "",
};

// On connection to socket
socket.on('connect', function () {
    // On receiving Joined emit
    socket.on('joined', roomObject => {
        form.style.display = "none";
        videoContainer.style.display = "block";

        createRoomInput.value = socketData.roomCode;

        // Updating the socket with the room's current state
        socketData.roomCode = roomObject.code;
        createRoomInput.value = socketData.roomCode;
        // Display room code in the UI
        document.getElementById('room-code').textContent = socketData.roomCode;
    });

    // On receiving room created message
    socket.on('room-created', roomCode => {
        let data = {
            roomCode: roomCode,
            user: socketData.userName,
        }
    });

    // On receiving video state (play / pause)
    socket.on('vid-state', state => {
        if (vid.paused) {
            vid.play();
            playPauseBtn.innerHTML = "&#9612;&#9612;";
        }
        else {
            vid.pause();
            playPauseBtn.innerHTML = "&#9658";
        }
    });

    // On receiving info related to progress-bar or seek
    socket.on('progress-bar-clicked', newTime => {
        vid.currentTime = newTime;
    });
});

// Form Div Buttons
const joinBtn = document.getElementById('join-btn');
const createBtn = document.getElementById('create-btn');

// Form Div button Listeners
joinBtn.addEventListener('click', joinButtonHandler);
createBtn.addEventListener('click', createButtonHandler);

// Functions
function createButtonHandler() {
    // Get the input field for creator's name
    const creatorNameInput = document.getElementById('creatorName');
    let userName = creatorNameInput.value.trim();

    // If creatorName input is empty, prompt the user for their name
    if (!userName) {
        userName = prompt("Enter your name:");
        if (!userName) {
            alert("Please enter a name!");
            return;
        }
    }

    // Set the userName in socketData
    socketData.userName = userName;

    // Emit the create-room event
    socket.emit("create-room");
}
socket.on('update-users', userList => {
    const userListDiv = document.getElementById('user-list');
    userListDiv.innerHTML = ''; // Clear the current list

    userList.forEach(userName => {
        const userElement = document.createElement('p');
        userElement.textContent = userName;
        userListDiv.appendChild(userElement);
    });
});

socket.on('room-created', roomCode => {
    // Ensure the creator's name is sent in the join-room event
    let data = {
        roomCode: roomCode,
        userName: socketData.userName // Send the creator's name
    };

    // Join the room immediately after it's created
    socket.emit('join-room', data);
});

function joinButtonHandler() {
    // Get the input field for the joiner's name
    const userNameInput = document.getElementById('userName');
    let userName = userNameInput.value.trim();

    // If userName input is empty, prompt the user for their name
    if (!userName) {
        userName = prompt("Enter your name:");
        if (!userName) {
            alert("Please enter a name!");
            return;
        }
    }

    // Set the userName in socketData
    socketData.userName = userName;

    // Prepare the data for joining the room
    let data = {
        roomCode: joinRoomInput.value,
        userName: userName
    };

    // Emit the join-room event
    socket.emit("join-room", data);
}


// Client side for videoContainer
// Setting variables for html elements, classes, id 
const vid = document.getElementById('videoPlayer');
const playPauseBtn = document.getElementById('play-pause');
const progress = document.getElementById('progress-bar');
const fullscreenBtn = document.getElementById('fullscreen');
const volinc = document.getElementById('volinc');
const voldec = document.getElementById('voldec');

const form2 = document.getElementById('join-room-form');
form2.addEventListener('submit', (e) => {
    e.preventDefault();

    const userName = socketData.userName;
    if (!userName) {
        alert("Please enter a name!");
        return;
    }

    const roomCode = socketData.roomCode;
    socket.emit('join-room', { roomCode, userName });
});

const chatForm = document.getElementById('chat-form');
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const messageInput = document.getElementById('messageInput');
    const roomCode = socketData.roomCode;

    // Send message to the server
    socket.emit('chatMessage', {
        roomCode,
        message: messageInput.value,
    });

    // Clear the input field
    messageInput.value = '';
});

socket.on('message', (data) => {
    const messagesDiv = document.getElementById('messages');
    // Create a new paragraph for the message
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `<strong>${data.userName}:</strong> ${data.message}`;
    // Append the message to the chatbox
    messagesDiv.appendChild(messageElement);

    // Scroll to the latest message
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// videoContainer div Event Listeners
// Toggle fullscreen mode
fullscreenBtn.addEventListener('click', openFullscreen);

// Control play and pause
playPauseBtn.addEventListener('click', pauseOrstart);

// Control volume
volinc.addEventListener('click', incVolume);
voldec.addEventListener('click', decVolume);

// Control progressBar on update in the time
vid.addEventListener('timeupdate', updateProgressBar);

// Changing the length of the progress-bar on user click
progress.addEventListener('click', function (e) {
    var pos = (e.pageX - this.offsetLeft - 2) / this.offsetWidth;
    var newTime = pos * vid.duration;

    let data = {
        roomCode: socketData.roomCode,
        newTime: newTime
    }
    socket.emit('progress-bar-clicked', data);
});

// Functions

// On click of pause/play button send the message telling clicked
function pauseOrstart() {
    let data = {
        roomCode: socketData.roomCode,
        videoState: 'clicked'
    }

    socket.emit('vid-state', data);
}

// Open fullscreen mode
function openFullscreen() {
    if (toFull.requestFullscreen) {
        toFull.requestFullscreen();
    } else if (toFull.webkitRequestFullscreen) { /* Safari */
        toFull.webkitRequestFullscreen();
    } else if (toFull.msRequestFullscreen) { /* IE11 */
        toFull.msRequestFullscreen();
    }
}

// Function to update progress bar on message from socket
function updateProgressBar() {
    var progressBar = document.getElementById('progress-bar');
    var percentage = Math.floor((100 / vid.duration) * vid.currentTime);
    progressBar.value = percentage;
};

function incVolume() {
    var currentVolume = Math.floor(vid.volume * 10) / 10;
    if (currentVolume < 1) vid.volume += 0.1;
}

function decVolume() {
    var currentVolume = Math.floor(vid.volume * 10) / 10;
    if (currentVolume > 0) vid.volume -= 0.1;
}
