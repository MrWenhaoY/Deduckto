/* Figure out device via button input
 * Display: Button for starting game
 * Player: Shapes (based on accelerometer calculations)
 */
//msgs
const socket = io();
// let type = ''; //screen or player
// const players = []; // Players in the game
// let components = []; // Components in the game
// let ratio = NaN;
let game = undefined;
// let playerIndex = -1;

socket.on('gameCreated', (lobby) => {
    console.log("Lobby: ")
    console.log(lobby);
    // type = 'screen';
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
//             if (c.type == "flag") {
//                 components.push(new Flag(c.x,c.y,c.width,c.height));
//             }
//             else if (c.type == "jackbox") {
//                 let j = new JackBox(c.x, c.y, c.width, c.height);
//                 if (c.isDone) j.turnsLeft = 0;
//                 components.push(j);
//             }
//             else if (c.type == "ball") {
//                 components.push(new Ball(c.x, c.y, c.width, c.height))

//             }
//             else if (c.type == "pump") {
//                 components.push(new Pump(c.x, c.y, c.width, c.height))

//             }
//             else if (c.type == "popper") {
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

// function actPlayer(type) {
//     socket.emit('action',type);
// }

socket.on('gameStart', (gameState) => {
    console.log("Recieved gameState: ");
    console.log(gameState);
    game = gameState;
    // if (type === 'screen') {
    //     Object.values(lobby.game.players).forEach((p, i)=>players.push(new Player(p.x, p.y, p.name, i)));
    document.getElementById('start-menu').style.display = 'none';
        
    // } 
    document.getElementsByClassName('waiting-room')[0].style.display = 'none';
    document.getElementById('game').style.display = 'inline';

    document.getElementById('turn').innerText = game.turn;
    document.getElementById('deck-size').innerText = game.deckSize;
    [0, 1, 2].forEach(i => document.getElementById('guess'+i).max = game.N - 1);
});

socket.on('newDisconnect', (length)=> {
    document.getElementById('num-players').innerText = length;
    document.getElementById('num-players-2').innerText = length;
});

/* Game */
socket.on('cardPlayed', (data) => {
    console.log("Player " + data.playerIndex + " played to pile '" + (data.pile ? "Yes" : "No") + "' card: " + data.card);
    // console.log(data.card);

    const player = game.players[data.playerIndex];
    if (data.playerIndex == game.playerIndex) {
        // Card you played
        player.hand.splice(data.cardIndex, 1);
        if (data.draw) {
            player.hand.push(data.cardDrawn);
            console.log("Drawn card: " + data.cardDrawn);
        }
    }
        
    if (!data.draw) player.handSize--;
    (data.pile ? player.yes : player.no).push(data.card);
    game.turn = data.newTurn;
});

socket.on('guessMade', (data) => {
    console.log("Player " + data.playerIndex + " made guess '" + data.guess + "' and " + (data.win ? "won" : "failed"));
    
    if (data.win) {
        // TODO: Resolve a win
        console.log("Game over. Player " + data.playerIndex + " has won.")
    } else {
        // Guess failed
        // TODO: Implement pile flipping
    }

    const player = game.players[data.playerIndex];
    if (data.playerIndex == game.playerIndex) {
        // TODO: Implement failed guess pile flipping
    }
        
    player.guesses = data.guesses;
    console.log("Player " + data.playerIndex + " has guessed " + data.guesses + " times.")
    game.turn = data.newTurn;
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

function playCard() {
    const index = document.getElementById("playCard-index").value;
    socket.emit("play", index);
    console.log("Playing card " + index);
}

function makeGuess() {
    const guess = [0, 1, 2].map(i => parseInt(document.getElementById('guess'+i).value));
    socket.emit("guess", guess);
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
