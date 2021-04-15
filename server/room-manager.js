
const fs = require('fs');

let HTTP_SERVER = null;

/**
 * Create a new ROOM object
 * 
 * @param {String} room 
 * @param {Object} APIS 
 * @returns 
 */
function _newRoom(room, APIS)
{
    return {
        secret: HTTP_SERVER.createSecret(),
        lobbyToken : HTTP_SERVER.createSecret(),
        created: Date.now(),
        game: APIS.game,
        api: APIS.api,
        chat: APIS.chat,
        players: {},
        name: room
    };
}

/**
 * Create a new room if necessary
 * @param {String} room 
 * @returns TRUE if the romm has been created, FALSE if it already existed
 */
function _createRoom (room) 
{
    if (ROOM_MANAGER._rooms[room] !== undefined)
        return false;

    ROOM_MANAGER._rooms[room] = _newRoom(room, require("./index.js").requestNew(HTTP_SERVER.getSocketId(), room, ROOM_MANAGER.getAgentList()));
    return true;
}

/**
 * Create a new player object
 * @param {String} displayname 
 * @param {JSON} jDeck 
 * @param {Boolean} isAdmin 
 * @param {Number} timeAdded 
 * @returns 
 */
function createPlayer(displayname, jDeck, isAdmin, timeAdded)
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
}

const ROOM_MANAGER = {

    _rooms: {},

    stats : {
        games : 0,
        players : 0
    },

    getAgentList : function() 
    {
        return []; 
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

    getWaitingList: function (room) {
        if (ROOM_MANAGER._rooms[room] === undefined)
            return [];

        let list = [];
        let players = ROOM_MANAGER._rooms[room].players;
        for (var key in players) {
            if (players[key].waiting) {
                list.push({
                    name: players[key].name,
                    id: key
                });
            }
        }

        return list;
    },

    getActiveGames : function()
    {
        let room, userid, pRoom, _player;
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

        let pRoom = ROOM_MANAGER._rooms[room];
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

        console.log("User " + pPlayer.name + " rejoined the game " + room);
        return true;
    },

    onNewMessage : function(socket, message)
    {
        try
        {
            if (ROOM_MANAGER._rooms[socket.room] === undefined || message.indexOf("<") !== -1 || message.indexOf(">") !== -1 || message.trim() === "")
                return;
                
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
    addToLobby: function (room, userId, displayname, jDeck) {
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

    loadGamePage: function (room, userId, username, lTimeJoined, sHtmlCsp, cardImageCDNUrl) {

        if (ROOM_MANAGER._rooms[room] === undefined || ROOM_MANAGER._rooms[room].players[userId] === undefined)
            return "";

        let sSecret = ROOM_MANAGER._rooms[room].secret;
        let sToken = ROOM_MANAGER.updatePlayerToken(room, userId);
        let sHtml = fs.readFileSync(ROOM_MANAGER.__dirname + "/pages/game.html", 'utf8');
        let sLobbyToken = ROOM_MANAGER._rooms[room].players[userId].admin ? ROOM_MANAGER._rooms[room].lobbyToken : "";
        return sHtml.replace("{TPL_DISPLAYNAME}", username)
            .replace("{TPL_TIME}", "" + lTimeJoined)
            .replace("{TPL_ROOM}", room)
            .replace("{TPL_LOBBY_TOKEN}", sLobbyToken)
            .replace("{TPL_USER_ID}", userId)
            .replace("{TPL_API_KEY}", sSecret)
            .replace("{TPL_CSP}", sHtmlCsp)
            .replace("{TPL_CSP_X}", sHtmlCsp)
            .replace("{TPL_JOINED_TIMESTAMP}", sToken)
            .replace("{IMAGE_CDN_URL}", cardImageCDNUrl);
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

module.exports = {

    create: function (_HTTP_SERVER, __dirname, __agentList)
    {
        HTTP_SERVER = _HTTP_SERVER;
        ROOM_MANAGER.__dirname = __dirname;
        ROOM_MANAGER.getAgentList = __agentList;
        return ROOM_MANAGER;
    }
};
