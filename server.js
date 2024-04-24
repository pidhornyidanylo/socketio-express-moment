const express = require("express");
const path = require("path");
const http = require("http");
const sockerio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
    userJoin,
    getCurrentUser,
    getRoomUsers,
    userLeave
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = sockerio(server);


// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botname = "ChatCord BOT"

// Run when a client connects
io.on("connection", (socket) => {
    socket.on("joinRoom", ({
        username,
        room
    }) => {
        const user = userJoin(socket.id, username, room)
        socket.join(user.room);

        // Welcome current user
        socket.emit("message", formatMessage(botname, "Welcome to ChatCord!"));

        // Broadcast when a user connects
        socket.broadcast.to(user.room).emit("message", formatMessage(botname, `${user.username} has joined the chat`));

        // Send users and room info
        io.to(user.room).emit("roomUsers", {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    })

    // Listen for chatMessage
    socket.on("chatMessage", (msg) => {
        io.to(getCurrentUser(socket.id).room).emit("message", formatMessage(getCurrentUser(socket.id).username, msg));
    })

    // Runs when client disconnects
    socket.on("disconnect", () => {
        const user = userLeave(socket.id);
        if (user) {
            io.to(user.room).emit("message", formatMessage(botname, `${user.username} has left the chat`));
            io.to(user.room).emit("roomUsers", {
                room: user.room,
                users: getRoomUsers(user.room)
            })
        }
    })


})

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log("SERVER RUNNING"));