
const MeccgPlayers = {

    myId: g_sUserId,

    room : "",
    _interval : null,
    usermap : null,

    isChallenger : function(sid)
    {
        return this.myId === sid;
    },

    getChallengerId : function()
    {
        return this.myId;
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
            this.usermap = jMap;
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
            this.onPlayerListReceived();
        }
    },
 
    onPlayerListReceived : function()
    {
        document.body.dispatchEvent(new CustomEvent("meccg-players-updated", { "detail": {
            challengerId : MeccgPlayers.getChallengerId(),
            map : MeccgPlayers.usermap
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
    }
};

const MeccgApi =
{
    _routes: {},
    _socket: null,
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

    send: function (path, message)
    {
        if (typeof message === "undefined")
            message = "";

        try
        {
            if (MeccgApi._socket !== null)
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
        MeccgApi.onConnected();
        MeccgApi.emitRegisterToServer();
    },
    
    onDisconnected : function()
    {
        document.body.dispatchEvent(new CustomEvent("meccg-disconnected", { "detail": true }));
    },

    onAuthenticationSuccess : function()
    {
        const sUser = g_sDisplayName;
        const sUserUUID = g_sUserId;
        const sRoom = g_sRoom;

        MeccgApi.isConnected = true;
        MeccgApi.initSocketPaths();
        MeccgApi.send("/game/rejoin/immediately", { username: sUser, userid : sUserUUID, room: sRoom });
    },

    setupSocketConnection()
    {
        this.isConnected = false;
        this._socket = io(window.location.host, 
        {
            reconnection: false,
            reconnectionDelay: 5000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 4,
            timeout: 4000,
            auth: {
                authorization: g_sApiKey,
                room: g_sRoom,
                userId : g_sUserId
            }
        });

        this._socket.on("connect", () => MeccgApi.isConnected = true);

        this._socket.on("error", MeccgApi.onSocketError.bind(MeccgApi));
        this._socket.on("connect_error", MeccgApi.onSocketError.bind(MeccgApi));

        this._socket.on('/authenticate/success', MeccgApi.onAuthenticationSuccess.bind(MeccgApi));
        this._socket.on('/disconnect/shutdown', MeccgApi.expectShutdown);
        this._socket.on('disconnect', () => 
        {
            if (MeccgApi._ignoreDisconnection)
                MeccgApi.disconnectSocket();
            else
            {
                document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Connection to server lost." }));
                MeccgApi._disconnectInfo.show();
            }

            MeccgApi.onDisconnected();
        });
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

        if (g_sLobbyToken === "")
            document.body.dispatchEvent(new CustomEvent("meccg-clear-ping"));
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
        this._socket.emit("/authenticate", { 
            token: g_sApiKey, 
            room: g_sRoom,
            joined : MeccgApi.getTimeJoined(),
            userId : g_sUserId,
            dispayName : g_sDisplayName,
            player_access_token_once : MeccgApi.getOneTimeAccessToken()
        });
    },
    
    queryEndGame : function()
    {
        new Question("fa-sign-out").onOk(function() {

            MeccgApi.expectDisconnect();
            MeccgApi.send("/game/finalscore", {});

        }).show("Do you want to end this game?", "Let's see the final scorings.", "End this game");
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
document.body.addEventListener("meccg-api-init", () => {
    MeccgPlayers.onDocumentReady();
    MeccgApi.onDocumentReady();
}, false);

document.body.addEventListener("meccg-visitor-addname", MeccgPlayers.visitorAddNameToOpponent.bind(MeccgPlayers), false);