const lobbies = {};
const sockets = {};

class Lobby {
    constructor() {
        this.playerSockets = [];
        this.id = this.generateID();
        lobbies[this.id] = this;
        this.game = undefined;
        console.log("Current number of lobbies: " + Object.keys(lobbies).length);//
    }

    // Generate an unused lobbyID (four random letters)
    generateID() {
        const genLetter = () => (Math.floor(Math.random() * 26) + 10).toString(36);

        const mkString = (n) => {
            let str = '';

            for (let i = 0; i < n; i ++) {
                str += genLetter();
            }

            return str.toUpperCase();
        }

        let id;
        while (lobbies[id = mkString(4)] !== undefined);
        return id;
    }

    addPlayer(id) {
        if (!this.game && this.playerSockets.length < 4 && !this.playerSockets.some(p => p == id)) {
            this.playerSockets.push(id);
            return true;
        }

        return false;
    }

    removePlayer(id) {
        this.playerSockets = this.playerSockets.filter(s => s !== id);
    }
}

module.exports = {lobbies, sockets, Lobby}