const DeckChecksum = require("./DeckChecksum");
const Logger = require("../Logger");

class Player
{
    constructor(displayname, jDeck, isAdmin, timeAdded)
    {
        this.name = displayname;
        this.deck = jDeck;
        this.deckChecksum = DeckChecksum.calculateChecksum(jDeck);
        this.admin = isAdmin;
        this.waiting = false;
        this.timestamp = timeAdded;
        this.joined = false;
        this.socket = null;
        this.visitor  = false;
        this.player_access_token_once  = Date.now();
        this.avatar = "";
    }

    getAvatar()
    {
        return this.avatar;
    }

    setAvatar(sAva)
    {
        if (sAva)
            this.avatar = sAva;
    }

    isConnected()
    {
        return this.socket !== null && this.socket.connected === true;
    }

    onJoin()
    {
        this.joined = true;
        this.deck = null; /** the deck is only needed once */
    }

    setAccessToken(lToken)
    {
        this.player_access_token_once = lToken;
    }

    disconnect()
    {
        try
        {
            if (this.socket !== null)
                this.socket.leave(this.socket.room);

            if (this.isConnected())
            {
                this.socket.disconnect(true);
                this.socket = null;
            }
        }
        catch (err)
        {
            Logger.error(err);
        }

    }

    reconnect(socket, room)
    {
        this.disconnect();
        
        this.socket = socket;
        this.socket.join(room);
    }

    getName()
    {
        return this.name;
    }

    getDeck()
    {
        return this.deck;
    }

    isAdmin()
    {
        return this.admin;
    }

    isWaiting()
    {
        return this.waiting;
    }

    setWaiting(b)
    {
        this.waiting = b;
    }

    getTimestamp()
    {
        return this.timestamp;
    }

    setTimestamp(lTime)
    {
        this.timestamp = lTime;
    }

    hasJoined()
    {
        return this.joined;
    }

    getSocket()
    {
        return this.socket;
    }

    isVisitor()
    {
        return this.isVisitor;
    }

    getAccessToken()
    {
        return this.player_access_token_once;
    }

    getDeckChecksum()
    {
        return this.deckChecksum;
    }
}

module.exports = Player;