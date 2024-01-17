const GameRoom = require("./GameRoom");
const Logger = require("../Logger");
const Configuration = require("../Configuration");
const EventManager = require("../EventManager");
const Personalisation = require("../Personalisation");

/**
 * Create a new room if necessary
 * @param {String} room 
 * @returns TRUE if the romm has been created, FALSE if it already existed
 */
class RoomManager {

    #eventManager;
    #gamePageHtml;
    #rooms;
    #maxRooms;
    #maxPlayers;
    #roomCountAll;
    #fnSocketIo;
    
    constructor(fnSocketIo, sGameHtmlPageUri)
    {
        this.#gamePageHtml = sGameHtmlPageUri;
        this.#eventManager = EventManager;
        this.#fnSocketIo = fnSocketIo;

        this.#rooms = {};
        this.stats = {
            games : 0,
            players : 0
        };

        this.#maxRooms = Configuration.maxRooms();
        this.#maxPlayers = Configuration.maxPlayersPerRoom();
        this.#roomCountAll = [];
    }

    tooManyRooms()
    {
        return this.#maxRooms > 0 && this.#countRooms() > this.#maxRooms;
    }

    #countRooms()
    {
        return Object.keys(this.#rooms).length;
    }

    tooManyPlayers(room)
    {
        return this.#maxPlayers > 0 && this.countPlayersInRoom(room) > this.#maxPlayers;
    }

    countPlayersInRoom(room)
    {
        const pRoom = this.getRoom(room);
        return pRoom === null ? 0 : pRoom.getPlayerCount();
    }

    getRoom(room)
    {
        if (room !== undefined && room !== "" && room.length <= 50 && this.#rooms[room] !== undefined)
            return this.#rooms[room];
        else
            return null;
    }

    #createRoom(room, userId, displayname, options) 
    {
        const isArda = options.arda;
        const isSinglePlayer = options.singleplayer;
        const useDCE = options.dce;
        const jitsi = options.jitsi;

        if (this.#rooms[room] !== undefined)
            return this.#rooms[room];

        this.#rooms[room] = GameRoom.newGame(this.#fnSocketIo(), room, isArda, isSinglePlayer, this.endGame.bind(this), userId);
        
        if (!useDCE)
            this.#rooms[room].setUseDCE(false);
        if (jitsi)
            this.#rooms[room].setUseJitsi(true);

        if (this.#roomCountAll.length >= 10)
            this.#roomCountAll.shift();

        const gid = this.#rooms[room].getGameUid();

        this.#roomCountAll.push({
            "time": Date.now(),
            "creator": displayname,
            "players": [displayname],
            "duration": 0,
            "arda": isArda,
            "singleplayer": isSinglePlayer,
            "gid": gid
        });
    
        return this.#rooms[room];
    }

    getTappedSites(room, userid)
    {
        if (userid === undefined || userid === "")
        {
            Logger.warn("invalid input.");
            return { };
        }

        const pRoom = this.getRoom(room);
        if (pRoom !== null)
            return pRoom.getGame().getTappedSites(userid);
        else
        {
            Logger.warn("Cannot get tapped sites. room does not exist: " + room);
            return { };
        }
    }

    #getPlayerOrVisitor(room, userid)
    {
        const pRoom = this.getRoom(room);
        if (pRoom === null)
            return null;
        else if (pRoom.hasPlayer(userid))
            return pRoom.getPlayer(userid);
        else if (pRoom.hasVisitor(userid))
            return pRoom.getVisitor(userid);
        else
            return null;
    }

    #updatePlayerToken(room, userid)
    {
        const pPlayer = this.#getPlayerOrVisitor(room, userid);
        if (pPlayer === null)
            return 0;
        
        const lToken = Date.now();
        pPlayer.setAccessToken(lToken);
        return lToken;
    }

    #isValidAccessToken(room, userid, lToken)
    {
        const pPlayer = this.#getPlayerOrVisitor(room, userid);
        if (pPlayer === null || lToken < 1)
            return false;
        else
            return pPlayer.getAccessToken() === lToken;
    }

    #filterPlayerList (room, waitingOnly)
    {
        const pRoom = this.getRoom(room);
        if (pRoom === null)
            return [];

        let list = [];
        let players = pRoom.getPlayers();
        for (let key in players) 
        {
            if (players[key].isWaiting() === waitingOnly)
            {
                list.push({
                    id: key,
                    name: players[key].getName(),
                    time : new Date(players[key].getTimestamp()).toUTCString()
                });
            }
        }

        players = pRoom.getVisitors();
        for (let key in players) 
        {
            if (players[key].isWaiting())
            {
                list.push({
                    id: key,
                    name: "Spectator: " + players[key].getName(),
                    time : new Date(players[key].getTimestamp()).toUTCString()
                });
            }
        }

        return list;
    }

    getPlayerList(room)
    {
        return this.#filterPlayerList(room, false);
    }

    getWaitingList(room) 
    {
        return this.#filterPlayerList(room, true);
    }

    getActiveGame(room)
    {
        if (room === undefined || room === null || room === "" || this.#rooms[room] === undefined)
            return { exists: false };

        const pRoom = this.#rooms[room];
        return {
            exists : true,
            players : pRoom.getPlayers().length,
            share: pRoom.getAllowSocialMedia(),
            allowPlayers: pRoom.canJoinPlayer(),
            allowSpectator: pRoom.canJoinVisitor(),
            avatars: pRoom.getPlayerAvatarsList()
        }
    }

    getSpectators(room)
    {
        if (room === undefined || room === null || room === "" || this.#rooms[room] === undefined)
            return { count: 0, names: [] };

        const list = this.#rooms[room].getVisitorNames();
        return {
            count: list.length,
            names:  list
        };
    }

    getActiveGames()
    {
        let room, userid, pRoom;
        let res = [];
        let jRoom;
        let isValidRoom;
        let pGame;
        for (room in this.#rooms) 
        {
            pRoom = this.#rooms[room];
            isValidRoom = false;
            pGame = pRoom.getGame();

            jRoom = {
                room : room,
                arda : pRoom.getGame().isArda(),
                single: pRoom.getGame().isSinglePlayer(),
                created : new Date(pRoom.getCreated()).toUTCString(),
                time: pRoom.getCreated(),
                visitors: pRoom.canJoinVisitor(),
                jitsi: pRoom.useJitsi(),
                accessible: pRoom.canJoinPlayer(),
                players : [],
                avatars: pRoom.getPlayerAvatarsList()
            }

            for (userid in pRoom.getPlayers())
            {
                isValidRoom |= pRoom.getPlayer(userid).isAdmin();
                jRoom.players.push({
                    name: pRoom.getPlayer(userid).getName(),
                    score: pGame.getPlayerScore(userid)
                });
            }

            if (isValidRoom)
                res.push(jRoom);
        }

        return res;
    }

    sendShutdownSaving()
    {
        if (this.#countRooms() === 0)
            return false;

        for (let room in this.#rooms) 
            this.#rooms[room].sendSaveOnShutdown();

        return true;
    }

    getGameCount()
    {
        if (this.#roomCountAll.length === 0)
            return [];

        const res = [];
        for (let _val of this.#roomCountAll)
        {
            res.push(
            {
                "started": new Date(_val.time).toUTCString(),
                "creator": _val.creator,
                "arda": _val.arda,
                "singleplayer": _val.singleplayer,
                "duration": _val.duration,
                "players": _val.players
            });
        }
        
        return res;
    }

    #getRoomCountGame(gid)
    {
        if (gid === "")
            return null;

        for (let game of this.#roomCountAll)
        {
            if (gid === game.gid)
                return game;
        }

        return null;
    }

    #updateRoomCountScores(game, score)
    {
        if (game === null || score === undefined || score === null)
            return;

        for (let userid in score.players)
        {
            if (!game.players.includes(score.players[userid]))
                game.players.push(score.players[userid]);
        }

        game.players.sort();
    }

    #updateRoomCountAllGameEnd(gid, score)
    {
        const game = this.#getRoomCountGame(gid);
        if (game !== null)
        {
            game.duration = Math.round((Date.now() - game.time) / 1000 / 60);
            this.#updateRoomCountScores(game, score);
        }
    }


    /**
     * Dump all active rooms and players inside
     * 
     * @returns Map
     */
    dump()
    {
        let room, userid, pRoom, _player;
        let res = { };
        let jRoom;
        for (room in this.#rooms) 
        {
            pRoom = this.#rooms[room];

            jRoom = {
                created : new Date(pRoom.getCreated()).toUTCString(),
                players : []
            }

            for (userid in pRoom.getPlayers())
            {
                _player = pRoom.getPlayer(userid);
                jRoom.players.push({
                    name : _player.getName(),
                    id : userid,
                    host : _player.isAdmin(),
                    status : (_player.isWaiting() ? "lobby" : "active"),
                    connected : _player.isConnected(),
                    time : new Date(_player.getTimestamp()).toUTCString()
                });
            }

            res[room] = jRoom;
        }

        return res;
    }
    
    #sendConnectivity(userid, room, connected)
    {
        if (this.#rooms[room] !== undefined)
            this.#rooms[room].publish("/game/player/indicator", "", { userid: userid, connected : connected });
    }

    onReconnected(userid, room)
    {
        this.#sendConnectivity(userid, room, true);
    }

    onDisconnected(userid, room)
    {
        this.#sendConnectivity(userid, room, false);
    }

    #kickDisconnectedPlayers(pRoom)
    {
        let keys = [];
        let players = pRoom.getPlayers();
        for (let key in players) 
        {
            if (!players[key].isConnected()) 
                keys.push(key);
        }

        for (let _key of keys)
            this.#kickPlayer(pRoom, _key);
    }

    #kickDisconnectedSpectators(pRoom)
    {
        let list = [];
        let spectators = pRoom.getVisitors();

        for (let id in spectators) 
        {
            const _player = spectators[id];
            if (!_player.isConnected()) 
            {
                list.push({
                    id: id,
                    name: _player.getName(),
                });
            }
        }

        for (let spectator of list)
        {
            if (pRoom.removeVisitor(spectator.id))
                Logger.info("Specator " + spectator.name + " removed from game.");
        }
    }

    /**
     * Kick all players that are disconnected from the game
     * @param {String} room 
     * @returns 
     */
    #kickDisconnected(room)
    {
        const pRoom = this.getRoom(room);
        if (pRoom === null)
            return false;

        this.#kickDisconnectedPlayers(pRoom);
        this.#kickDisconnectedSpectators(pRoom);

        if (this.#rooms[room].isEmpty())
        {
            delete this.#rooms[room];
            return true;
        }
        else
            return false;
    }

    /**
     * A user has disconnected from the game. Check if this is permanent or
     * only temporarily.
     * 
     * If it is permanent, check to destroy the game entirely.
     * Otherwise simply wait.
     * 
     * @param {String} room 
     */
    checkGameContinuence(room) /* wait one minute to check if a room only has one player */
    {
        setTimeout(() => this.#checkGameContinuence(room), 2000 * 60);
    }

    #checkGameContinuence(room)
    {
        /** remove all players that are not connected anymore */
        const fileLog = this.getGameLog(room);
        const gid = this.#getRoomGuid(room);
        
        if (this.#kickDisconnected(room))
        {
            /** make sure to remove game from events */
            this.#eventManager.trigger("game-remove", room, fileLog);
            Logger.info("Game room " + room + " is empty and was destroyed.");

            this.#updateRoomCountAllGameEnd(gid, null);
        }
    }

    #getRoomGuid(room)
    {
        const pRoom = this.getRoom(room);
        return pRoom === null ? "" : pRoom.getGameUid();
    }

    /**
     * Assume the player had a valid room cookie. Yet, it may be "old" and we
     * have to check that the actual room has the assumed creation time
     * 
     * @param {String} room 
     * @param {Number} userJoined
     * @returns 
     */
    isValidRoomCreationTime(room, userJoined) 
    {
        return this.#rooms[room] !== undefined && this.#rooms[room].getCreated() <= userJoined;
    }

    rejectEntry(room, userId) 
    {
        if (this.#rooms[room] === undefined)
            return;

        const pRoom = this.#rooms[room];
        if (pRoom.players[userId] !== undefined)
            delete pRoom.players[userId];
        else if (pRoom.visitors[userId] !== undefined)
            delete pRoom.visitors[userId];
    }

    /**
     * Remove a player from the game
     * 
     * @param {String} room 
     * @param {String} userId 
     */
    removePlayerFromGame(room, userId) 
    {
        if (this.#rooms[room] === undefined || this.#rooms[room].players[userId] === undefined)
            return;

        if (!this.#rooms[room].players[userId].isAdmin())
        {
            this.#rooms[room].publish("/game/player/remove", "", { userid: userId });
            this.#rooms[room].getGame().removePlayer(userId);
        }
    }


    rejoinAfterReconnect(userid, room, socket) 
    {
        if (this.#rooms[room] === undefined)
        {
            Logger.warn("Room is not available: " + room);
            return false;
        }
        
        const pRoom = this.#rooms[room];
        const isPlayer = pRoom.players[userid] !== undefined;
        const pPlayer = isPlayer ? pRoom.players[userid] : pRoom.visitors[userid];
        if (pPlayer === undefined)
        {
            Logger.warn("Player not available");
            return false;
        }

        pPlayer.reconnect(socket, room);

        pRoom.initGameEndpoint(socket);

        try
        {
            pRoom.reply("/game/rejoin/reconnected/success", socket, {});

            /* draw this player's cards and prepare player's hand */
            pRoom.getGame().startPoolPhaseByPlayer(userid);

            /* draw this player's board and restore the game table */
            pRoom.reply("/game/rejoin/immediately", socket, pRoom.getGame().getCurrentBoard(userid));
            if (isPlayer)
                pRoom.publish("/game/player/indicator", "", { userid: userid, connected: true });

            return true;
        }
        catch (err)
        {
            console.error(err);
            Logger.error(err);
            pRoom.getGame().removePlayer(userid);
        }
        
        return false;
    }

    /**
     * Player rejoined the table
     * 
     * @param {type} id
     * @param {type} socket
     * @return {undefined}
     */
    rejoinAfterBreak(userid, room, socket) 
    {
        if (this.#rooms[room] === undefined)
            return false;
        
        const pRoom = this.#rooms[room];
        const isPlayer = pRoom.players[userid] !== undefined;
        const pPlayer = isPlayer ? pRoom.players[userid] : pRoom.visitors[userid];
        if (pPlayer === undefined)
        {
            Logger.warn("Player is undefined: rejoinAfterBreak");
            return false;
        }

        /* add the player to the board of all other players */
        if (isPlayer)
            pRoom.publish("/game/player/add", "", { userid: userid, name: pPlayer.getName(), avatar: pPlayer.getAvatar() });

        /* now join the game room to receive all "published" messages as well */
        pPlayer.reconnect(socket, room);
        pPlayer.visitor = !isPlayer;

        /* now, acitave endpoints for this player */
        pRoom.initGameEndpoint(socket);

        try
        {
            /* draw this player's cards and prepare player's hand */
            pRoom.getGame().startPoolPhaseByPlayer(userid);

            /* draw this player's board and restore the game table */
            pRoom.reply("/game/rejoin/immediately", socket, pRoom.getGame().getCurrentBoard(userid));
            if (isPlayer)
            {
                pRoom.publish("/game/player/indicator", "", { userid: userid, connected: true });
                pRoom.sendMessage(userid, " joined the game.");
                Logger.info("User " + pPlayer.getName() + " rejoined the game " + room);
            }
            else
            {
                pRoom.sendMessage(userid, pPlayer.getName() + " joined as spectator.");
                Logger.info("Spectator " + pPlayer.getName() + " rejoined the game " + room);
            }

            return true;
        }
        catch (err)
        {
            console.error(err);
            Logger.error(err);
            pRoom.getGame().removePlayer(userid);
        }

        return false;
        
    }

    onNewMessage(socket, message)
    {
        try
        {
            if (this.#rooms[socket.room] !== undefined && message.indexOf("<") === -1 && message.indexOf(">") === -1 && message.trim() !== "")
                this.#rooms[socket.room].sendMessage(socket.userid, message.trim());
        }
        catch (err) 
        {
        }
    }
      
    sendFinalScore(room)
    {
        if (this.#rooms[room] !== undefined)
            this.#rooms[room].publish("/game/score/final", "", this.#rooms[room].getGame().getFinalScore());
    }
        
    
    leaveGame(userid, room)
    {
        if (typeof userid !== "undefined" && typeof room !== "undefined" && this.#rooms[room] !== undefined)
            this.#rooms[room].sendMessage(userid, "has left the game.");
    }

    getGameLog(room)
    {
        const pRoom = this.getRoom(room);
        return pRoom === null ? "" : pRoom.getGameLog();
    }
    
    endGame(room)
    {
        if (this.#rooms === undefined || this.#rooms[room] === undefined)
            return;

        let pRoom = this.#rooms[room];
        const bAllowSocial = pRoom.getAllowSocialMedia();
        const scores = pRoom.getFinalGameScore();

        pRoom.sendMessage("Game", "has ended.");
        pRoom.destroy(scores);

        const logfile = pRoom.getGameLog();

        delete this.#rooms[room];

        if (scores !== undefined && bAllowSocial)
            this.#eventManager.trigger("game-finished", room, scores);

        this.#eventManager.trigger("game-remove", room, logfile);
        Logger.info("Game " + room + " has ended.");

        this.#updateRoomCountAllGameEnd(pRoom.getGameUid(), scores);
    }

    /**
     * Send a notification that a new user has joined the lobby
     * and is waiting for entry permission
     * @param {String} room 
     */
    sendJoinNotification(room)
    {
        if (this.#rooms[room] !== undefined)
            this.#rooms[room].publish("/game/lobby/request", "", {  });
    }

    /**
     * Kick a given user from the room if there had been a previous connection.
     * If so, send the "kicked" info so the user will not try and rejoin automatically.
     * 
     * @param {String} room 
     * @param {String} userid 
     */
    #kickPlayer(pRoom, userid) 
    {
        let pPlayer = pRoom.players[userid];
        if (pPlayer === undefined)
            return false;

        Logger.info(pPlayer.getName() + " removed from game.");

        pPlayer.disconnect();

        delete pRoom.players[userid];
        pRoom.getGame().removePlayer(userid);
        return true;
    }

    allowJoin(room, expectSecret, userId, joined, player_access_token_once) 
    {
        if (room === "" || this.#rooms[room] === undefined || this.#rooms[room].getSecret() !== expectSecret)
            return false;

        const pRoom = this.#rooms[room];
        let bIsPlayer = true;
        if (pRoom.hasPlayer(userId))
        {
            if (pRoom.getPlayer(userId).getTimestamp() !== joined)
                return false;
        } 
        else if (pRoom.hasVisitor(userId))
        {
            bIsPlayer = false;
            if (pRoom.getVisitor(userId).getTimestamp() !== joined)
                return false;
        }
        else
            return false;
            
        if (!this.#isValidAccessToken(room, userId, player_access_token_once))
        {
            Logger.warn("Invalid access token (once)");
            return false;
        }
        else if (bIsPlayer)
        {
            /* add player to game */
            const _player = pRoom.players[userId];
            pRoom.getGame().joinGame(_player, userId);
            pRoom.getPlayer(userId).onJoin();
        }
        else
            pRoom.getVisitor(userId).onJoin();

        return true;
    }

    roomExists(room)
    {
        return room !== undefined && room !== "" && this.#rooms[room] !== undefined;
    }

    setAllowSocialMediaShare(room, bAllow)
    {
        if (room !== undefined && room !== "" && this.#rooms[room] !== undefined)
            this.#rooms[room].setAllowSocialMedia(bAllow);
    }

    getAllowSocialMediaShare(room)
    {
        return room !== undefined && room !== "" 
            && this.#rooms[room] !== undefined
            && this.#rooms[room].getAllowSocialMedia();
    }

    /**
     * Check if the given user is the HOST of this game. 
     * Only the host may reject or admit join rejests
     * 
     * @param {String} room 
     * @param {String} token 
     * @returns {Boolean}
     */
    isGameHost(room, token)
    {
        return this.#rooms[room] !== undefined && this.#rooms[room].getLobbyToken() === token;
    }

    updateAccess(room, type, allow)
    {
        if (room !== "" && this.#rooms[room] !== undefined)
            this.#rooms[room].updateAccess(type, allow);
    }

    grantAccess(room, isPlayer)
    {
        return room !== "" && this.#rooms[room] !== undefined && this.#rooms[room].grantAccess(isPlayer);
    }

    addSpectator (room, userId, displayname) 
    {
        const pRoom = this.#rooms[room];
        if (pRoom === undefined)
            return 0;
            
        const lNow = Date.now();
        pRoom.addSpectator(userId, displayname, lNow);
        return lNow;
    }

    isSinglePlayer(room)
    {
        const pRoom = this.getRoom(room);
        return pRoom?.getGame().isSinglePlayer();
    }

    /**
     * Add Player to waiting room
     * 
     * @param {String} room 
     * @param {String} userId 
     * @param {String} displayname 
     * @param {JSON} jDeck 
     * @param {JSON} roomOptions Room Options
     * @returns Timestamp when joined or -1 on error
     */
    addToLobby(room, userId, displayname, jDeck, roomOptions) 
    {
        const pRoom = this.#createRoom(room, userId, displayname, roomOptions);
        const isFirst = pRoom.isEmpty();

        /** a singleplayer game cannot have other players and a ghost game about to die should not allow new contestants */
        if (!isFirst && (pRoom.getGame().isSinglePlayer() || !this.#gameIsActive(pRoom)))
            return -1;

        if (pRoom.getGame().isArda() && !roomOptions.singleplayer)
            this.#eventManager.trigger("arda-prepare-deck", jDeck, isFirst);

        const lNow = Date.now();
        pRoom.addPlayer(userId, displayname, jDeck, isFirst, lNow, roomOptions.avatar);

        /** timer to check for abandoned games */
        this.checkGameContinuence(room);
        return lNow;
    }

    /**
     * Check if this game room is still active. It might still be in the list for some time but the
     * host not available anymore (maybe just left without actually quitting the game). The session will 
     * expire at some point, but the connection should be lost. Therefore, the game should not be accessible
     * anymore (since it does not make any sense).
     * 
     * @param {Object} pRoom 
     * @returns 
     */
    #gameIsActive(pRoom)
    {
        const userid = pRoom.getGame().getHost();
        const pPlayer = pRoom.getPlayer(userid);
        return pPlayer?.isConnected() === true;
    }

    updateEntryTime(room, userId)
    {
        const pRoom = this.getRoom(room);
        if (pRoom === null)
            return 0;
        else
            return pRoom.updateEntryTime(userId);
    }

    updateDice(room, userId, dice)
    {
        const pRoom = this.getRoom(room);
        if (pRoom !== null)
            pRoom.updateDice(userId, dice);
    }

    loadGamePage(room, userId, username, lTimeJoined, dice) 
    {
        const pRoom = this.getRoom(room);
        if (pRoom === null)
            return "";
            
        const pPlayer = this.#getPlayerOrVisitor(room, userId);
        if (pPlayer === null)
            return "";

        const isVisitor = pRoom.hasVisitor(userId);

        const sSecret = pRoom.getSecret();
        const sToken = this.#updatePlayerToken(room, userId);
        const sLobbyToken = pPlayer.isAdmin() ? pRoom.getLobbyToken() : "";
        const isArda = pRoom.getGame().isArda() ? "true" : "false";
        const isSinglePlayer = pRoom.getGame().isSinglePlayer() ? "true" : "false";
        const tplDice = dice === undefined || dice.indexOf(".") !== -1 ? "" : dice;
        const conCount = pRoom.getConnectionCount(userId);
        const useDCE = pRoom.useDCE() ? "true" : "false";

        return this.#gamePageHtml.replace("{TPL_DISPLAYNAME}", username)
            .replace("{TPL_BACKGROUND}", this.#getRandomBackground())
            .replace("{TPL_TIME}", "" + lTimeJoined)
            .replace("{TPL_ROOM}", room)
            .replace("{TPL_USE_DCE}", useDCE)
            .replace("{TPL_LOBBY_TOKEN}", sLobbyToken)
            .replace("{TPL_USER_ID}", userId)
            .replace("{TPL_DICE}", tplDice)
            .replace("{TPL_API_KEY}", sSecret)
            .replace("{TPL_IS_ARDA}", isArda)
            .replace("{TPL_IS_VISITOR}", isVisitor)
            .replace("{TPL_IS_SINGLEPLAYER}", isSinglePlayer)
            .replace("{TPL_JOINED_TIMESTAMP}", sToken)
            .replace("{TPL_CON_COUNT}", conCount);
    }

    #getRandomBackground()
    {
        const img = Personalisation.getRandomBackground();
        if (img && img !== "")
            return img;
        else
            return "bg-game";
    }

    /**
     * Check if the given player is accepted and can proceed to the game
     * 
     * @param {String} room 
     * @param {String} userId 
     * @returns 
     */
    isAccepted(room, userId) 
    {
        const pRoom = this.getRoom(room);
        if (pRoom === null)
            return null;
        else
            return pRoom.isAccepted(userId);
    }
}

module.exports = RoomManager;