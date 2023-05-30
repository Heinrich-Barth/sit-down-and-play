

function isAlphaNumeric(sInput)
{
    return typeof sInput !== "undefined" && sInput.trim() !== "" && /^[0-9a-zA-Z]+$/.test(sInput);
}

const AuthenticationManagement = {  

    userManager : null,

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
        AuthenticationManagement._addGenericRoutes(socket);
        socket.on("/authenticate", () => socket.emit("/authenticate/success", {}));
    },

    /**
     * Add generic routes to a socket
     * @param {Object} socket
     * @return {void}
     */
    _addGenericRoutes: function (socket)
    {
        // when the client emits 'new message', this listens and executes
        socket.on("/game/chat/message", (data) => AuthenticationManagement.userManager.onNewMessage(socket, data));
        
        socket.on("/messages/chat", (data) => AuthenticationManagement.userManager.onNewMessageLobby(data));

        socket.on("/game/finalscore", () => AuthenticationManagement.userManager.sendFinalScore(socket.room));
        
        socket.on("/game/quit", () => {
            AuthenticationManagement.userManager.leaveGame(socket.userid, socket.room);
            AuthenticationManagement.userManager.endGame(socket.room);
        });

        /**
         * Player enters the table and is ready to
         * receive the board
         */
        socket.on('/game/rejoin/immediately', (data) =>
        {
            if (!AuthenticationManagement.userManager.rejoinAfterBreak(data.userid, data.room, socket))
            {
                socket.auth = false;
                socket.disconnect("cannot rejoin");
            }
        });

        socket.on("/game/rejoin/reconnected", (data) =>
        {
            if (!AuthenticationManagement.userManager.rejoinAfterReconnect(data.userid, data.room, socket))
            {
                socket.auth = false;
                socket.disconnect("cannot reconnect");
            }
        });

        /**
         * Player is now at their table
         */
        socket.on('/game/rejoin', () => console.log("# deprectaed /game/rejoin"));
    },

    setUserManager : function(pUserManager) {
        AuthenticationManagement.userManager = pUserManager;
    }
};

exports.setUserManager = AuthenticationManagement.setUserManager;
exports.triggerAuthenticationProcess = AuthenticationManagement.triggerAuthenticationProcess;