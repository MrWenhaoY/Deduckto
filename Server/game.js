const FAILURE = {success: false};

// Shuffles an array in place
function shuffle(arr) {
    const len = arr.length;
    for (let i = len - 1; i > 0; i--) {
        const j = Math.floor((i + 1) * Math.random());
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

function permutation(n) {
    const permutation = [];
    for (let i = 0; i < n; i++) permutation.push(i);
    shuffle(permutation);
    return permutation
}

function isValidCard(card, n) {
    return Array.isArray(card) && card.length === 3 && card.every(i => (i >= 0) && (i < n) && (i % 1 === 0) && (typeof i === "number"));
}

// Returns the number of coordinates in which the cards match 
function match(c1, c2) {
    let sum = 0;
    for (let i = 0; i < 3; i++) {
        sum += c1[i] == c2[i] ? 1 : 0
    }
    return sum;
}

const GAMEPHASE = {
    SETUP: 0, // Players select a card to give to their neighbor
    PLAY: 1, // Game is in progress
    END: 2 // Game has ended
}

class Game {
    constructor(lobby, N=7) {
        if (!(N >= 1)) throw new Error("Invalid # of attribute variants: " + N);
        this.N = N;
        this.deck = this.create_deck(N); // Decks start out shuffled
        this.turn = 0;
        this.phase = GAMEPHASE.SETUP;

        this.players = [];       
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

        // Skip setup for 1 player games
        /* 1 player games are not defined by official rules.
           Current implementation is to skip the initial card entirely */
        if (this.NUM_PLAYERS === 1) this.phase = GAMEPHASE.PLAY;
    }

    // Create a deck where each attribute has n variants
    create_deck(n) {
        if (n < 1) return undefined;
        
        // The method currently used does not generate all possible decks
        const [perm0, perm1, perm2] = [permutation(n), permutation(n), permutation(n)];
        
        const deck = [];
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                // deck.push([perm2[i], j, perm0[(i + perm1[j]) % n]]);
                deck.push([perm0[i], perm1[j], perm2[(i + j) % n]]);
            }
        }

        shuffle(deck);
        return deck;
    }

    // Attempts to draw a card to that player
    draw(player) {
        if (this.deck.length > 0) {
            const card = this.deck.shift();
            player.hand.push(card);
            player.handSize++;
            return {success: true, card: card};
        }
        return FAILURE;
    }

    // Play a matching card for the next player (index + 1)
    // If you don't have a matching card, play a non-matching card instead
    setup_play(playerSocket, cardIndex) {
        const playerIndex = this.players.findIndex(p => p.name == playerSocket);
        if (playerIndex == -1 || this.phase !== GAMEPHASE.SETUP) return FAILURE;
        
        const player = this.players[playerIndex];
        const card = player.hand[cardIndex];
        const nextPlayer = this.players[(playerIndex + 1) % this.NUM_PLAYERS]
        if (!isValidCard(card, this.N) || nextPlayer.yes.length > 0 || nextPlayer.no.length > 0) return FAILURE;

        // Play the card if valid
        if (match(card, nextPlayer.secret)) {
            nextPlayer.yes.push(card);
        } else {
            nextPlayer.no.push(card);
        }
        player.hand.splice(cardIndex, 1);
        this.draw(player);

        // Progress phase if everyone is ready
        const ready = this.players.every(p => p.yes.length + p.no.length > 0);
        if (ready) this.phase = GAMEPHASE.PLAY;

        return {success: true, phase: this.phase, card: card};
    }

    // Attempt to have the player play a card, by index in their hand 
    play(playerSocket, cardIndex) {
        const playerIndex = this.players.findIndex(p => p.name == playerSocket);
        if (this.turn !== playerIndex || this.phase !== GAMEPHASE.PLAY) return FAILURE;

        const player = this.players[playerIndex];
        const card = player.hand[cardIndex];
        if (!isValidCard(card, this.N)) return FAILURE;

        player.hand.splice(cardIndex, 1);
        const pile = match(card, player.secret);
        player[pile > 0 ? "yes" : "no"].push(card);
        
        // Automatically attempt to draw card and end turn
        const result = this.draw(player);

        this.nextTurn();

        return {
            success: true, 
            card: card, 
            pile: pile, 
            cardIndex: cardIndex, 
            playerIndex: playerIndex,
            draw: result.success,
            cardDrawn: result.card,
            newTurn: this.turn,
            phase: this.phase
        };
    }

    guess(playerSocket, guess) {
        const playerIndex = this.players.findIndex(p => p.name == playerSocket);
        const player = this.players[playerIndex];
        if (this.phase !== GAMEPHASE.PLAY || this.turn !== playerIndex) return FAILURE;
        if (!player || !isValidCard(guess, this.N)) return FAILURE;
        
        player.guesses += 1;

        const result = match(player.secret, guess) === 3;
        if (result) {
            // Do game end
            this.phase = GAMEPHASE.END;
            return {
                success: true, 
                end: true, 
                win: true, 
                guess: guess, 
                guesses: player.guesses, 
                card: player.secret, 
                playerIndex: playerIndex,
                newTurn: this.turn
            };
        }

        this.nextTurn();
        const output = {
            success: true, 
            // end: false,
            win: false, 
            guess: guess, 
            guesses: player.guesses, 
            playerIndex: playerIndex, 
            deactivate: false
            // newTurn: this.turn, 
            // hostage: hostage
        };
        if (player.guesses >= 3) {
            // Player is out of the game
            output.hand = player.hand;
            output.deactivate = true;
            this.deactivate(playerSocket);
        }
        output.end = this.phase == GAMEPHASE.END;
        output.newTurn = this.turn;
        return output;
    }

    // Changes turn to next active player
    nextTurn() {
        for (let i = 1; i < this.players.length; i++) {
            const index = (this.turn + i) % this.NUM_PLAYERS;
            if (this.players[index].active) {
                this.turn = index;
                break;
            }
        }
    }

    // Player leaves game, possibly due to external factors
    deactivate(playerSocket) {
        const playerIndex = this.players.findIndex(p => p.name == playerSocket);
        if (playerIndex < 0) return FAILURE;

        const player = this.players[playerIndex];
        if (!player.active) return FAILURE;
        
        player.active = false;
        // End game if all players are inactive
        if (this.players.every(p => !p.active)) {
            this.phase = GAMEPHASE.END;
        }
        // Change turn if disabled player is current player
        if (this.turn == playerIndex) this.nextTurn();

        return {success: true, playerIndex: playerIndex, turn: this.turn, phase: this.phase, hand: player.hand};
    }

    // Creates a sanitized gamestate for the specified player
    sanitized(playerSocket) {
        const playerIndex = this.players.findIndex(p => p.name == playerSocket);
        if (playerIndex < 0) return null;

        const gameState = {
            N: this.N,
            phase: this.phase,
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
        this.active = true;
    }

    // Creates a sanitized version of self's player state for the argument player
    // Hides secret for self, and hand for others
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
}

module.exports = {Game, Player, GAMEPHASE}