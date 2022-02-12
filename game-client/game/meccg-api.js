
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

    /**
     * Set the user map
     * 
     * @param {Boolean} bIsMe 
     * @param {Map} jMap 
     */
    setPlayerNames : function(bIsMe, jMap)
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
    addPlayer : function(bIsMe, jData)
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

    onChatMessage : function(bIsMe, jData)
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
    
    isMe : function(sid)
    {
        return MeccgPlayers.isChallenger(sid);
    },
    
    getTimeJoined : function()
    {
        return g_lTimeJoined;
    },

    send: function (path, message, bAwait)
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
    
    onQuitGame : function()
    {
        MeccgApi.expectDisconnect();
        MeccgApi._socket.close();
        MeccgApi._socket = null;
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
                console.log(path);
                console.log(typeof MeccgApi._paths[path]);
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
    
    onDisconnected : function()
    {
        document.body.dispatchEvent(new CustomEvent("meccg-disconnected", { "detail": true }));
    },

    onAuthenticationSuccess : function()
    {
        const sUser = g_sDisplayName;
        const sUserUUID = g_sUserId;
        const sRoom = g_sRoom;

        MeccgApi.initSocketPaths();
        MeccgApi.send("/game/rejoin/immediately", { username: sUser, userid : sUserUUID, room: sRoom });
    },

    onDocumentReady : function()
    {
        const lJoined = MeccgApi.getTimeJoined();
               
        if (g_sUserId === "" || g_sApiKey === "")
        {
            MeccgUtils.logError("neither user nor token available");
            return;
        }
      
        this._socket = io(window.location.host, {
            reconnectionDelay: 500
        });

        this._socket.on('/authenticate/success', MeccgApi.onAuthenticationSuccess);

        this._socket.on('disconnect', () => 
        {
            if (!MeccgApi._ignoreDisconnection)
                document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Connection to server lost" }));

            MeccgApi.onDisconnected();
        });
        
        /** reconnected successfully */
        this._socket.on('reconnect', MeccgApi.onConnected);

        this._socket.io.on("reconnect_attempt", (attemptNumber) => {
            MeccgApi.onDisconnected();
            document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": "Attempt to reconnect " + attemptNumber }));
        });

        /** This is it. Only refresh will help */
        this._socket.io.on("reconnect_error", () => window.location.reload());

        this._socket.io.on("reconnect_failed", () => {
            MeccgApi.onDisconnected();
            document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": "Attempt to reconnect " + attemptNumber }));
        });

        this._socket.io.on("error", (error) => {
            console.error(error);
            document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": error.name + ': ' + error.message }));
        });
          
    
        /** so do the login */
        this._socket.emit("/authenticate", { 
            token: g_sApiKey, 
            room: g_sRoom,
            joined : lJoined,
            userId : g_sUserId,
            dispayName : g_sDisplayName,
            player_access_token_once : MeccgApi.getOneTimeAccessToken()
        });
    },    
    
    queryEndGame : function()
    {
        new Question().onOk(function() {

            MeccgApi.expectDisconnect();
            MeccgApi.send("/game/finalscore", {});

        }).show("Do you want to end this game?", "Let's see the final scorings.", "End this game");
    }
};

document.body.addEventListener("meccg-query-end-game", MeccgApi.queryEndGame, false);
document.body.addEventListener("meccg-api-init", () => {
    MeccgPlayers.onDocumentReady();
    MeccgApi.onDocumentReady();
}, false);
