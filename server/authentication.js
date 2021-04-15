
module.exports = {
    
    create: function (pUserManager)
    {
        g_pUserManager = pUserManager;

        return {
            triggerAuthenticationProcess : function(socket)
            {
                AuthenticationManagement.triggerAuthenticationProcess(socket);
            }
        }
    }
};

let g_pUserManager = null;

function isAlphaNumeric(sInput)
{
    return typeof sInput !== "undefined" && sInput.trim() !== "" && /^[0-9a-zA-Z]{1,}$/.test(sInput);
}

const AuthenticationManagement = {  

    /**
     * Get the target game room and vaildate it
     * @param {json} data
     * @return {String} target room or the common game room if not set
     */
    getTargetGameRoom : function(room)
    {
        if (room.length > 0 && isAlphaNumeric(room))
            return room;
        else
            return commonRoom;
    },

    triggerAuthenticationProcess: function (socket)
    {
        /**
         * I expect a plain connection which is not in any way authenticated.
         * Authentication works like this:
         *  a) connect
         *  b) receive a plain input
         *  c) reply to connection with /authenticate and send plain input
         *  d) await reply at /authenticate with hased input. 
         *  
         *  If d) is correct, the connection remains intact. It will be destroyed
         *  automatically after 1second after connection
         */
        socket.room = "";
        socket.auth = false;

        /**
         * if the user/application authenticates correctly, we grant permission to send the deck
         * and their username
         * 
         * The user will receive /authenticate/success
         */
        socket.on("/authenticate", (data) =>
        {
            console.log("Authentication request received.");
            if (!g_pUserManager.allowJoin(data.room, data.token, data.userId, data.joined, data.player_access_token_once))
            {
                console.log("Cannot join game.");
                socket.disconnect("Cannot join");
            }
            else 
            {

                socket.auth = true;
                socket.room = data.room;
                socket.username = data.dispayName;
                socket.userid = data.userId;
                socket.room = data.room;
                socket.joined = data.joined;

                console.log(socket.username + " (#" + socket.id + ") " + " authenticated successfully to room " + socket.room);
    
                AuthenticationManagement._addGenericRoutes(socket);
                socket.emit("/authenticate/success", {});
            }
        });
    },

    /**
     * Add generic routes to a socket
     * @param {Object} socket
     * @return {void}
     */
    _addGenericRoutes: function (socket)
    {
        // when the client emits 'new message', this listens and executes
        socket.on("/game/chat/message", (data) => {
            g_pUserManager.onNewMessage(socket, data);
        });
        
        socket.on("/messages/chat", (data) => {
            g_pUserManager.onNewMessageLobby(data);
        });

        socket.on("/game/finalscore", () =>  {
            g_pUserManager.sendFinalScore(socket.room);
        });
        
        socket.on("/game/quit", () => {
            g_pUserManager.leaveGame(socket.userid, socket.room);
            g_pUserManager.endGame(socket.room);
        });

        /**
         * Player enters the table and is ready to
         * receive the board
         */
        socket.on('/game/rejoin/immediately', (data) =>
        {
            if (!g_pUserManager.rejoinAfterBreak(data.userid, data.room, socket))
            {
                socket.auth = false;
                socket.disconnect("cannot rejoin");
            }
        });

        /**
         * Player is now at their table
         */
        socket.on('/game/rejoin', (data) => 
        {
            console.log("# deprectaed /game/rejoin")
            /*
            if (!isAlphaNumeric(data.username))
            {
                console.log("invalid user name tries to connect to a running game.");
                return;
            }

            let room = AuthenticationManagement.getTargetGameRoom(data);

            socket.userid = data.userid;
            socket.username = data.username;
            socket.room = room;

            console.log(data.username + " joined the table " + room);
            */
        });
        
        socket.on('/game/player/isalive', () => { });
        socket.on('/game/player/time', () => { });

    }
};
