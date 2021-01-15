let socket = io();

const totalNumUsers = 4;
let users = [], divContainers = [];
for (let i = 0; i < totalNumUsers; i++) {
    users.push(document.getElementById(`user-${i + 1}`));
    // divContainers.push(document.getElementById(`container-${i + 1}`));
}

let myUserId, myPosition, userIdToPos = {};

let numUserConnected = document.getElementById('num-user-connected');
let userId = document.getElementById('user-id');
let userIdToDeck = {};
let userTop = document.getElementById('user-top'),
    userLeft = document.getElementById('user-left'),
    userRight = document.getElementById('user-right'),
    deckTop = document.getElementById('deck-top'),
    deckBottom = document.getElementById('deck-bottom'),
    deckLeft = document.getElementById('deck-left'),
    deckRight = document.getElementById('deck-right');
let buttonDiv = d3.select("#row-5").select("#col-2");

const startButton = document.getElementById('start-button');
let numUserReady = document.getElementById('num-user-ready');
let iAmReady = document.getElementById('i-am-ready');
let myCards, remainCards, myCardSelection;
let masterBtn, reserveBtn, dealBtn, clearBtn;
const cardSize = 80;

socket.on("start screen", (count) => {
    startButton.style.display = "block";
    iAmReady.style.display = "none";
    for (let container of divContainers) {
        // container.style.display = "none";
        // d3.select(container).selectAll("div").remove();
    }
    numUserReady.textContent = "Number of users ready: " + count;
});

startButton.addEventListener('click', () => {
    socket.emit('start game');
});
socket.on("user count", (count) => {
    numUserConnected.textContent = "Number of users connected: " + count;
});

socket.on("user id", (id) => {
    myUserId = id;
    userId.textContent = `My user id: ${id}`;
})

socket.on('start game', (count) => {
    startButton.style.display = "none";
    iAmReady.style.display = "block";
    numUserReady.textContent = "Number of users ready: " + count;
});

socket.on("update ready users", (count) => {
    numUserReady.textContent = "Number of users ready: " + count;
})

socket.on("room full", () => {
    iAmReady.textContent = "房间满了！";
})

socket.on("render layout", (userIds, cards) => {
    console.log(userIds, cards);
    iAmReady.style.display = "none";
    sortCards(cards);
    myCards = cards;
    remainCards = cards;
    renderUserNames(userIds);
    renderCards(cards);
    addMasterBtn();
    addReserveBtn();
    addClearBtn();
})

socket.on("亮主", (userId, cards) => {
    let texts = "";
    for (let card of cards) {
        texts += String.fromCodePoint(parseInt(card.unicode, 16));
    }
    userIdToDeck[userId].textContent = texts;
})

socket.on("清空", clearDecks);

socket.on("出牌", (userId, cards) => {
    let texts = "";
    for (let card of cards) {
        texts += String.fromCodePoint(parseInt(card.unicode, 16));
    }
    userIdToDeck[userId].textContent = texts;
})

socket.on("抠底", (userId, reservedCards) => {
    if (masterBtn) masterBtn.remove();
    if (userId == myUserId) {
        d3.select(userIdToDeck[myUserId]).selectAll("div")
            .data(reservedCards)
            .join("div")
            .style("float", "left")
            .style("font-size", cardSize + "px")
            .text(d => String.fromCodePoint(parseInt(d.unicode, 16)))
            .on("click", function (e, d) {
                if (d.selected) {
                    d3.select(this).style("margin-top", "0");
                    d.selected = false;
                } else {
                    d3.select(this).style("margin-top", "-20px");
                    d.selected = true;
                };
            });

        d3.select("#抠底").on("click", function () {
            let selectedCards = reservedCards.concat(myCards).filter(d => d.selected);
            let updatedCards = reservedCards.concat(myCards).filter(d => !d.selected);
            console.log(selectedCards);
            if (selectedCards.length == 8) {
                d3.select(this).remove();
                clearDecks();
                sortCards(updatedCards);
                myCards = updatedCards;
                remainCards = updatedCards;
                renderCards(updatedCards);
                socket.emit("放底", selectedCards);
            }
        })
    } else {
        if (reserveBtn) reserveBtn.remove();
    }
})

socket.on("放底", () => {
    addDealBtn();
})

function clearDecks() {
    for (const [k, v] of Object.entries(userIdToDeck)) {
        v.textContent = "";
    }
}

function renderUserNames(userIds) {
    myPosition = userIds.indexOf(myUserId);
    const right = (myPosition + 1) % totalNumUsers;
    const across = (myPosition + 2) % totalNumUsers;
    const left = (myPosition + 3) % totalNumUsers;
    userIdToPos[userIds[right]] = right;
    userIdToPos[userIds[across]] = across;
    userIdToPos[userIds[left]] = left;

    userRight.textContent = "User " + userIds[right];
    userTop.textContent = "User " + userIds[across];
    userLeft.textContent = "User " + userIds[left];

    userIdToDeck[myUserId] = deckBottom;
    userIdToDeck[userIds[right]] = deckRight;
    userIdToDeck[userIds[left]] = deckLeft;
    userIdToDeck[userIds[across]] = deckTop;
}

function renderCards(cards) {
    console.log(myPosition);
    if (myCardSelection) myCardSelection.remove();

    myCardSelection = d3.select("#row-5").select("#col-1").selectAll("div")
        .data(cards)
        .join("div")
        .style("float", "left")
        .style("font-size", cardSize + "px")
        .text(d => String.fromCodePoint(parseInt(d.unicode, 16)))
        .on("click", function (e, d) {
            if (d.selected) {
                d3.select(this).style("margin-top", "0");
                d.selected = false;
            } else {
                d3.select(this).style("margin-top", "-20px");
                d.selected = true;
            };
        })
        .lower();
}

function addMasterBtn() {
    if (masterBtn) masterBtn.remove();
    masterBtn = buttonDiv.append("button").attr("class", 'btn btn-info')
        .style("margin", "2px")
        .text("亮主")
        .on("click", () => {
            socket.emit("亮主", myUserId, myCards.filter(card => card.selected));
            myCardSelection.filter(d => d.selected).dispatch("click");
        });
}

function addReserveBtn() {
    if (reserveBtn) reserveBtn.remove();
    reserveBtn = buttonDiv.append("button").attr("class", 'btn btn-info')
        .attr("id", "抠底")
        .style("margin", "2px")
        .text("抠底")
        .on("click", function () {
            socket.emit("抠底", myUserId);
            d3.select(this).text("放底");
        });
}

function addDealBtn() {
    if (dealBtn) dealBtn.remove();
    dealBtn = buttonDiv.append("button").attr("class", 'btn btn-info')
        .style("margin", "2px")
        .text("出牌")
        .on("click", () => {
            const selectedCards = remainCards.filter(d => d.selected);
            remainCards = remainCards.filter(d => !d.selected);
            myCardSelection.filter(d => d.selected).remove();
            socket.emit("出牌", myUserId, selectedCards);
        })
        .lower();
}

function addClearBtn() {
    if (clearBtn) clearBtn.remove();
    clearBtn = buttonDiv.append("button").attr("class", 'btn btn-info')
        .style("margin", "2px")
        .text("清空")
        .on("click", () => {
            socket.emit("清空");
        });
}

function sortCards(cards) {
    cards.sort((x, y) => {
        const t = x.suit.localeCompare(y.suit);
        if (t == 0) return parseInt(x.value) - parseInt(y.value);
        return t;
    })
}