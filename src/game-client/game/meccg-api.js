
const MeccgPlayers = {

    myId: g_sUserId,

    room : "",
    _interval : null,
    usermap : null,
    avatarmap: null,
    _isMyTurn: true,
    playerSequenceList : [],

    getUserMap:function()
    {
        return MeccgPlayers.usermap;
    },

    getAvatarMap : function()
    {
        return MeccgPlayers.avatarmap;
    },

    isChallenger : function(sid)
    {
        return this.myId === sid;
    },

    getChallengerId : function()
    {
        return this.myId;
    },

    setMyTurn : function(bIsMyTurn)
    {
        MeccgPlayers._isMyTurn = bIsMyTurn;
    },

    isMyTurn : function()
    {
        return MeccgPlayers._isMyTurn === true;
    },

    visitorAddNameToOpponent: function(e)
    {
        const id = e.detail.id;
        const player = e.detail.player;

        if (id === "" || id === undefined || player === "" || player === undefined || this.usermap[player] === undefined)
            return;

        const elem = document.getElementById(id);
        if (elem !== null)
            elem.setAttribute("title", this.usermap[player]);
    },

    /**
     * Set the user map
     * 
     * @param {Boolean} _bIsMe 
     * @param {Map} jMap 
     */
    setPlayerNames : function(_bIsMe, jMap)
    {
        if (this.usermap === null)
        {
            this.usermap = jMap.names;
            this.avatarmap = jMap.avatars;
            
            if (Array.isArray(jMap.listOrder))
                this.playerSequenceList = jMap.listOrder;

            this.onPlayerListReceived();
        }
    },

    getPlayers()
    {
        return this.usermap;
    },

    getPlayerDisplayName : function(sId)
    {
        if (sId === null || typeof sId === "undefined" || sId === "" || typeof this.usermap[sId] === "undefined")
            return "(unknown)";
        else if (sId === "Game")
            return "Game";
        else
            return this.usermap[sId];
    },

    /**
     * Add a player once the game has already started
     * 
     * @param {JSON} jData 
     * @returns 
     */
    addPlayer : function(_bIsMe, jData)
    {
        if (this.usermap !== null && this.usermap[jData.userid] === undefined)
        {            
            this.usermap[jData.userid] = jData.name;
            this.avatarmap[jData.userid] = jData.avatar;

            if (!this.playerSequenceList.includes(jData.userid))
                this.playerSequenceList.push(jData.userid);

            this.onPlayerListReceived();
        }
    },

    rearrangePlayers : function(_bIsMe, jData)
    {
        const list = jData.list;
        if (Array.isArray(list) && list.length > 0)
            document.body.dispatchEvent(new CustomEvent("meccg-players-reorder", { "detail": list}));
    },

    onPlayerListReceived : function()
    {
        document.body.dispatchEvent(new CustomEvent("meccg-players-updated", { "detail": {
            challengerId : MeccgPlayers.getChallengerId(),
            map : MeccgPlayers.usermap,
            avatars: MeccgPlayers.avatarmap,
            order: MeccgPlayers.playerSequenceList
        }}));
    },

    onChatMessage : function(_bIsMe, jData)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-chat-message", { "detail": {
            name : this.getPlayerDisplayName(jData.userid),
            message : jData.message
        }}));
    },

    onDocumentReady : function()
    {
        MeccgApi.addListener("/game/set-player-names", this.setPlayerNames.bind(this));
        MeccgApi.addListener("/game/player/add", this.addPlayer.bind(this));
        MeccgApi.addListener("/game/chat/message", this.onChatMessage.bind(this));
        MeccgApi.addListener("/game/players/reorder", this.rearrangePlayers.bind(this));
    },

    isMyCard : function(owner)
    {
        return owner && MeccgPlayers.myId === owner;
    }
};

const MeccgApi =
{
    _routes: {},
    _socket: null,
    _reconnecting : false,
    _ignoreDisconnection : false,
    room : "",
    _interval : null,
    usermap : null,
    isConnected : false,
    _disconnectInfo : new PageRefreshInfo(),
    
    isMe : function(sid)
    {
        return MeccgPlayers.isChallenger(sid);
    },
    
    getTimeJoined : function()
    {
        return g_lTimeJoined;
    },

    socketIsConnected : function()
    {
        return this._socket !== null && this._socket.connected;
    },

    send: function (path, message)
    {
        if (typeof message === "undefined")
            message = "";

        try
        {
            if (MeccgApi.socketIsConnected())
                MeccgApi._socket.emit(path, message);
            
            return true;
        }
        catch (error)
        {
            MeccgUtils.logError(error);
        }

        return false;
    },

    expectDisconnect : function()
    {
        MeccgApi._ignoreDisconnection = true;
    },
    
    expectShutdown : function()
    {
        MeccgApi.expectDisconnect();
    },
    
    onQuitGame : function()
    {
        MeccgApi.expectDisconnect();
        MeccgApi._socket.close();
        MeccgApi._socket = null;

        document.body.dispatchEvent(new CustomEvent("meccg-clear-ping"));
    },
    
    disconnect : function()
    {       
        MeccgApi.expectDisconnect();
        setTimeout(() => MeccgApi._socket.emit("/game/quit", {}), 1000);
        setTimeout(MeccgApi.onQuitGame, 5000);
    },
    
    _paths : {
        
    },

    addListener: function (path, callbackFunction)
    {
        if (path !== "")
            MeccgApi._paths[path] = callbackFunction;
    },

    initSocketPaths : function()
    {
        for (let path in MeccgApi._paths)
            MeccgApi.initSocketPath(path);
    },

    
    initSocketPath : function(path)
    {
        this._socket.on(path, (data) =>
        {
            const bIsMe = typeof data.target !== "undefined" && MeccgPlayers.isChallenger(data.target)
            const payload = typeof data.target === "undefined" ? {} : data.payload;

            try
            {
                MeccgApi._paths[path](bIsMe, payload);
            }
            catch(e)
            {
                console.error(path);
                console.error(e);
                MeccgUtils.logError(e);
            }
        });
    },
    
    getOneTimeAccessToken : function()
    {
        let lToken = parseInt(document.getElementById("interface").getAttribute("data-time"));
        document.getElementById("interface").setAttribute("data-time", "0");
        return lToken;
    },
    
    onConnected : function()
    {
        if (!MeccgApi._ignoreDisconnection)
            document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": "Reconnected." }));

        document.body.dispatchEvent(new CustomEvent("meccg-connected", { "detail": true }));
    },

    onReconnected : function()
    {
        /** deprecated */
    },
    
    onDisconnected : function()
    {
        document.body.dispatchEvent(new CustomEvent("meccg-disconnected", { "detail": true }));
    },

    onAuthenticationSuccess : function()
    {
        if (MeccgApi.isConnected)
            return;

        const sUser = g_sDisplayName;
        const sUserUUID = g_sUserId;
        const sRoom = g_sRoom;

        MeccgApi.isConnected = true;
        MeccgApi.send("/game/rejoin/immediately", { username: sUser, userid : sUserUUID, room: sRoom });

        document.body.dispatchEvent(new CustomEvent("meccg-api-ready", { "detail": true }));
    },

    onReconnectionSuccess : function()
    {
        MeccgApi.send("/game/rejoin/reconnected", { userid : g_sUserId, room: g_sRoom });
    },

    setupSocketConnection()
    {
        this.isConnected = false;
        this._socket = io(window.location.host, 
        {
            reconnection: false,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 4000,
            reconnectionAttempts: 5,
            timeout: 2000,
            auth: {
                authorization: g_sApiKey,
                room: g_sRoom,
                userId : g_sUserId,
                joined: g_lTimeJoined,
                username: g_sDisplayName,
                player_access_token_once: MeccgApi.getOneTimeAccessToken()
            }
        });

        MeccgApi.initSocketPaths();

        this._socket.on("connect", () => {
            if (!MeccgApi._reconnecting)
                MeccgApi.onAuthenticationSuccess();
            else
                MeccgApi.onReconnectionSuccess();
        });

        this._socket.on("/game/rejoin/reconnected/success", MeccgApi.onReconnectionCompleted);

        this._socket.on("error", MeccgApi.onSocketError.bind(MeccgApi));
        this._socket.on("connect_error", MeccgApi.onSocketError.bind(MeccgApi));

        this._socket.on('/authenticate/success', MeccgApi.onAuthenticationSuccess.bind(MeccgApi));
        this._socket.on('/disconnect/shutdown', MeccgApi.expectShutdown);
        this._socket.on('disconnect', (reason) => 
        {
            MeccgApi.onDisconnected();

            if (MeccgApi._ignoreDisconnection || reason === "io server disconnect" || reason === "io client disconnect")
            {
                MeccgApi.disconnectSocket();
                return;
            }

            if (typeof reason === "undefined")
                reason = "";

            document.body.dispatchEvent(new CustomEvent("meccg-sfx", { "detail": "notify" }));
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Connection to server lost: " + reason + ". Reconnecting in 1 second" }));
        
            setTimeout(MeccgApi.triggerReconnection.bind(MeccgApi), 1000);
            setTimeout(MeccgApi.verifyReconnected.bind(MeccgApi), 1000 * 10)
        });
    },

    onReconnectionCompleted : function()
    {
        MeccgApi.isConnected = true;
        MeccgApi._disconnectInfo.abort();

        document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": "Reconnected." }));
    },

    triggerReconnection: function()
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": "Reconnecting..." }));
        this._reconnecting = true;
        this._socket.connect();
    },

    verifyReconnected: function()
    {
        if (this.socketIsConnected())
            MeccgApi._disconnectInfo.abort();
        else
            MeccgApi._disconnectInfo.show("");
    },

    onSocketError : function(error)
    {
        console.error(error);
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": error.name + ': ' + error.message }));
    },

    onDocumentReady : function()
    {  
        if (g_sUserId === "" || g_sApiKey === "")
        {
            MeccgUtils.logError("neither user nor token available");
            return;
        }

        setTimeout(MeccgApi.checkIfConnected.bind(MeccgApi), 5000);
      
        this.setupSocketConnection();
   
        this.emitRegisterToServer();

        if (this.getConnectionCount() === 0)
            this.clearLocalStorage();

        if (g_sLobbyToken === "")
            document.body.dispatchEvent(new CustomEvent("meccg-clear-ping"));
    },

    clearLocalStorage: function()
    {
        try
        {
            localStorage.removeItem("meccg_map_settings");

            if (g_sRoom)
                sessionStorage.removeItem("meccg_" + g_sRoom);
        }
        catch (errIgnore)
        {

        }
    },

    getConnectionCount: function()
    {
        try
        {
            const val = document.body.getAttribute("data-connected-count");
            if (val !== null && val !== "")
                return parseInt(val);
        }
        catch (err)
        {
            console.error(err);            
        }

        return 0;
    },

    /**
     * Check if the connection was established and everything was successfully
     * setup.
     * 
     * If not, show "not connected" screen and offer refresh
     */
    checkIfConnected : function()
    {
        if(!this.isConnected || this._socket.connected !== true)
            this._disconnectInfo.show();
    },

    emitRegisterToServer : function()
    {
        /** so do the login */
        this._socket.emit("/authenticate", { });
    },

    forceEndGame : function()
    {
        MeccgApi.expectDisconnect();
        MeccgApi.send("/game/finalscore", {});
    },
    
    queryEndGame : function()
    {
        new Question("fa-sign-out").onOk(MeccgApi.forceEndGame).show("Do you want to end this game?", "Let's see the final scorings.", "End this game");
    },

    disconnectSocket : function()
    {
        try
        {
            this._socket.disconnect();
        }
        catch (err)
        {
            console.error(err);
        }
    }
};

document.body.addEventListener("meccg-query-end-game", MeccgApi.queryEndGame.bind(MeccgApi), false);
document.body.addEventListener("meccg-foce-end-game", MeccgApi.forceEndGame.bind(MeccgApi), false);
document.body.addEventListener("meccg-api-init", () => {
    MeccgPlayers.onDocumentReady();
    MeccgApi.onDocumentReady();
}, false);

document.body.addEventListener("meccg-visitor-addname", MeccgPlayers.visitorAddNameToOpponent.bind(MeccgPlayers), false);