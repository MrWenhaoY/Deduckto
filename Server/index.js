const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const path = require('node:path');
const l = require('./lobby.js');
const g = require('./game.js');

const clientPath = path.join(__dirname, '../Client');
console.log('Serving static from ' + clientPath);

const app = express();
app.use(express.static(clientPath));

const server = http.createServer(app);
const io = socketio(server);
const sockets = io.sockets.sockets; // Maps socketids to sockets

io.on('connection', (socket) => {
    socket.emit('message','You are connected!'); // send a msg to client
    console.log('new connection: ' + socket.id); //

    // Handle Disconnect
    socket.on('disconnect', ()=> {
        console.log(socket.id + " disconnected.");
        const lobby = l.sockets[socket.id];
        if (lobby) {
            l.sockets[socket.id] = undefined;
            lobby.removePlayer(socket.id);
            socket.leave(lobby.id);
            if (lobby.playerSockets.length == 0) {
                // Delete lobby if empty
                delete l.lobbies.game;
                delete l.lobbies[lobby.id];
                console.log("Closed lobby " + lobby.id);
                console.log("Current number of lobbies: " + Object.keys(l.lobbies).length);
            } else {
                const game = lobby.game;
                if (game) {
                    const result = game.deactivate(socket.id);
                    if (result.success) {
                        // Player was active, notify others that player has left
                        result.reason = "disconnect";
                        io.to(lobby.id).emit("deactivate", result);

                        if (game.phase === g.GAMEPHASE.SETUP) {
                            // Attempt to play cards as necessary
                            let result;
                            for (let i = 0; i < 5; i++) {
                                result = game.setup_play(socket.id, i);
                                if (result.success) break;
                            }
                            if (result.success === true && result.phase === g.GAMEPHASE.PLAY) {
                                lobby.playerSockets.forEach(p => {
                                    sockets.get(p)?.emit('beginPlay', game.sanitized(p));
                                });
                            }
                        }
                    }
                } else {
                    io.to(lobby.id).emit("newDisconnect", lobby.playerSockets.length);
                    sockets.get(lobby.playerSockets[0])?.emit('isHost'); // The socket should always exist
                }
            }
        }
        // Otherwise, nothing to do
    });
    
    // socket.on('leave', (room)=> {
    //     console.log(socket.id + " has left room " + room);//
    //     socket.leave(room);
    // });

    // Lobby Events
    socket.on('newGame', () => {
        if (l.sockets[socket.id] === undefined) {
            const lobby = new l.Lobby();
            lobby.addPlayer(socket.id);
            socket.join(lobby.id);
            l.sockets[socket.id] = lobby;
            socket.emit('joinedGame', lobby);
            socket.emit('isHost');
            console.log(socket.id + ' created game: ' + lobby.id);//
        }
    });

    socket.on('joinGame', (code)=> {
        code = String(code);
        if (!code || l.sockets[socket.id] !== undefined) return;

        const lobby = l.lobbies[code.toUpperCase().trim()];
        if (lobby !== undefined && lobby.addPlayer(socket.id)) {
            socket.join(lobby.id);
            l.sockets[socket.id] = lobby;
            socket.emit('joinedGame', lobby);
            socket.to(lobby.id).emit('newJoin', lobby.playerSockets.length);
            console.log(socket.id + ' joined game: ' + lobby.id);//
        }
    });

    socket.on('start', ()=> {
        const lobby = l.sockets[socket.id];
        if (lobby !== undefined && lobby.game === undefined && lobby.playerSockets[0] === socket.id) {
            lobby.game = new g.Game(lobby);

            lobby.playerSockets.forEach(p => sockets.get(p)?.emit('gameStart', lobby.game.sanitized(p)));

            console.log(socket.id + ' started game: ' + lobby.id); //
        }
    });

    // Game events
    socket.on('play', (cardId) => {
        cardId = Number(cardId);
        const lobby = l.sockets[socket.id];
        let game;
        if (lobby !== undefined && (game = lobby.game)) {
            const phase = game.phase;
            if (phase === g.GAMEPHASE.PLAY) {
                result = game.play(socket.id, cardId);
                if (result.success) {
                    console.log(socket.id + " played card " + result.card + " at index " + cardId);
                    socket.emit("cardPlayed", result);
                    delete result.cardDrawn;
                    // To everyone else
                    socket.to(lobby.id).emit('cardPlayed', result);
                } else {
                    console.log(socket.id + " failed to play: " + cardId);
                }
            } else if (phase === g.GAMEPHASE.SETUP) {
                result = game.setup_play(socket.id, cardId);
                if (result.success) {
                    console.log(socket.id + " played (setup) card " + result.card + " at index " + cardId);
                    socket.emit("setupPlayed", cardId);

                    if (result.phase === g.GAMEPHASE.PLAY) {
                        lobby.playerSockets.forEach(p => {
                            sockets.get(p)?.emit('beginPlay', game.sanitized(p));
                        });
                    }
                } else {
                    console.log(socket.id + " failed to play (setup): " + cardId);
                }
            }
            
        }
    });

    socket.on('guess', (guess) => {
        const lobby = l.sockets[socket.id];
        let game;
        if (lobby !== undefined && (game = lobby.game)) {
            const result = game.guess(socket.id, guess);
            if (result.success) {
                console.log(socket.id + " made guess " + guess);
                io.to(lobby.id).emit("guessMade", result);
                if (result.deactivate) {
                    io.to(lobby.id).emit("deactivate", {
                        playerIndex: result.playerIndex, 
                        turn: result.newTurn, 
                        phase: game.phase, 
                        hand: result.hand,
                        reason: "guess"
                    });
                }
                // TODO: Implement game win / game end
            } else {
                console.log(socket.id + " failed to guess: " + guess);
            }
        }
    });
}, 20);

//server stuff
server.on('error',(e)=>{
    console.log('Server error: '+ e);
    server.close();
});

server.listen(3000, ()=>{
    console.log('HI, starting server...');
});