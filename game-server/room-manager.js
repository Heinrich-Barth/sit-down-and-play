
const fs = require('fs');
const UTILS = require("../meccg-utils");
const Game = require("./index.js");

let fnSocketIo = function() { return null; }

/**
 * Create a new room if necessary
 * @param {String} room 
 * @returns TRUE if the romm has been created, FALSE if it already existed
 */
const _createRoom = function(room) 
{
    if (ROOM_MANAGER._rooms[room] !== undefined)
        return false;
    else
    {
        ROOM_MANAGER._rooms[room] = Game.newGame(fnSocketIo(), room, ROOM_MANAGER.getAgentList(), ROOM_MANAGER._eventManager, ROOM_MANAGER.gameCardProvider);
        return true;
    }
};

/**
 * Create a new player object
 * @param {String} displayname 
 * @param {JSON} jDeck 
 * @param {Boolean} isAdmin 
 * @param {Number} timeAdded 
 * @returns 
 */
const createPlayer = function(displayname, jDeck, isAdmin, timeAdded)
{
    return {
        name: displayname,
        deck: jDeck,
        admin: isAdmin,
        waiting: !isAdmin,
        timestamp: timeAdded,
        joined: false,
        socket: null,
        player_access_token_once : Date.now()
    }
};

const ROOM_MANAGER = {

    _rooms: {},
    gamePageHtml : "",
    _eventManager : null,

    stats : {
        games : 0,
        players : 0
    },

    gameCardProvider : null,

    getAgentList : function() 
    {
        return []; 
    },

    getTappedSites : function(room, userid)
    {
        if (room === undefined || userid === undefined || room === "" || userid === "")
        {
            console.log("invalid input.");
            return { };
        }
        if (ROOM_MANAGER._rooms[room] == undefined)
        {
            console.log("room does not exist: " + room);
            return { };
        }
        else
            return ROOM_MANAGER._rooms[room].game.getTappedSites(userid);
    },

    updatePlayerToken : function(room, userid)
    {
        if (ROOM_MANAGER._rooms[room] == undefined || ROOM_MANAGER._rooms[room].players[userid] === undefined)
            return 0;
            
        let lToken = Date.now();
        ROOM_MANAGER._rooms[room].players[userid].player_access_token_once = lToken;
        return lToken;
    },

    isValidAccessToken : function(room, userid, lToken)
    {
        if (ROOM_MANAGER._rooms[room] == undefined || ROOM_MANAGER._rooms[room].players[userid] === undefined || lToken < 1)
            return false;

        let lRes = ROOM_MANAGER._rooms[room].players[userid].player_access_token_once === lToken;
        ROOM_MANAGER._rooms[room].players[userid].player_access_token_once = 0;
        return lRes;
    },

    filterPlayerList : function (room, waitingOnly)
    {
        if (room === undefined || ROOM_MANAGER._rooms[room] === undefined)
            return [];

        let list = [];
        let players = ROOM_MANAGER._rooms[room].players;
        for (var key in players) 
        {
            if (players[key].waiting === waitingOnly)
            {
                list.push({
                    id: key,
                    name: players[key].name,
                    time : new Date(players[key].timestamp).toUTCString()
                });
            }
        }

        return list;
    },

    getPlayerList: function (room) 
    {
        return this.filterPlayerList(room, false);
    },

    getWaitingList: function (room) 
    {
        return this.filterPlayerList(room, true);
    },

    getActiveGames : function()
    {
        let room, userid, pRoom;
        let res = [];
        let jRoom;
        let isValidRoom;
        for (room in ROOM_MANAGER._rooms) 
        {
            pRoom = ROOM_MANAGER._rooms[room];
            isValidRoom = false;

            jRoom = {
                room : room,
                created : new Date(pRoom.created).toUTCString(),
                players : []
            }

            for (userid in pRoom.players)
            {
                isValidRoom |= pRoom.players[userid].admin;
                jRoom.players.push(pRoom.players[userid].name);
            }

            if (isValidRoom)
                res.push(jRoom);
        }

        return res;
    },

    /**
     * Dump all active rooms and players inside
     * 
     * @returns Map
     */
    dump : function()
    {
        let room, userid, pRoom, _player;
        let res = { };
        let jRoom;
        for (room in ROOM_MANAGER._rooms) 
        {
            pRoom = ROOM_MANAGER._rooms[room];

            jRoom = {
                created : new Date(pRoom.created).toUTCString(),
                players : []
            }

            for (userid in pRoom.players)
            {
                _player = pRoom.players[userid];
                jRoom.players.push({
                    name : _player.name,
                    id : userid,
                    host : _player.admin,
                    status : (_player.waiting ? "lobby" : "active"),
                    connected : _player.socket !== null && _player.socket.connected,
                    time : new Date(_player.timestamp).toUTCString()
                });
            }

            res[room] = jRoom;
        }

        return res;
    },
    
    _sendConnectivity : function(userid, room, connected)
    {
        if (ROOM_MANAGER._rooms[room] !== undefined)
            ROOM_MANAGER._rooms[room].api.publish("/game/player/indicator", "", { userid: userid, connected : connected });
    },

    onReconnected : function(userid, room)
    {
        ROOM_MANAGER._sendConnectivity(userid, room, true);
    },

    onDisconnected : function(userid, room)
    {
        ROOM_MANAGER._sendConnectivity(userid, room, false);
    },

    /**
     * Kick all players that are disconnected from the game
     * @param {String} room 
     * @returns 
     */
    kickDisconnected : function(room)
    {
        if (ROOM_MANAGER._rooms[room] === undefined)
            return false;

        let keys = [];
        let players = ROOM_MANAGER._rooms[room].players;
        for (let key in players) 
        {
            if (players[key].socket === null || !players[key].socket.connected) 
                keys.push(key);
        }

        for (let i = 0; i < keys.length; i++)
        {
            console.log(ROOM_MANAGER._rooms[room].players[keys[i]].name + " removed from game.");
            delete ROOM_MANAGER._rooms[room].players[keys[i]];
        }

        if (Object.keys(ROOM_MANAGER._rooms[room].players).length === 0)
        {
            delete ROOM_MANAGER._rooms[room];
            return true;
        }
        else
            return false;
    },

    /**
     * A user has disconnected from the game. Check if this is permanent or
     * only temporarily.
     * 
     * If it is permanent, check to destroy the game entirely.
     * Otherwise simply wait.
     * 
     * @param {String} room 
     */
    checkGameContinuence : function(room) /* wait one minute to check if a room only has one player */
    {
        setTimeout(function ()
        {
            /** remove all players that are not connected anymore */
            if (ROOM_MANAGER.kickDisconnected(room))
                console.log("Game room " + room + " is empty and was destroyed.");

        }, 2000 * 60);
    },

    /**
     * Assume the player had a valid room cookie. Yet, it may be "old" and we
     * have to check that the actual room has the assumed creation time
     * 
     * @param {String} room 
     * @param {Number} userJoined
     * @returns 
     */
    isValidRoomCreationTime: function (room, userJoined) {
        return ROOM_MANAGER._rooms[room] !== undefined && ROOM_MANAGER._rooms[room].created <= userJoined;
    },

    rejectEntry: function (room, userId) {
        if (ROOM_MANAGER._rooms[room] !== undefined && ROOM_MANAGER._rooms[room].players[userId] !== undefined)
            delete ROOM_MANAGER._rooms[room].players[userId];
    },

    inviteWaiting: function (room, userId) {
        if (ROOM_MANAGER._rooms[room] !== undefined && ROOM_MANAGER._rooms[room].players[userId] !== undefined)
            ROOM_MANAGER._rooms[room].players[userId].waiting = false;
    },

    /**
     * Remove a player from the game
     * 
     * @param {String} room 
     * @param {String} userId 
     */
    removePlayerFromGame : function(room, userId) 
    {
        if (ROOM_MANAGER._rooms[room] === undefined || ROOM_MANAGER._rooms[room].players[userId] === undefined)
            return;

        if (!ROOM_MANAGER._rooms[room].players[userId].admin)
        {
            ROOM_MANAGER._rooms[room].publish("/game/player/remove", "", { userid: userId });
            ROOM_MANAGER._rooms[room].game.removePlayer(userId);
        }
        else
            console.log("will not remove the administrator.");
    },

    /**
     * Player rejoined the table
     * 
     * @param {type} id
     * @param {type} socket
     * @return {undefined}
     */
    rejoinAfterBreak: function (userid, room, socket) 
    {
        if (ROOM_MANAGER._rooms[room] === undefined || ROOM_MANAGER._rooms[room].players[userid] === undefined)
            return false;

        const pRoom = ROOM_MANAGER._rooms[room];
        let pPlayer = ROOM_MANAGER._rooms[room].players[userid];

        /* add the player to the board of all other players */
        pRoom.api.publish("/game/player/add", "", { userid: userid, name: pPlayer.name });

        /* now join the game room to receive all "published" messages as well */
        pPlayer.socket = socket;
        pPlayer.socket.join(room);

        /* now, acitave endpoints for this player */
        pRoom.api.initGameEndpoint(socket);

        /* draw this player's cards and prepare player's hand */
        pRoom.game.inits.startPoolPhaseByPlayer(userid);

        /* draw this player's board and restore the game table */
        pRoom.api.reply("/game/rejoin/immediately", socket, pRoom.game.getCurrentBoard(userid));

        /* notify other players */
        pRoom.chat.sendMessage(userid, " joined the game.");

        /* add indicator */
        pRoom.api.publish("/game/player/indicator", "", { userid: userid, connected: true });

        /** additional game data */
        pRoom.api.reply("/game/data/all", socket, pRoom.game.getPlayboardDataObject());

        console.log("User " + pPlayer.name + " rejoined the game " + room);
        return true;
    },

    onNewMessage : function(socket, message)
    {
        try
        {
            if (ROOM_MANAGER._rooms[socket.room] !== undefined && message.indexOf("<") === -1 && message.indexOf(">") === -1 && message.trim() !== "")
                ROOM_MANAGER._rooms[socket.room].chat.sendMessage(socket.userid, message.trim());
        }
        catch (err) 
        {
        }
    },
      
    sendFinalScore : function(room)
    {
        if (ROOM_MANAGER._rooms[room] !== undefined)
            ROOM_MANAGER._rooms[room].api.publish("/game/score/final", "", ROOM_MANAGER._rooms[room].game.getFinalScore());
    },
        
    
    leaveGame : function(userid, room)
    {
        if (typeof userid !== "undefined" && typeof room !== "undefined" && ROOM_MANAGER._rooms[room] !== undefined)
            ROOM_MANAGER._rooms[room].chat.sendMessage(userid, "has left the game.");
    },
        
    endGame : function(room)
    {
        if (ROOM_MANAGER._rooms[room] === undefined)
            return;

        let pRoom = ROOM_MANAGER._rooms[room];

        pRoom.chat.sendMessage("Game", "has ended.");

        let _list = pRoom.players;
        pRoom.players = [];

        var _player;
        for (var i = 0; i < _list.length; i++)
        {
            _player = _list[i];
            if (_player.socket !== null)
            {
                _player.socket.leave(_player.socket.room,);
                _player.socket.disconnect(true);
                _player.socket = null;
            }
        }

        delete ROOM_MANAGER._rooms[room];
        console.log("Game " + room + " has ended.");
    },

    /**
     * Send a notification that a new user has joined the lobby
     * and is waiting for entry permission
     * @param {String} room 
     */
    sendJoinNotification : function(room)
    {
        if (ROOM_MANAGER._rooms[room] !== undefined)
            ROOM_MANAGER._rooms[room].api.publish("/game/lobby/request", "", {  });
    },

    /**
     * Kick a given user from the room if there had been a previous connection.
     * If so, send the "kicked" info so the user will not try and rejoin automatically.
     * 
     * @param {String} room 
     * @param {String} userid 
     */
    kickPlayer: function (room, userid) 
    {
        if (room === undefined || userid === undefined || ROOM_MANAGER._rooms[room] === undefined || ROOM_MANAGER._rooms[room].players[userid] === undefined)
            return;

        let pPlayer = ROOM_MANAGER._rooms[room].players[userid];
        if (pPlayer.socket !== null) 
        {
            pPlayer.socket.leave(pPlayer.socket.room);
            pPlayer.socket.disconnect(true);
            pPlayer.socket = null;
        }
    },

    allowJoin: function (room, expectSecret, userId, joined, player_access_token_once) {
        if (room === "" || ROOM_MANAGER._rooms[room] === undefined || ROOM_MANAGER._rooms[room].secret !== expectSecret)
            return false;

        if (ROOM_MANAGER._rooms[room].players[userId] === undefined || ROOM_MANAGER._rooms[room].players[userId].timestamp !== joined)
            return false;
            
        if (!ROOM_MANAGER.isValidAccessToken(room, userId, player_access_token_once))
        {
            console.log("Invalid access token (once");
            return false;
        }

        /* add player to game */
        ROOM_MANAGER._rooms[room].game.joinGame(ROOM_MANAGER._rooms[room].players[userId].name, userId, ROOM_MANAGER._rooms[room].players[userId].deck);
        ROOM_MANAGER._rooms[room].players[userId].joined = true;
        ROOM_MANAGER._rooms[room].players[userId].player_access_token_once = 0;
        ROOM_MANAGER._rooms[room].players[userId].deck = null; /** the deck is only needed once */
        return true;
    },

    isTooCrowded: function (room) {
        if (room === "" || ROOM_MANAGER._rooms[room] === undefined)
            return false;
        else 
        {
            console.log("There are " + Object.keys(ROOM_MANAGER._rooms[room].players).length + " in the room already");
            return Object.keys(ROOM_MANAGER._rooms[room].players).length > 10;
        }
    },

    /**
     * Check if the given user is the HOST of this game. 
     * Only the host may reject or admit join rejests
     * 
     * @param {String} room 
     * @param {String} token 
     * @returns {Boolean}
     */
    isGameHost : function(room, token)
    {
        return ROOM_MANAGER._rooms[room] !== undefined && ROOM_MANAGER._rooms[room].lobbyToken === token;
    },

    /**
     * Add Player to waiting room
     * 
     * @param {String} room 
     * @param {String} userId 
     * @param {String} displayname 
     * @param {JSON} jDeck 
     * @returns Timestamp when joined
     */
    addToLobby: function (room, userId, displayname, jDeck) 
    {
        let isFirst = _createRoom(room);
        let lNow = Date.now();
        ROOM_MANAGER._rooms[room].players[userId] = createPlayer(displayname, jDeck, isFirst, lNow);

        return lNow;
    },

    updateEntryTime: function (room, userId) {
        if (ROOM_MANAGER._rooms[room] !== undefined && ROOM_MANAGER._rooms[room].players[userId] !== undefined) {
            let lNow = Date.now();
            ROOM_MANAGER._rooms[room].players[userId].timestamp = lNow;
            return lNow;
        }
        else
        {
            return 0;
        }
            
    },

    loadGamePage: function (room, userId, username, lTimeJoined) {

        if (ROOM_MANAGER._rooms[room] === undefined || ROOM_MANAGER._rooms[room].players[userId] === undefined)
            return "";

        let sSecret = ROOM_MANAGER._rooms[room].secret;
        let sToken = ROOM_MANAGER.updatePlayerToken(room, userId);
        let sLobbyToken = ROOM_MANAGER._rooms[room].players[userId].admin ? ROOM_MANAGER._rooms[room].lobbyToken : "";

        return ROOM_MANAGER.gamePageHtml.replace("{TPL_DISPLAYNAME}", username)
            .replace("{TPL_TIME}", "" + lTimeJoined)
            .replace("{TPL_ROOM}", room)
            .replace("{TPL_LOBBY_TOKEN}", sLobbyToken)
            .replace("{TPL_USER_ID}", userId)
            .replace("{TPL_API_KEY}", sSecret)
            .replace("{TPL_JOINED_TIMESTAMP}", sToken);
    },

    /**
     * Check if the given player is accepted and can proceed to the game
     * 
     * @param {String} room 
     * @param {String} userId 
     * @returns 
     */
    isAccepted: function (room, userId) 
    {
        if (ROOM_MANAGER._rooms[room] === undefined || ROOM_MANAGER._rooms[room].players[userId] === undefined)
            return null;
        else
            return !ROOM_MANAGER._rooms[room].players[userId].waiting
    }
};

exports.create = function (_fnSocketIo, sGameHtmlPageUri, __agentList, _eventManager, __gameCardProvider)
{
    fnSocketIo = _fnSocketIo;
    ROOM_MANAGER.gamePageHtml = sGameHtmlPageUri;
    ROOM_MANAGER._eventManager = _eventManager;
    ROOM_MANAGER.gameCardProvider = __gameCardProvider;
    ROOM_MANAGER.getAgentList = __agentList;
    return ROOM_MANAGER;
};
