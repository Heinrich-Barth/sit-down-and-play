const UTILS = require("../meccg-utils");
const Player = require("./Player");
const Visitor = require("./Visitor");
const PlayboardManager = require("./PlayboardManager");
const PlayboardManagerArda = require("./PlayboardManagerArda");
const Chat = require("./Chat.js");
const GameAPI = require("./GameAPI");

const GameStandard = require("./GameStandard");
const GameArda = require("./GameArda");

class GameRoom 
{
    constructor(io, room, fnEndGame)
    {
        this.secret = UTILS.createSecret();
        this.lobbyToken = UTILS.createSecret();
        this.created = Date.now();
        this.game = null;
        this.api = new GameAPI(io, room);
        this.chat = new Chat(this.api, "/game/chat/message");
        this.players = {};
        this.visitors = {};
        this.name = room;
        this.fnEndGame = fnEndGame;
        this.reconnectionCounts = {};
        this.socialMedia = false;
    }

    getAllowSocialMedia()
    {
        return this.socialMedia;
    }

    setAllowSocialMedia(bAllow)
    {
        this.socialMedia = bAllow === true;
    }

    getConnectionCount(userid)
    {
        if (userid === undefined || userid === "")
            return 0;
        
        if (this.reconnectionCounts[userid] === undefined)
        {
            this.reconnectionCounts[userid] = 0;
            return 0;
        }
        else
            return  ++this.reconnectionCounts[userid];
    }

    getCreated()
    {
        return this.created;
    }

    getLobbyToken()
    {
        return this.lobbyToken;
    }

    getSecret()
    {
        return this.secret;
    }

    hasPlayer(userId)
    {
        return this.players[userId] !== undefined;
    }

    getPlayers()
    {
        return this.players;
    }

    getVisitors()
    {
        return this.visitors;
    }

    hasVisitor(userId)
    {
        return this.visitors[userId] !== undefined;
    }

    getVisitor(userId)
    {
        return this.visitors[userId];
    }

    getPlayerCount()
    {
        return Object.keys(this.players).length;
    }

    isEmpty()
    {
        return this.getPlayerCount() === 0;
    }

    updateDice(userid, dice)
    {
        const player = this.getPlayer(userid);
        if (player !== null)
            this.game.updateDices(userid, dice);
    }
    
    updateEntryTime(userId)
    {
        const lNow = Date.now();
        if (this.players[userId] !== undefined) 
        {            
            this.players[userId].setTimestamp(lNow);
            return lNow;
        }
        else if (this.visitors[userId] !== undefined) 
        {
            this.visitors[userId].setTimestamp(lNow);
            return lNow;
        }
        else
            return 0;
    }

    getPlayer(userid)
    {
        if (userid === undefined || userid === "" || this.players[userid] === undefined)
            return null;
        else
            return this.players[userid];
    }

    destroy()
    {   
        for (let id in this.players)
            this.players[id].disconnect();

        this.players = {};
        this.visitors = {};
    }

    sendMessage(userid, message)
    {
        this.chat.sendMessage(userid, message.trim())
    }

    reply(sPath, socket, data)
    {
        this.api.reply(sPath, socket, data);
    }

    publish(sPath, player, data)
    {
        this.api.publish(sPath, player, data);
    }

    isEmpty() 
    { 
        return Object.keys(this.players).length === 0; 
    }

    isAccepted(userId) 
    {
        if (userId === undefined || userId === "")
            return null;
        else if (this.players[userId] !== undefined)
            return !this.players[userId].waiting
        else if (this.visitors[userId] !== undefined)
            return !this.visitors[userId].waiting;
        else
            return null;
    }

    addPlayer(userid, displayname, jDeck, isAdmin, timeAdded)
    {
        this.players[userid] = new Player(displayname, jDeck, isAdmin, timeAdded);
    }

    addSpectator(userid, displayname, timeAdded)
    {
        this.visitors[userid] = new Visitor(displayname, timeAdded);
    }

    static disconnectPlayer(socket)
    {
        if (socket === null || socket == undefined || socket.room === undefined || socket.room === "")
            return;
    
        try
        {
            socket.leave(socket.room);
            socket.disconnect(true);
        }
        catch (err)
        {
            console.log(err);
        }
    }

    forceDisconnect(_list)
    {
        if (_list === undefined || _list === null)
            return;

        for (let _id of Object.keys(_list))
        {
            let _player = _list[_id];
            if (_player.socket !== null)
            {
                GameRoom.disconnectPlayer(_player.socket);
                _player.socket = null;
            }
        }
    }

    getFinalGameScore()
    {
        let finalScore = {
            score : this.game.getFinalScore().score,
            players : { }
        };

        for (let userid in this.players)
            finalScore.players[userid] = this.players[userid].getName();

        return finalScore;
    }

    endGame()
    {
        let _list = this.players;
        this.players = {};
        this.forceDisconnect(_list);
        
        _list = this.visitors;
        this.visitors = {};
        this.forceDisconnect(_list);

        try
        {
            if (this.fnEndGame !== null && this.fnEndGame !== undefined)
                this.fnEndGame(this.name);
        }
        catch(err)
        {
            console.error(err);
        }
    }

    createGame(_MeccgApi, _Chat, _agentList, _eventManager, _gameCardProvider, isArda, isSinglePlayer, fnEndGame, adminUser)
    {       
        if (isArda)
        {
            const pPlayboardManager = new PlayboardManagerArda(_agentList, _eventManager, _gameCardProvider, isSinglePlayer);
            this.game = new GameArda(_MeccgApi, _Chat, pPlayboardManager, fnEndGame);
        }
        else
        {
            const pPlayboardManager = new PlayboardManager(_agentList, _eventManager, _gameCardProvider, isSinglePlayer);
            this.game = new GameStandard(_MeccgApi, _Chat, pPlayboardManager, fnEndGame);
        }
    
        this.game.setSinglePlayer(isSinglePlayer);
        this.game.setCallbackOnRestoreError(fnEndGame);
        this.game.init();
        this.game.onAfterInit(_eventManager);
        this.game.setGameAdminUser(adminUser);
    }

    sendSaveOnShutdown()
    {
        let _player;
        for (let userid in this.players)
        {
            _player = this.players[userid];
            if (_player.isAdmin())
            {
                console.log("send savegame to player");
                this.game.publishToPlayers("/game/score/final-only", userid, this.game.getFinalScore());
                this.game.publishToPlayers("/disconnect/shutdown", userid, {});
                this.game.globalSaveGame(userid, _player.getSocket());
                break;
            }
        }
    }

    getGame()
    {
        return this.game;
    }

    initGameEndpoint(socket)
    {
        this.api.initGameEndpoint(socket);
    }

    static newGame(io, room, _agentList, _eventManager, _gameCardProvider, isArda, isSinglePlayer, fnEndGame, adminUser)
    {
        if (isSinglePlayer)
            console.log("Setting up single player game " + room);
        else if (isArda)
            console.log("Setting up arda game " + room);
        else
            console.log("Setting up game " + room);

        const pRoomInstance = new GameRoom(io, room, fnEndGame);
        pRoomInstance.createGame(pRoomInstance.api, pRoomInstance.chat, _agentList, _eventManager, _gameCardProvider, isArda, isSinglePlayer, pRoomInstance.endGame.bind(pRoomInstance), adminUser);
        return pRoomInstance;
    }
}

module.exports = GameRoom;