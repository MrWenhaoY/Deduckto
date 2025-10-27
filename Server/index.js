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

    // // Handle Disconnect
    // socket.on('disconnect', ()=> {
    //     console.log(socket.id + " disconnected.");
    //     const lobby = l.sockets[socket.id];
    //     if (lobby) {
    //         l.sockets[socket.id] = undefined;
    //         // If server owner, close the lobby
    //         if(socket.id === lobby.screenSocket) {
    //             // Delete lobby, send signal to players, remove them from the room
    //             io.to(lobby.id).emit("lobby-closed", lobby.id); // Host has left the lobby, players should leave the room
    //             delete l.lobbies.game;
    //             delete l.lobbies[lobby.id];
    //             delete lobby; // Hopefully this won't cause problems
    //         } else {
    //             lobby.playerSockets = lobby.playerSockets.filter(x=>x!==socket.id);
    //             io.to(lobby.id).emit("newDisconnect", lobby.playerSockets.length);
    //         }
    //     }
    //     // Otherwise, nothing to do
    // });
    
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
            console.log(socket.id + ' created game: ' + lobby.id);//
        }
    });

    socket.on('joinGame', (code)=> {
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

    socket.on('start', (data)=> {
        // if (!data) return;
        
        const lobby = l.sockets[socket.id];
        if (lobby !== undefined && lobby.game === undefined) {
            lobby.game = new g.Game(lobby);

            lobby.playerSockets.forEach(p => sockets.get(p)?.emit('gameStart', lobby.game.sanitized(p)));

            console.log(socket.id + ' started game: ' + lobby.id); //
        }
    });

    // Game events
    socket.on('play', (cardId) => {
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

    socket.on('guess', (data) => {
        const lobby = l.sockets[socket.id];
        let game;
        if (lobby !== undefined && (game = lobby.game) && Array.isArray(data)) {
            const guess = data[0];
            const hostage = data[1];
            const result = game.guess(socket.id, guess, hostage);
            if (result.success) {
                console.log(socket.id + " made guess " + guess + " with pile " + hostage);
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
                console.log(socket.id + " failed to guess: " + guess + " with hostage " + hostage);
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