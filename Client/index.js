const socket = io();
let theme = undefined;
let game = undefined;
let playerIndex = -1;

// socket.on('gameCreated', (lobby) => {
//     console.log("Lobby: ")
//     console.log(lobby);
//     document.getElementsByClassName('screen-lobby')[0].style.display='none';
//     document.getElementsByClassName('waiting-room')[0].style.display='inline';
//     document.getElementById('game-id').innerText = lobby.id;
//     document.getElementById('game-id-2').innerText = lobby.id;
//     document.getElementById('num-players').innerText = 1;
//     document.getElementById('num-players-2').innerText = 1;
// });

socket.on('newJoin', (length) => {
    console.log('Received length: ' + length);
    document.getElementById('num-players').innerText = length;
    document.getElementById('num-players-2').innerText = length;
});

socket.on('joinedGame', (lobby) => {
    // Show joined game display
    document.getElementsByClassName('join-screen')[0].style.display='none';
    document.getElementsByClassName('screen-lobby')[0].style.display='none';
    document.getElementsByClassName('waiting-room')[0].style.display='inline';
    document.getElementById('game-id-2').innerText = lobby.id;
    document.getElementById('num-players-2').innerText = lobby.playerSockets.length;
});

// socket.on('lobby-closed', (lobbyId) => {
//     socket.emit('leave', lobbyId);
//     document.getElementById('game').style.display = 'none';
//     document.getElementsByClassName('waiting-room')[0].style.display='none';
//     document.getElementsByClassName('center-buttons')[0].style.display='inline';
//     alert('Host has left the lobby.');
// });

socket.on('gameStart', (gameState) => {
    console.log("Recieved gameState: ");
    console.log(gameState);
    game = gameState;
    playerIndex = game.playerIndex;

    // Load theme
    theme = new ThemeLoader("maple", game.N);

    document.getElementById('start-menu').style.display = 'none';
    document.getElementsByClassName('waiting-room')[0].style.display = 'none';
    document.getElementById('game').style.display = 'inline';
    
    // Set up guess
    [0, 1, 2].forEach(i => {
        const guess = document.getElementById('guess'+i);
        for (let j = 0; j < game.N; j++) {
            const option = document.createElement('option');
            option.value = j;
            option.text = theme.getName(i, j);
            guess.appendChild(option);
        }
    });
    
    game.players.forEach((p, i) => {
        const div = document.createElement("div");
        div.id = "player" + i;
        div.className = (i === playerIndex) ? "self_player" : "player";

        let elem = document.createElement("p");
        let text = document.createElement("span");
        text.id = "icon"+i;
        elem.appendChild(text);
        text = document.createTextNode((i === playerIndex ? "You (Player " + i + ")" : "Player " + i) + " | Guesses: ");
        let slot = document.createElement("span");
        slot.id = "guesses" + i;
        elem.appendChild(text);
        elem.appendChild(slot);
        div.appendChild(elem);

        elem = document.createElement("p");
        text = document.createTextNode("Secret: ");
        slot = document.createElement("span");
        slot.classList.add("card-list");
        slot.id = "secret" + i;
        elem.appendChild(text);
        elem.appendChild(slot);
        div.appendChild(elem);

        const openPiles = document.createElement("div");
        openPiles.className = "open-piles";
        div.appendChild(openPiles);
        
        elem = document.createElement("p");
        text = document.createTextNode("Yes: "); // And then create a list of no's
        slot = document.createElement("span");
        slot.classList.add("card-list");
        slot.id = "yes" + i;
        elem.appendChild(text);
        elem.appendChild(slot);
        openPiles.appendChild(elem);

        elem = document.createElement("p");
        text = document.createTextNode("No: "); // And then create a list of no's
        slot = document.createElement("span");
        slot.classList.add("card-list");
        slot.id = "no" + i;
        elem.appendChild(text);
        elem.appendChild(slot);
        openPiles.appendChild(elem);

        // if (i == playerIndex) {
        // Create hand
        elem = document.createElement("p");
        elem.id = "handp"+i;
        if (i != playerIndex) elem.style.display = "none";
        text = document.createTextNode("Hand: "); // And then create a list of no's
        slot = document.createElement("span");
        slot.classList.add("card-list");
        slot.id = (i == playerIndex) ? "hand" : "hand"+i;
        // generateList(slot, p.hand, true);
        elem.appendChild(text);
        elem.appendChild(slot);
        div.appendChild(elem);
        // }

        document.getElementById("players").appendChild(div);
    });

    loadGame();
});

function loadGame() {
    document.getElementById('phase').innerText = game.phase;
    document.getElementById('turn').innerText = game.turn;
    document.getElementById('deck-size').innerText = game.deckSize;

    game.players.forEach((p, i) => {
        let elem = document.getElementById("secret"+i);
        generateList(elem, [p.secret], false);
        // if (i === playerIndex) {
        //     elem.innerText = "???"
        // } else {
        //     generateList(elem, [p.secret], false);
        // }
        elem = document.getElementById("guesses"+i);
        elem.innerText = p.guesses;

        elem = document.getElementById("yes"+i);
        generateList(elem, p.yes, false);
        elem = document.getElementById("no"+i);
        generateList(elem, p.no, false);

        if (i == playerIndex) {
            elem = document.getElementById("hand");
            generateList(elem, p.hand, true);
        }
    });
}

function generateList(slot, arr, playable) {
    slot.innerHTML = "";
    arr.forEach((card, i) => {
        const elem = document.createElement("span");
        elem.innerHTML = theme.parse(card) + " ";
        if (playable) elem.setAttribute("onclick", "playCard("+i+")");
        slot.appendChild(elem);
    });
}

// Returns the number of coordinates in which the cards match 
function match(c1, c2) {
    let sum = 0;
    for (let i = 0; i < 3; i++) {
        sum += c1[i] == c2[i] ? 1 : 0
    }
    return sum;
}

socket.on('newDisconnect', (length)=> {
    document.getElementById('num-players').innerText = length;
    document.getElementById('num-players-2').innerText = length;
});

/* Game */
socket.on("setupPlayed", (cardIndex) => {
    console.log("Setup played card " + cardIndex);
    if (game.phase === 0) {
        const player = game.players[playerIndex];
        card = player.hand.splice(cardIndex, 1)[0];
        const nextPlayer = game.players[(playerIndex + 1) % game.players.length];
        nextPlayer[match(card, nextPlayer.secret) ? "yes" : "no"].push(card);
        loadGame();
    }
})

socket.on("beginPlay", (gameState) => {
    game = gameState;
    loadGame();
});

socket.on('cardPlayed', (data) => {
    console.log("Received 'cardPlayed'");
    console.log(data);
    //console.log("Player " + data.playerIndex + " played to pile '" + (data.pile ? "Yes" : "No") + "' card: " + data.card);

    const player = game.players[data.playerIndex];
    if (data.playerIndex == game.playerIndex) {
        // Card you played
        player.hand.splice(data.cardIndex, 1);
        if (data.draw) {
            player.hand.push(data.cardDrawn);
            console.log("Drawn card: " + data.cardDrawn);
        }
        generateList(document.getElementById("hand"), player.hand, true);
    }
        
    if (!data.draw) {
        player.handSize--;
    } else {
        game.deckSize--;
        document.getElementById("deck-size").textContent = game.deckSize;
    }
    (data.pile ? player.yes : player.no).push(data.card);

    // Display card
    const slot = document.getElementById((data.pile ? "yes" : "no") + data.playerIndex);
    generateList(slot, player[data.pile ? "yes" : "no"], false);

    game.turn = data.newTurn;
    document.getElementById("turn").textContent = game.turn;
});

socket.on('guessMade', (data) => {
    console.log("Received 'guessMade'");
    console.log(data);
    const player = game.players[data.playerIndex];
    if (data.win) {
        document.getElementById("icon" + data.playerIndex).textContent = "⭐";
        console.log("Game over. Player " + data.playerIndex + " has won.")
        if (data.playerIndex === playerIndex) {
            player.secret = data.guess;
            confetti({
                origin: {y:-0.19},
                particleCount: 1000,
                spread: 200,
                startVelocity: 50,
                gravity: 2.4,
                ticks: 170,
            });
        }
    } else {
        // Guess failed
        if (data.hostage !== undefined) {
            player[data.hostage ? "yes" : "no"].fill(null);
            if (data.playerIndex == game.playerIndex) {
                console.log(data.hostage)
                document.getElementById("hostage").removeChild(document.getElementById("hostage"+data.hostage));
            }
        }
    }
    console.log("Player " + data.playerIndex + " has guessed " + data.guesses + " times.")
    player.guesses = data.guesses;
    
    game.turn = data.newTurn;
    if (data.end) game.phase = 2;
    loadGame();
});

socket.on('deactivate', (data) => {
    console.log("Recieved deactivate");
    console.log(data);
    game.players[data.playerIndex].active = false;
    game.turn = data.turn;
    document.getElementById("icon" + data.playerIndex).textContent = data.reason == "guess" ? "💀" : "🔌";
    if (data.playerIndex !== playerIndex) {
        document.getElementById("handp"+data.playerIndex).style.display = "inline";
        generateList(document.getElementById("hand"+data.playerIndex), data.hand, false);
    }
    loadGame();
});


function showJoin() {
    document.getElementsByClassName('center-buttons')[0].style.display='none';
    document.getElementsByClassName('join-screen')[0].style.display='inline';
}

function joinGame() {
    console.log("Emitting: " + document.getElementById('join-code').value);
    socket.emit('joinGame', document.getElementById('join-code').value);
    document.getElementById('join-code').value = "";
}

function newGame() {
    document.getElementsByClassName('center-buttons')[0].style.display='none';
    document.getElementsByClassName('screen-lobby')[0].style.display='inline';
    socket.emit('newGame');
}

function startGame() {
    socket.emit('start');
    console.log("Emit message 'start'");
}

function playCard(index) {
    if (game.phase === 0 || (game.phase === 1 && game.turn === playerIndex)) {
        socket.emit("play", index);
        console.log("Playing card " + index);
    }
}

function makeGuess() {
    if (game.phase === 1 && game.turn === playerIndex) {
        const guess = [0, 1, 2].map(i => parseInt(document.getElementById('guess'+i).value));
        socket.emit("guess", [guess, parseInt(document.getElementById("hostage").value)]);
    }
}
