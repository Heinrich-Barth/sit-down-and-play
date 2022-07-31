

class Player
{
    constructor(displayname, jDeck, isAdmin, timeAdded)
    {
        this.name = displayname;
        this.deck = jDeck;
        this.admin = isAdmin;
        this.waiting = !isAdmin;
        this.timestamp = timeAdded;
        this.joined = false;
        this.socket = null;
        this.visitor  = false;
        this.player_access_token_once  = Date.now();
    }

    isConnected()
    {
        return this.socket !== null && this.socket.connected === true;
    }

    onJoin()
    {
        this.joined = true;
        this.player_access_token_once = 0;
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
            console.error(err);
        }

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
}

module.exports = Player;