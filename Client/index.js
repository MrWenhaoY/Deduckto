// Set default skin
const socket = io();
let skin = undefined;
let game = undefined;
let playerIndex = -1;

socket.on('gameCreated', (lobby) => {
    console.log("Lobby: ")
    console.log(lobby);
    document.getElementById('game-id').innerText = lobby.id;
    document.getElementById('num-players').innerText = 1;
    document.getElementById('num-players-2').innerText = 1;
});

socket.on('newJoin', (length) => {
    console.log('Received length: ' + length);
    document.getElementById('num-players').innerText = length;
    document.getElementById('num-players-2').innerText = length;
});

// socket.on('updateScreen', (game) => {
//     if (type === 'screen') {
//         Object.values(game.players).forEach(p=> {
//             players.forEach(x=> {
//                 if (x.name === p.name) {
//                     x.update(p);
//                 }
//             });
//         });
//         components = [];
//         game.components.forEach(c=> {
//             if (c.type == "popper") {
//                 components.push(new Popper(c.x, c.y, c.width, c.height))
//                 if (c.isDone) 
//                     confetti({
//                         particleCount: 600,
//                         spread: 180
//                     });
//             }
//         });
//     }
// });

socket.on('joinedGame', (lobby) => {
    type = 'player';
    // Show joined game display
    document.getElementsByClassName('player-lobby')[0].style.display='none';
    document.getElementsByClassName('waiting-room')[0].style.display='inline';
    document.getElementById('game-id-2').innerText = lobby.id;
    document.getElementById('num-players-2').innerText = lobby.playerSockets.length;
});

socket.on('lobby-closed', (lobbyId) => {
    socket.emit('leave', lobbyId);
    document.getElementById('game').style.display = 'none';
    document.getElementsByClassName('waiting-room')[0].style.display='none';
    document.getElementsByClassName('center-buttons')[0].style.display='inline';
    alert('Host has left the lobby.');
});

socket.on('gameStart', (gameState) => {
    console.log("Recieved gameState: ");
    console.log(gameState);
    game = gameState;
    playerIndex = game.playerIndex;

    // Load skins
    skin = new SkinLoader("maple", game.N);

    document.getElementById('start-menu').style.display = 'none';
    document.getElementsByClassName('waiting-room')[0].style.display = 'none';
    document.getElementById('game').style.display = 'inline';
    
    // Set up guess
    [0, 1, 2].forEach(i => {
        const guess = document.getElementById('guess'+i);
        for (let j = 0; j < game.N; j++) {
            const option = document.createElement('option');
            option.value = j;
            option.text = skin.getName(i, j);
            guess.appendChild(option);
        }
    });
    
    game.players.forEach((p, i) => {
        const div = document.createElement("div");
        div.id = "player" + i;
        div.className = "player"

        let elem = document.createElement("p");
        let text = document.createTextNode("Player: " + i + " | Guesses: ");
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
        
        elem = document.createElement("p");
        text = document.createTextNode("Yes: "); // And then create a list of no's
        slot = document.createElement("span");
        slot.classList.add("card-list");
        slot.id = "yes" + i;
        elem.appendChild(text);
        elem.appendChild(slot);
        div.appendChild(elem);

        elem = document.createElement("p");
        text = document.createTextNode("No: "); // And then create a list of no's
        slot = document.createElement("span");
        slot.classList.add("card-list");
        slot.id = "no" + i;
        elem.appendChild(text);
        elem.appendChild(slot);
        div.appendChild(elem);

        if (i == playerIndex) {
            // Create hand
            elem = document.createElement("p");
            text = document.createTextNode("Hand: "); // And then create a list of no's
            slot = document.createElement("span");
            slot.classList.add("card-list");
            slot.id = "hand";
            // generateList(slot, p.hand, true);
            elem.appendChild(text);
            elem.appendChild(slot);
            div.appendChild(elem);
        }

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
        elem.innerHTML = skin.parse(card) + " ";
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
    console.log("Player " + data.playerIndex + " made guess '" + data.guess + "' and " + (data.win ? "won" : "failed"));
    
    const player = game.players[data.playerIndex];
    if (data.win) {
        // TODO: Resolve a win
        console.log("Game over. Player " + data.playerIndex + " has won.")
    } else {
        // Guess failed
        if (data.hostage !== undefined) {
            player[data.hostage ? "yes" : "no"].fill(null);
            if (data.playerIndex == game.playerIndex) {
                console.log(data.hostage)
                document.getElementById("hostage").removeChild(document.getElementById("hostage"+data.hostage));
            // TODO: Implement loss on guess #3
            }
        }
        
    }
    console.log("Player " + data.playerIndex + " has guessed " + data.guesses + " times.")
    player.guesses = data.guesses;
    // document.getElementById("guesses"+data.playerIndex).textContent = data.guesses;
    
    game.turn = data.newTurn;
    // document.getElementById("turn").textContent = game.turn;
    loadGame();
});


function showJoin() {
    document.getElementsByClassName('center-buttons')[0].style.display='none';
    document.getElementsByClassName('player-lobby')[0].style.display='inline';
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

// //graphics
// let canvas = document.getElementById('canvas');
// // H: 1075, W: 1920
// // Width of player is about 50 Width, around 150 Height?
// // Lets try W:H to be 2:1 and playerWidth to be 1/20 of the width
// // Currently, we are just using full screen, which means that relative height might vary between computers
// let h = window.innerHeight;
// let w = window.innerWidth;
// ratio = w/2000;
// canvas.height = h;
// canvas.width = w;
// let ctx = canvas.getContext('2d');
// ctx.scale(ratio, ratio);
// ctx.lineWidth = 2;

// setInterval(() => {
//     ctx.fillStyle = 'rgb(200,200,200)';
//     ctx.fillRect(0,0,window.innerWidth/ratio,window.innerHeight/ratio);

//     // Spawn ground while there exists at least one player
//     if (players.length > 0) {
//         let cWidth = ctx.width;
//         ctx.width *= 1.5
//         ctx.beginPath();
//         ctx.moveTo(0, h/ratio - 190);
//         ctx.lineTo(2000, h/ratio - 190);
//         ctx.stroke();
//         ctx.width = cWidth;
//     }

//     players.forEach(p =>{
//         p.updateVerticies();
//         p.draw(ctx);
//     })
//     components.forEach(c => {
//         c.draw(ctx);
//     });
// },20)
