// Importing essential packages
const express = require('express');  

// Importing from utils.js
const { makeid } = require('./utils/utils');

// Stores data about all the rooms
const rooms = [];
const PORT = 3000;

// Setting up the http server
const app = express();  
const server = require('http').createServer(app);  

// Setting up socket connection with incoming request from http://localhost:8000" (client server) socket.io 
const io = require("socket.io")(server, {
    cors: {
      origin: "http://localhost:8000",
      methods: ["GET", "POST"]
    }
});

// Stores information about users in rooms
const users = {}; // Format: { socketId: { userName, roomCode } }

io.on('connection', function (socket) {
    // On receiving a message to create a room, call handleCreateRoom function
    socket.on('create-room', handleCreateRoom);

    // On receiving a message to join a room, call handleJoinRoom function
    socket.on('join-room', handleJoinRoom);

    // On receiving a message related to the video state (pause, play)
    // Emit the message to other clients in the room
    socket.on('vid-state', data => {
        const vidState = data.vidState;
        const roomCode = data.roomCode;
        io.to(rooms[roomCode].code).emit('vid-state', vidState);
    });

    // On receiving a message related to seek (video played time)
    // Emit the message to other clients in the room
    socket.on('progress-bar-clicked', data => {
        const newTime = data.newTime;
        const roomCode = data.roomCode;
        io.to(rooms[roomCode].code).emit('progress-bar-clicked', newTime);
    });

    // Handle chat messages
    socket.on('chatMessage', data => {
        const { roomCode, message } = data;
        const user = users[socket.id];
        if (user && user.roomCode === roomCode) {
            io.to(roomCode).emit('message', { userName: user.userName, message });
        }
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user) {
            const { roomCode, userName } = user;
            delete users[socket.id];
    
            // Get the updated list of users in the room
            const userList = Object.values(users)
                .filter(user => user.roomCode === roomCode)
                .map(user => user.userName);
    
            io.to(roomCode).emit('update-users', userList);
            io.to(roomCode).emit('message', { userName: 'System', message: `${userName} has left the room.` });
        }
    });
    

    // Functions
    function handleCreateRoom() {
        // Getting a random room number from makeid function
        const roomCode = makeid(10);

        // Creating and adding the room object to the rooms dictionary
        rooms[roomCode] = {
            code: roomCode,
        };

        socket.emit("room-created", roomCode);
    }

    function handleJoinRoom(data) {
        const { roomCode, userName } = data;
        if (rooms[roomCode]) {
            socket.join(roomCode);
    
            // Save the user information
            users[socket.id] = { userName, roomCode };
    
            // Get the list of users in the room
            const userList = Object.values(users)
                .filter(user => user.roomCode === roomCode)
                .map(user => user.userName);
    
            io.to(roomCode).emit('update-users', userList);
    
            io.to(roomCode).emit('message', { userName: 'System', message: `${userName} has joined the room!` });
            socket.emit("joined", rooms[roomCode]);
        }
    }
    
});

// Port server will listen to 3000 or set by the cloud provider
server.listen(PORT, () => console.log(`Server running at ${PORT}`));
