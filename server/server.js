const path = require("path");
const http = require("http");
const express = require("express");
const socketIO = require("socket.io");
const d3Array = require("d3-array");

const oneDeck = require("./cards");
const Counter = require("./counter");
const cards = oneDeck.concat(oneDeck);
const numPlayers = 4;
const numCardsPerUser = (cards.length - 8) / numPlayers;
let userCounter = Counter();
const clientPath = path.join(__dirname, "/../client");
const port = process.env.PORT || 3000;

let app = express();
let server = http.createServer(app);
let io = socketIO(server);

let numUserConnected = 0;
let socketsReady = new Set();
let reservedCards;

app.use(express.static(clientPath));
server.listen(port, () => {
    console.log(`Server is up on port ${port}.`)
});

io.on('connection', (socket) => {
    io.to(socket.id).emit("start screen", socketsReady.size);

    socket.userId = userCounter.next().value;
    io.to(socket.id).emit("user id", socket.userId);

    numUserConnected++;
    io.emit('user count', numUserConnected);
    console.log("Number of user connected: ", numUserConnected);

    socket.on('disconnect', () => {
        console.log('A user has disconnected.');
        numUserConnected--;
        io.emit('user count', numUserConnected);
        if (socketsReady.has(socket)) {
            socketsReady.delete(socket);
            io.emit('update ready users', socketsReady.size);
        }
    });

    socket.on('start game', () => {
        io.to(socket.id).emit('start game', socketsReady.size);

        if (socketsReady.size == 4) {
            io.to(socket.id).emit("room full");
            return;
        }
        socketsReady.add(socket);
        io.emit("update ready users", socketsReady.size);
        socket.join("room ready");
        if (socketsReady.size == 4) {
            // Shuffle cards
            d3Array.shuffle(cards); // d3 shuffles inplace
            const socketsArray = Array.from(socketsReady);
            const userIds = socketsArray.map(x => x.userId);
            reservedCards = cards.slice(cards.length - 8, cards.length);
            for (let i in socketsArray) {
                i = parseInt(i);
                const userCards = cards.slice(i * numCardsPerUser, (i + 1) * numCardsPerUser);
                io.to(socketsArray[i].id).emit("render layout", userIds, userCards);
            }
        };
    });

    socket.on("亮主", (userId, cards) => {
        io.to("room ready").emit("亮主", userId, cards);
    });

    socket.on("清空", () => {
        io.to("room ready").emit("清空");
    });

    socket.on("出牌", (userId, cards) => {
        io.to("room ready").emit("出牌", userId, cards);
    });

    socket.on("抠底", (myUserId) => {
        io.to("room ready").emit("抠底", myUserId, reservedCards);
    })

    socket.on("放底", (cards) => {
        reservedCards = cards;
        io.to("room ready").emit("放底");
    })
});