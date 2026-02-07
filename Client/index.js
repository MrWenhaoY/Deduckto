const socket = io();
let theme = undefined;
let game = undefined;
let playerIndex = -1;
let timeout = null;

const STARTING_LIVES = 3;
const SCROLL_THRESHOLD = 10; // Pixels

function getElementByUniqueClass(className) {
    return document.getElementsByClassName(className)[0];
}

document.getElementById('join-code').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        joinGame();
    }
});

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
    document.getElementById('self-name').innerText = playerIndex;
    document.getElementById("pIndex").innerText = playerIndex;
    document.getElementById("self-yes").classList.add("yes"+playerIndex);
    document.getElementById("self-no").classList.add("no"+playerIndex);
    document.getElementById("self_icon").classList.add("icon"+playerIndex);
    document.getElementById("secret").classList.add("secret"+playerIndex);
    document.getElementById("lives").classList.add("lives"+playerIndex);
    document.getElementById("hand").classList.add("hand"+playerIndex);
    document.getElementById("main-action-area").classList.add("player"+playerIndex);

    // Load theme
    theme = new ThemeLoader("maple", game.N);

    document.getElementById('start-menu').style.display = 'none';
    document.getElementsByClassName('waiting-room')[0].style.display = 'none';
    document.getElementById('game-container').style.display = 'grid';
    
    // Hide player sidebar if single player
    if (game.players.length === 1) {
        document.getElementById("players-sidebar").style.display = 'none';
        document.getElementById("main-action-area").style.gridColumnStart = 'span 4';
        addLog("🔎 New game of Deduckto has started!")
    } else {
        addLog(`🛠️ Setup phase: Choose a card to play for Player ${(playerIndex + 1) % game.players.length}.`)
    }

    // Set up guess
    [0, 1, 2].forEach(i => {
        const guess = document.getElementById('guess'+i);
        for (let j = 0; j < game.N; j++) {
            const option = document.createElement('option');
            option.value = j;
            option.text = theme.getName(i, j);
            guess.appendChild(option);
        }
        guess.addEventListener("change", showPreview);
    });
    showPreview();

    game.players.forEach((p, i) => {    
        if (i !== playerIndex) {
            // Create play areas for other players
            const sidebar = document.getElementById("players-sidebar");
            const row = makeElement(sidebar, "player-row", "div");
            row.classList.add("player"+i);
            const info = makeElement(row, "player-info", "div");
            let elem = makeElement(info, "", "span");
            makeElement(elem, "icon"+i, "span");
            text = document.createTextNode("Player " + i);
            elem.appendChild(text);
            makeElement(info, "lives"+i, "div");
            makeElement(info, "secret"+i, "div");

            const wrapper = makeElement(row, "mini-piles-wrapper", "div");
            let pile = makeElement(wrapper, "mini-pile", "div");
            let label = makeElement(pile, "mini-pile-label", "div");
            label.textContent = "Yes";
            let yes = makeElement(pile, "mini-card-display", "div");
            yes.classList.add("yes"+i);
            pile = makeElement(wrapper, "mini-pile", "div");
            label = makeElement(pile, "mini-pile-label", "div");
            label.textContent = "No";
            let no = makeElement(pile, "mini-card-display", "div");
            no.classList.add("no"+i);
            
            pile = makeElement(wrapper, "mini-pile", "div");
            pile.style.display = "none";
            pile.classList.add("hand-pile"+i);
            label = makeElement(pile, "mini-pile-label", "div");
            label.textContent = "Hand";
            let hand = makeElement(pile, "mini-card-display", "div");
            hand.classList.add("hand"+i);
        }
    });

    loadGame();
});

function makeElement(parent, className, type) {
    const elem = document.createElement(type);
    if (className !== "") elem.className = className;
    parent.appendChild(elem);
    return elem;
}

const GAMEPHASE = ["SETUP", ]

function loadGame() {
    if (game.phase === 1) {
        document.getElementById("phase").style.display = 'none';
    } else {
        document.getElementById("phase").style.display = 'inline';
        document.getElementById('phase').innerText = game.phase === 0 ? "Setup Phase" : "Game Over";
    }
    
    document.getElementById('deck-size').innerText = game.deckSize;
    updateTurn(game.turn);

    game.players.forEach((p, i) => {
        let elem = getElementByUniqueClass("secret"+i);
        elem.innerHTML = theme.parse(p.secret);
        elem = getElementByUniqueClass("lives"+i);
        elem.innerText = "❤️".repeat(STARTING_LIVES - p.guesses);

        elem = getElementByUniqueClass("yes"+i);
        generateList(elem, p.yes, false);
        elem = getElementByUniqueClass("no"+i);
        generateList(elem, p.no, false);

        if (Array.isArray(p.hand)) {
            elem = getElementByUniqueClass("hand"+i);
            generateList(elem, p.hand, i === playerIndex);
        }
    });

    showPreview();
}

function showPreview() {
    const guess = [0, 1, 2].map(i => parseInt(document.getElementById('guess'+i).value));
    const elem = document.getElementById("guessPreview");
    elem.innerHTML = theme.parse(guess);
}

function generateList(slot, arr, playable) {
    slot.innerHTML = "";
    arr.forEach((card, i) => {
        const elem = document.createElement("span");
        elem.innerHTML = theme.parse(card) + " ";
        if (playable) {
            elem.setAttribute("onclick", "playCard("+i+")");
            elem.firstChild.classList.add("playable", "push");
        }
        slot.appendChild(elem);
    });
}

function addLog(text) {
    const logs = document.getElementById("log_contents");
    const autoScroll = logs.scrollHeight - logs.scrollTop - logs.clientHeight <= SCROLL_THRESHOLD;
    const log = document.createElement("div");
    // log.className = "log-message"; // Currently unused
    log.textContent = text;
    logs.appendChild(log);

    // Scroll to bottom
    if (autoScroll) logs.scrollTop = logs.scrollHeight;
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
        timeout = setTimeout(() => addLog("⏳ Waiting for other players to complete setup..."), 500);
        const player = game.players[playerIndex];
        card = player.hand.splice(cardIndex, 1)[0];
        const nextPlayer = game.players[(playerIndex + 1) % game.players.length];
        nextPlayer[match(card, nextPlayer.secret) ? "yes" : "no"].push(card);
        loadGame();
    }
})

socket.on("beginPlay", (gameState) => {
    clearTimeout(timeout); // Clear waiting message if other players finish quickly
    game = gameState;
    // Add logs
    const numPlayers = game.players.length;
    game.players.forEach((p, i) => {
        const pile = p.yes.length > 0; // true for yes and false for no
        addLog(`🔨 Player ${(i+1) % numPlayers} played ${theme.getText(p[pile ? "yes":"no"][0])} to Player ${i}'s '${pile ? "Yes":"No"}' pile.`);
    });
    addLog("🔎 Setup complete. Game start!");
    loadGame();
});

socket.on('cardPlayed', (data) => {
    // console.log("Received 'cardPlayed'");
    // console.log(data);
    addLog(`${data.pile ? "✅":"❌"} Player ${data.playerIndex} played ${theme.getText(data.card)} to the '${data.pile ? "Yes" : "No"}' pile.`)

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
    const slot = getElementByUniqueClass((data.pile ? "yes" : "no") + data.playerIndex);
    generateList(slot, player[data.pile ? "yes" : "no"], false);

    updateTurn(data.newTurn);
});

socket.on('guessMade', (data) => {
    console.log("Received 'guessMade'");
    console.log(data);
    const player = game.players[data.playerIndex];
    if (data.win) { 
        addLog(`🏆 Player ${data.playerIndex} correctly guessed ${theme.getText(data.guess)} and won!`);
        getElementByUniqueClass("icon" + data.playerIndex).textContent = "⭐";
        game.phase = 2;
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
        addLog(`💔 Player ${data.playerIndex} incorrectly guessed ${theme.getText(data.guess)} and lost a life!`)
    }
    console.log("Player " + data.playerIndex + " has guessed " + data.guesses + " times.")
    if (!data.win) player.guesses = data.guesses; // Don't deduct lives if player has already won
    
    game.turn = data.newTurn;
    if (data.end) game.phase = 2;
    loadGame();
});

socket.on('deactivate', (data) => {
    console.log("Recieved deactivate");
    console.log(data);
    game.players[data.playerIndex].active = false;
    game.turn = data.turn;

    getElementByUniqueClass("icon" + data.playerIndex).textContent = data.reason == "guess" ? "💀" : "🔌";
    if (data.reason == "guess") addLog(`💀 Player ${data.playerIndex} is out.`);
    else addLog(`Player ${data.playerIndex} has left the game.`);

    if (data.playerIndex !== playerIndex) {
        getElementByUniqueClass("hand-pile"+data.playerIndex).style.display = "flex";
        const hand = getElementByUniqueClass("hand"+data.playerIndex);
        generateList(hand, data.hand, false);
    }
    loadGame();
});

function updateTurn(newTurn) {
    game.turn = newTurn;
    document.querySelectorAll(".active-turn").forEach(elem => elem.classList.remove("active-turn"));
    if (game.phase === 0) {
        document.getElementById("turn-display").style.display = "none";
        // Highlight next player's secret during setup phase
        getElementByUniqueClass("secret"+((playerIndex + 1) % game.players.length)).classList.add("active-turn");
    } else if (game.phase === 1) {
        document.getElementById("turn-display").style.display = "inline";
        document.getElementById("turn").textContent = newTurn;
        getElementByUniqueClass("player"+game.turn).classList.add("active-turn");
    } else {
        document.getElementById("turn-display").style.display = "none";
    }
    
}

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
        socket.emit("guess", guess);
    }
}
