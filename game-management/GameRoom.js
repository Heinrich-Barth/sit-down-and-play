const UTILS = require("../meccg-utils");
const Player = require("./Player");
const Visitor = require("./Visitor");
const PlayboardManager = require("./PlayboardManager");
const PlayboardManagerArda = require("./PlayboardManagerArda");
const Chat = require("./Chat.js");
const GameAPI = require("./GameAPI");

const GameStandard = require("./GameStandard");
const GameArda = require("./GameArda");
const USE_GAME_LOG = process.env.GAMELOGS === undefined || isNaN(process.env.GAMELOGS) ? 0 : parseInt(process.env.GAMELOGS);

const Logger = require("../Logger");

class GameRoom 
{
    constructor(io, room, fnEndGame)
    {
        this.secret = UTILS.createSecret();
        this.lobbyToken = UTILS.createSecret();
        this.game = null;
        this.api = new GameAPI(io, room);
        this.chat = new Chat(this.api, "/game/chat/message", room, USE_GAME_LOG === true);
        this.players = {};
        this.visitors = {};
        this.name = room;
        this.fnEndGame = fnEndGame;
        this.reconnectionCounts = {};
        this.socialMedia = false;
        this.allowAccessPlayer = true;
        this.allowAccessVisitor = true;
        this.useDCEbyDefault = true;
        this.jitsi = false;
    }

    setUseDCE(bUse)
    {
        this.useDCEbyDefault = bUse === true;
    }

    setUseJitsi(bUse)
    {
        this.jitsi = bUse;
    }

    useJitsi()
    {
        return this.jitsi;
    }

    useDCE()
    {
        return this.useDCEbyDefault === true;
    }

    getGameLog()
    {
        return this.chat.hasLogData() ? this.chat.getGameLogFile() : "";
    }

    updateAccess(type, allow)
    {
        if (type === "visitor")
            this.allowAccessVisitor = allow === true;
        else if (type === "player")
            this.allowAccessPlayer = allow === true;
    }

    canJoinPlayer()
    {
        return this.allowAccessPlayer;
    }

    canJoinVisitor()
    {
        return this.allowAccessVisitor;
    }

    grantAccess(isPlayer)
    {
        return isPlayer ? this.allowAccessPlayer : this.allowAccessVisitor;
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
        return this.game ===  null ? Date.now() : this.game.getGameCreated();
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

    getVisitorCount()
    {
        return Object.keys(this.visitors).length;
    }

    getVisitorNames()
    {
        let list = [];

        for (let id of Object.keys(this.visitors))
            list.push(this.visitors[id].getName());

        return list;
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

    destroy(finalScores)
    {   
        for (let id in this.players)
            this.players[id].disconnect();

        for (let id of Object.keys(this.visitors))
            this.visitors[id].disconnect();

        this.chat.appendLogFinalScore(finalScores);
        this.chat.saveGameLog();

        this.players = {};
        this.visitors = {};
    }

    sendMessage(userid, message)
    {
        this.chat.sendMessage(userid, message.trim(), false)
    }

    reply(sPath, socket, data)
    {
        this.api.reply(sPath, socket, data);
    }

    publish(sPath, player, data)
    {
        this.api.publish(sPath, player, data);
    }

    isAccepted(userId) 
    {
        if (userId === undefined || userId === "")
            return null;
        else if (this.players[userId] !== undefined || this.visitors[userId] !== undefined)
            return true;
        else
            return null;
    }

    removeVisitor(userid)
    {
        const elem = this.visitors[userid];
        if (elem !== undefined)
        {
            elem.disconnect();
            delete this.visitors[userid];
            return true;
        }
        else
            return false;
    }

    addPlayer(userid, displayname, jDeck, isAdmin, timeAdded, avatar)
    {
        const pPlayer = new Player(displayname, jDeck, isAdmin, timeAdded);
        pPlayer.setAvatar(avatar);
        
        this.players[userid] = pPlayer;
        this.chat.addPlayer(userid, displayname);
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
            Logger.error(err);
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
            Logger.error(err);
        }
    }

    getPlayerAvatarsList()
    {
        if (this.game === null)
            return [];
        else
            return this.game.getPlayerAvatarsList();
    }

    #createGame(_MeccgApi, _Chat, isArda, isSinglePlayer, fnEndGame, adminUser)
    {       
        let pPlayboardManager;
        if (isArda)
        {
            pPlayboardManager = new PlayboardManagerArda(isSinglePlayer);
            this.game = new GameArda(_MeccgApi, _Chat, pPlayboardManager, fnEndGame);
        }
        else
        {
            pPlayboardManager = new PlayboardManager(isSinglePlayer);
            this.game = new GameStandard(_MeccgApi, _Chat, pPlayboardManager, fnEndGame);
        }

        pPlayboardManager.triggerEventSetupNewGame();
    
        this.game.setSinglePlayer(isSinglePlayer);
        this.game.setCallbackOnRestoreError(fnEndGame);
        this.game.init();
        this.game.onAfterInit();
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

    static newGame(io, room, isArda, isSinglePlayer, fnEndGame, adminUser)
    {
        if (isSinglePlayer)
            Logger.info("Setting up single player game " + room);
        else if (isArda)
            Logger.info("Setting up arda game " + room);
        else
            Logger.info("Setting up game " + room);

        const pRoomInstance = new GameRoom(io, room, fnEndGame);
        pRoomInstance.#createGame(pRoomInstance.api, pRoomInstance.chat, isArda, isSinglePlayer, pRoomInstance.endGame.bind(pRoomInstance), adminUser);
        return pRoomInstance;
    }
}

module.exports = GameRoom;