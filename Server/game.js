
// const lineLineCross = require('./collision.js');
// const players = [];
//const tickables = [];

const FAILURE = {success: false};

// Shuffles an array in place
function shuffle(arr) {
  const len = arr.length;
  for (let i = len - 1; i > 0; i--) {
    const j = Math.floor((i + 1) * Math.random());
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// Returns the number of coordinates in which the cards match 
function match(c1, c2) {
    let sum = 0;
    for (let i = 0; i < 3; i++) {
        sum += c1[i] == c2[i] ? 1 : 0
    }
    return sum;
}

class Game {
    constructor(lobby) {
        this.deck = this.create_deck(7); // Decks start out shuffled
        this.players = [];

        // Assumes there are enough cards to 
        lobby.playerSockets.forEach(p => this.players.push(new Player(p)));
        this.NUM_PLAYERS = this.players.length;

        if (this.deck.length < 6 * this.NUM_PLAYERS) {
            throw new Error(`Deck size ${this.deck.length} insufficent for player count ${this.NUM_PLAYERS}`);
        }

        // Set up player secrets and hands
        this.players.forEach(p => {
            p.secret = this.deck.shift();
            for (let i = 0; i < 5; i++) this.draw(p);
        });

        this.turn = 0;
    }

    // Create a deck where each attribute has n variants
    create_deck(n) {
        if (n < 1) return undefined;
        
        // The method currently used does not generate all possible decks
        const permutation = [];
        for (let i = 0; i < n; i++) permutation.push(i);
        shuffle(permutation);

        const order = permutation.map(x => x);
        shuffle(order);
        
        const deck = [];
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                deck.push([i, j, permutation[(i + order[j]) % n]]);
            }
        }

        shuffle(deck);
        return deck;
    }

    // Attempts to draw a card to that player
    draw(player) {
        if (this.deck.length > 0) {
            player.hand.push(this.deck.shift());
            player.handSize++;
            return true;
        }
        return false;
    }

    play(playerSocket, cardIndex) {
        const playerIndex = this.players.findIndex(p => p.name == playerSocket);
        if (this.turn !== playerIndex) return FAILURE;

        const player = this.players[playerIndex];
        const card = player.hand[cardIndex];
        if (!card) return FAILURE;

        player.hand.splice(cardIndex, 1);
        result = match(card, player.secret);
        (result > 0 ? player.yes : player.no).push(card)

        return {success: true, card: card, pile: result, cardIndex: cardIndex};
    }

    guess(playerSocket, guess) {
        const player = this.players.find(p => p.name == playerSocket);
        if (!player || !Array.isArray(guess) || guess.length !== 3) return FAILURE;

        const result = [0, 1, 2].every(i => player.secret[i] === guess[i]);
        if (result) {
            // Do game end
            return {success: true, win: true, card: player.secret};
        }
        // Bad guess
        player.guesses += 1;
        if (player.guesses >= 3) {
            // Player lost
            
        }
        return {success: true, win: false, guesses: player.guesses};
    }

    // Creates a sanitized gamestate for the specified player
    sanitized(playerSocket) {
        const playerIndex = this.players.findIndex(p => p.name == playerSocket);
        if (!(playerIndex >= 0)) return undefined;

        const gameState = {
            turn: this.turn,
            deckSize: this.deck.length,
            playerIndex: playerIndex,
            players: this.players.map(p => p.sanitized(playerSocket))
        }

        return gameState;
    }
}

class Player {
    constructor(name) {
        this.name = name;
        this.secret = undefined;
        this.hand = [];
        this.handSize = 0;
        this.yes = [];
        this.no = [];
        this.guesses = 0;
    }

    sanitized(name) {
        const playerState = {
            secret: this.secret,
            hand: this.hand,
            handSize: this.handSize,
            yes: this.yes,
            no: this.no,
            guesses: this.guesses
        }
        if (name === this.name) playerState.secret = null;
        else playerState.hand = null;

        return playerState;
    }

    // update(game) {
    //     this.x += this.vx;
    //     //prevent out of bounds
    //     if (this.x < 0 + 60 || this.x > 2000 - 60) {// 60 is approximately half the width of the puppet
    //         this.x -= this.vx;
    //         this.vx = 0;
    //     }
    //     this.vx *= 0.95; // Fiddle with the number as necessary
    //     if (Math.abs(this.vx) < 1) this.vx = 0;
    //     // TODO: Implement gravity for vy
    //     this.y += this.vy;
    //     this.vy += 0.80; // Gravity, fiddle with as necessary
    //     if (this.y >= game.floorHeight - 220 - 200) { // 200 is the height of the ground
    //         this.vy = 0;
    //         this.y = game.floorHeight - 220 - 200; // 210 is the height of the puppet, estimated
    //     }
        
    // }

    // checkCollisions() {
    //     this.game.components.forEach((c) => {
    //         if (c.collide(this)){
    //             this.x -= this.vx;
    //             this.vx = 0;
    //         }
    //     });
    // }
}

module.exports = {Game, Player}