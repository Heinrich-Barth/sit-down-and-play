


const MeccgApi =
{
    _routes: {},
    _socket: null,
    _ignoreDisconnection : false,
    myId: "",
    room : "",
    myDisplayName : "",
    _interval : null,
    usermap : null,
    
    isMe : function(sid)
    {
        return this.myId === sid;
    },
    
    isConnected : function()
    {
        return this.connected;
    },

    
    getApiKey : function()
    {
        return g_sApiKey;
    },

    getTimeJoined : function()
    {
        return g_lTimeJoined;
    },

    getRoom : function()
    {
        return g_sRoom;
    },

    getUserId : function()
    {
        return g_sUserId;
    },
    
    getDisplayName : function()
    {
        return g_sDisplayName;
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
            console.log(error);
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
        setTimeout(function()
        {
            MeccgApi._socket.emit("/game/quit", {});
        }, 1000);
        
        setTimeout(MeccgApi.onQuitGame, 5000);
    },
    
    _paths : {
        
    },

    addListener: function (path, callbackFunction)
    {
        MeccgApi._paths[path] = callbackFunction;           
    },
    
    getMyId : function()
    {
        return MeccgApi.myId;
    },
    
    initSocketPath : function(path)
    {
        this._socket.on(path, (data) =>
        {
            let bIsMe = typeof data.target === "undefined" ? false : MeccgApi.myId === data.target;
            let payload = typeof data.target === "undefined" ? {} : data.payload;

            try
            {
                MeccgApi._paths[path](bIsMe, payload);
            }
            catch(e)
            {
                console.log(e);
            }
        });
    },
    
    getUrl : function()
    {
        return window.location.host;
    },

    getOneTimeAccessToken : function()
    {
        let lToken = parseInt(jQuery("#interface").attr("data-time"));
        jQuery("#interface").attr("data-time", "0");
        return lToken;
    },
    
    _callbackReconnect : null,
    _callbackConnected : null,
    
    setOnReconnectAttempt : function(pCallback)
    {
        this._callbackReconnect = pCallback;
    },
    setOnConnected : function(pCallback)
    {
        this._callbackConnected = pCallback;
    },
    
    onConnected : function()
    {
        if (!MeccgApi._ignoreDisconnection)
            document.body.dispatchEvent(new CustomEvent("meccg-notify-success", { "detail": "Reconnected." }));

        if (this._callbackConnected !== null)
            this._callbackConnected();
    },
    
    onDisconnected : function()
    {
        if (this._callbackReconnect !== null)
            this._callbackReconnect();
    },
    
    onDocumentReady : function()
    {
        var sUrl = MeccgApi.getUrl();
        var sUser = MeccgApi.getDisplayName();
        var sUserUUID = MeccgApi.getUserId();
        var sToken = MeccgApi.getApiKey();
        var sRoom = MeccgApi.getRoom();
        var lJoined = MeccgApi.getTimeJoined();
        
        MeccgApi.room = sRoom;
        
        if (sUserUUID === "" || sToken === "")
        {
            console.log("neither user nor token available");
            return;
        }

        this.myId = sUserUUID;
        this.myDisplayName = sUser;
        
        this._socket = io(sUrl);

        this._socket.on('/authenticate/success', (data) => 
        {
            for (var key in MeccgApi._paths)
                MeccgApi.initSocketPath(key);

            MeccgApi.send("/game/rejoin/immediately", { username: sUser, userid : sUserUUID, room: sRoom });
        });

        this._socket.on('disconnect', () => 
        {
            if (!MeccgApi._ignoreDisconnection)
                document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": "Connection to server lost" }));

            MeccgApi.onDisconnected();
        });
        
        /** reconnected entirely */
        this._socket.on('reconnect', () => 
        {
            MeccgApi.onConnected();
        });

        /** reconnecting attempt */
        this._socket.on('reconnecting', (attemptNumber) => 
        {
            MeccgApi.onDisconnected();

            document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": "Attempt to reconnect " + attemptNumber }));
        });
        
        /** so do the login */
        this._socket.emit("/authenticate", { 
            token: sToken, 
            room: sRoom,
            joined : lJoined,
            userId : sUserUUID,
            dispayName : sUser,
            player_access_token_once : MeccgApi.getOneTimeAccessToken()
        });
    },


    getUserName : function(sId)
    {
        if (typeof sId === "undefined" || sId === "" || typeof MeccgApi.usermap[sId] === "undefined")
            return "(unknown)";
        else if (sId === "Game")
            return "Game";
        else
            return MeccgApi.usermap[sId];
    },

    getPlayerNameById : function(sId)
    {
        if (sId === "" || MeccgApi.usermap === null || typeof MeccgApi.usermap[sId] === "undefined")
            return "";
        else
            return MeccgApi.usermap[sId];
    },

    /** Callback to handle player list event */
    onPlayerListReceived : function()
    {
        
    },

    /**
     * Set the user map
     * 
     * @param {Boolean} bIsMe 
     * @param {Map} jMap 
     */
    setUserNames : function(bIsMe, jMap)
    {
        if (MeccgApi.usermap === null)
        {
            MeccgApi.usermap = jMap;
            MeccgApi.onPlayerListReceived(MeccgApi.myId, jMap);
        }
    },

    /**
     * Add a player once the game has already started
     * 
     * @param {JSON} jData 
     * @returns 
     */
    addPlayer : function(bIsMe, jData)
    {
        if (MeccgApi.usermap !== null && MeccgApi.usermap[jData.userid] === undefined)
        {            
            MeccgApi.usermap[jData.userid] = jData.name;
            MeccgApi.onPlayerListReceived(MeccgApi.myId, MeccgApi.usermap);
        }
    },
    
    queryEndGame : function()
    {
        let _question = createQuestionBox(function()
        {
            MeccgApi.expectDisconnect();
            MeccgApi.send("/game/finalscore", {});
        }, 
        "Do you want to end this game?", 
        "Let's see the final scorings.", 
        "End this game", 
        "Cancel",
        "question-question-icon");

        _question.show("");
    }
};

document.body.addEventListener("meccg-query-end-game", MeccgApi.queryEndGame, false);

MeccgApi.addListener("/game/set-player-names", MeccgApi.setUserNames);
MeccgApi.addListener("/game/player/add", MeccgApi.addPlayer);
