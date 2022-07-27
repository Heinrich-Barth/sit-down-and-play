const fs = require('fs');
const UTILS = require("../meccg-utils");
const ClearCookies = require("./ClearCookies");

class GamePlayRouteHandler 
{
    constructor(pServer, sContext, sPagePlayRoot, sPageLogin, sLobbyPage, g_pAuthentication)
    {
        this.m_pServerInstance = pServer;
        this.contextPlay = sContext + "/";
        this.contextRoot = sContext;
        this.pAuthentication = g_pAuthentication;
        this.startupTime = pServer.startupTime;

        const path = require('path');
        this.pageHome = GamePlayRouteHandler.readFile(path.join(__dirname, "/../pages/"  + sPagePlayRoot));
        this.pageLogin = GamePlayRouteHandler.readFile(path.join(__dirname, "/../pages/" + sPageLogin));
        this.pageLobby = GamePlayRouteHandler.readFile(path.join(__dirname, "/../pages/" + sLobbyPage));
        this.pageWatch = GamePlayRouteHandler.readFile(path.join(__dirname, "/../pages/login-watch.html"));
    }

    static readFile(file)
    {
        try
        {
            return fs.readFileSync(file, 'utf8').trim();
        }
        catch (err)
        {
            console.error(err);
        }

        return "";
    }

    static maxRooms = 5;
    static maxPlayersPerRoom = 10;

    static setMaxPlayers(nRooms, nPlayers)
    {
        if (nRooms > 0)
            GamePlayRouteHandler.maxRooms = nRooms;

        if (nPlayers > 0)
            GamePlayRouteHandler.maxPlayersPerRoom = nPlayers;
    }

    isArda()
    {
        return false;
    }

    isSinglePlayer()
    {
        return false;
    }

    getServerInstance()
    {
        return this.m_pServerInstance;
    }

    createExpireResponse(res, sResponseType)
    {
        this.m_pServerInstance.caching.expires.withResultType(res, sResponseType);
        return res;
    }

    onHome(_req, res)
    {
        this.createExpireResponse(res, "text/html").status(200).send(this.pageHome);
    }

    setupRoutes()
    {
        /**
         * Home
         */
        this.m_pServerInstance.instance.get(this.contextRoot, this.pAuthentication.isSignedInPlay, this.onHome.bind(this));

        /**
         * The LOGIN page.
         * 
         * Here, the user will provide a display name used in the game and
         * also upload their deck.
         * 
         * The page forwards to a login page which will create all cookies.
         */
        this.m_pServerInstance.instance.get(this.contextPlay + ":room/login", this.pAuthentication.isSignedInPlay, this.onLogin.bind(this));
        
        /**
         * Perform the login and set all necessary cookies.
         * 
         * The room will only allow ALPHANUMERIC characters and the display name will also be
         * checked to be alphanumeric only to avoid any HTML injection possibilities.
         * 
         */
         this.m_pServerInstance.instance.post(this.contextPlay + ":room/login/check", this.pAuthentication.isSignedInPlay, this.onLoginCheck.bind(this));

        /**
         * Player enters the lobby to wait until addmitted to the table.
         * 
         * If the player entering this lobby is the first player (or allowed to access the table),
         * the player will be redirected to the game.
         * 
         * If the player does not yet have logged in, redirect to login.
         * Otherwise, simply show the waiting screen
         */
         this.m_pServerInstance.instance.get(this.contextPlay + ":room/lobby", this.pAuthentication.isSignedInPlay, this.onLobby.bind(this));

        /**
         * Get a list of players who are waiting to join this game
         */
         this.m_pServerInstance.instance.get(this.contextPlay + ":room/waiting/:token", this.pAuthentication.isSignedInPlay, this.onWaiting.bind(this));

        /**
         * Allow player to access the table
         */
         this.m_pServerInstance.instance.post(this.contextPlay + ":room/invite/:id/:token", this.pAuthentication.isSignedInPlay, this.onJoinTable.bind(this));

        /**
         * Reject player access to table
         */
         this.m_pServerInstance.instance.post(this.contextPlay + ":room/reject/:id/:token", this.pAuthentication.isSignedInPlay, this.onReqjectEntry.bind(this));

        /**
         * Reject player access to table
         */
         this.m_pServerInstance.instance.post(this.contextPlay + ":room/remove/:id/:token", this.pAuthentication.isSignedInPlay, this.onRemovePlayer.bind(this));

        /**
         * Get the status of a given player (access denied, waiting, addmitted)
         */
        this.m_pServerInstance.instance.get(this.contextPlay + ":room/status/:id", this.pAuthentication.isSignedInPlay, this.onPlayerStatus.bind(this));

        /**
         * Setup spectator
         */
        this.m_pServerInstance.instance.get(this.contextPlay + ":room/watch", this.pAuthentication.isSignedInPlay, this.onWatch.bind(this));


        /**
         * Perform the login and set all necessary cookies.
         * 
         * The room will only allow ALPHANUMERIC characters and the display name will also be
         * checked to be alphanumeric only to avoid any HTML injection possibilities.
         * 
         */
         this.m_pServerInstance.instance.post(this.contextPlay + ":room/watch/check", this.pAuthentication.isSignedInPlay, this.onWatchCheck.bind(this));


        /**
         * Player joins a table.
         * 
         * The room name has to be ALPHANUMERIC. Otherwise, the requets will fail.
         */
         this.m_pServerInstance.instance.get(this.contextPlay + ":room", this.pAuthentication.isSignedInPlay, this.onPlayAtTable.bind(this));
    }

    onLogin(req, res)
    {
        if (!UTILS.isAlphaNumeric(req.params.room))
        {
            res.redirect("/error");
            return;
        }

        /** no cookies available */
        if (req.cookies.userId !== undefined && req.cookies.userId !== null && req.cookies.userId.length === UTILS.uuidLength())
        {
            /* already in the game. redirect to game room */
            const status = this.m_pServerInstance.roomManager.isAccepted(req.params.room, req.cookies.userId)
            if (status !== null && status)
                res.redirect(this.contextPlay + req.params.room);
        }
        else
        {
            this.clearCookies(res);

            const sUser = req.cookies.username === undefined ? "" : this.sanatiseCookieValue(req.cookies.username);
            this.createExpireResponse(res, "text/html").send(this.pageLogin.replace("{DISPLAYNAME}", sUser)).status(200);
        }
    }

    clearCookies(res)
    {
        ClearCookies.clearCookies(res);
    }

    validateDeck(jDeck)
    {
        /**
         * Validate Deck first
         */
        return this.m_pServerInstance.cards.validateDeck(jDeck);
    }

    onWatchCheck(req, res)
    {
        try 
        {
            const room = req.params.room.toLocaleLowerCase();

            if (!UTILS.isAlphaNumeric(room))
                throw new Error("Invalid room name");

            const jData = JSON.parse(req.body.data);
            const displayname = jData.name;

            /**
             * assert the username is alphanumeric only
             */
            if (!UTILS.isAlphaNumeric(displayname))
                throw new Error("Invalid data");

            if (!this.m_pServerInstance.roomManager.roomExists(room))
                throw new Error("Room does not exist");

            const userId = UTILS.generateUuid();

            /** add player to lobby */
            const lNow = this.m_pServerInstance.roomManager.addSpectator(room, userId, displayname);

            /** proceed to lobby */
            const jSecure = { httpOnly: true, secure: true };
            res.cookie('room', room, jSecure);
            res.cookie('username', displayname, jSecure);
            res.cookie('userId', userId, jSecure);
            res.cookie('joined', lNow, jSecure);
            this.createExpireResponse(res, 'text/plain').redirect("/play/" + req.params.room + "/lobby");
        }
        catch (e) 
        {
            console.log(e);
            this.createExpireResponse(res).redirect("/error/login");
        }
    }

    onLoginCheck(req, res)
    {
        try 
        {
            const room = req.params.room.toLocaleLowerCase();

            if (!UTILS.isAlphaNumeric(room))
                throw new Error("Invalid room name");
            else if (this.m_pServerInstance.roomManager.tooManyRooms())
                throw new Error("Too many rooms");
            else if (this.m_pServerInstance.roomManager.tooManyPlayers(room))
                throw new Error("Too many players in room");

            const jData = JSON.parse(req.body.data);
            const displayname = jData.name;

            /**
             * assert the username is alphanumeric only
             */
            if (!UTILS.isAlphaNumeric(displayname) || jData.deck === undefined)
                throw new Error("Invalid data");

            if (GamePlayRouteHandler.maxPlayersPerRoom > 0 && this.m_pServerInstance.roomManager.countPlayersInRoom(room) > GamePlayRouteHandler.maxPlayersPerRoom)
                throw new Error("Too crowded");

            /**
             * Validate Deck first
             */
            const jDeck = this.validateDeck(jData.deck);
            if (jDeck === null)
                throw new Error("Invalid Deck");

            /** Now, check if there already is a game for this Room */
            const userId = UTILS.generateUuid();

            /** add player to lobby */
            const lNow = this.m_pServerInstance.roomManager.addToLobby(room, userId, displayname, jDeck, this.isArda(), this.isSinglePlayer());

            if (lNow === -1)
            {
                this.createExpireResponse(res).redirect("/");
                return;
            }
            
            /** proceed to lobby */
            const jSecure = { httpOnly: true, secure: true };
            res.cookie('room', room, jSecure);
            res.cookie('username', displayname, jSecure);
            res.cookie('userId', userId, jSecure);
            res.cookie('joined', lNow, jSecure);
            this.createExpireResponse(res, 'text/plain').redirect(this.contextPlay + req.params.room);
        }
        catch (e) 
        {
            console.log(e);
            this.createExpireResponse(res).redirect("/error/login");
        }
    }

    onWatch(req, res)
    {
        this.clearCookies(res);
        
        if (!UTILS.isAlphaNumeric(req.params.room) || !this.m_pServerInstance.roomManager.roomExists(req.params.room))
            res.redirect("/error");
        else
            this.createExpireResponse(res, 'text/html').send(this.pageWatch).status(200);
    }

    onLobby(req, res)
    {
        /** assert that all necessary cookies are available and valid at this point  */
        if (!this.validateCookies(res, req)) 
        {
            res.redirect(this.contextPlay + req.params.room + "/login");
        }
        else if (this.m_pServerInstance.roomManager.isAccepted(req.params.room, req.cookies.userId))  /* if player is admin or accepted, simply redirect to game room */
        {
            res.redirect(this.contextPlay + req.params.room);
        }
        else 
        {
            this.m_pServerInstance.roomManager.sendJoinNotification(req.params.room);
            this.createExpireResponse(res, "text/html").send(this.pageLobby.replace("{room}", this.sanatiseCookieValue(req.params.room)).replace("{id}", this.sanatiseCookieValue(req.cookies.userId))).status(200);
        }
    }

    onWaiting(req, res)
    {
        if (this.m_pServerInstance.roomManager.isGameHost(req.params.room, req.params.token))
        {
            let data = {
                waiting: this.m_pServerInstance.roomManager.getWaitingList(req.params.room),
                players : this.m_pServerInstance.roomManager.getPlayerList(req.params.room)
            }

            this.createExpireResponse(res, "application/json").send(data).status(200);
        }
        else
            res.sendStatus(401);
    }

    onJoinTable(req, res)
    {
        if (this.m_pServerInstance.roomManager.isGameHost(req.params.room, req.params.token))
        {
            this.m_pServerInstance.roomManager.inviteWaiting(req.params.room, req.params.id);
            this.createExpireResponse(res).sendStatus(204);
        }
        else
            res.sendStatus(401);
    }

    onReqjectEntry(req, res)
    {
        if (this.m_pServerInstance.roomManager.isGameHost(req.params.room, req.params.token))
        {
            this.m_pServerInstance.roomManager.rejectEntry(req.params.room, req.params.id);
            this.createExpireResponse(res).sendStatus(204);
        }
        else
            res.sendStatus(401);
    }

    onRemovePlayer(req, res)
    {
        if (this.m_pServerInstance.roomManager.isGameHost(req.params.room, req.params.token))
        {
            this.m_pServerInstance.roomManager.removePlayerFromGame(req.params.room, req.params.id);
            this.createExpireResponse(res).sendStatus(204);
        }
        else
            res.sendStatus(401);
    }

    onPlayerStatus(req, res)
    {
        let _obj = {
            status: "denied",
            room: req.params.room
        };

        let status = this.m_pServerInstance.roomManager.isAccepted(req.params.room, req.params.id);
        if (status !== null)
            _obj.status = status ? "ok" : "wait";

        this.createExpireResponse(res, 'application/json').send(_obj).status(200);
    }

    onPlayAtTable(req, res)
    {
        if (!UTILS.isAlphaNumeric(req.params.room))
        {
            res.redirect("/error");
            return;
        }

        /**
         * enforece lowercase room, is always alphanumeric
         */
        const room = req.params.room.toLocaleLowerCase();

        /** 
         * Check if player has never been in this room before.
         * Forward to login page for deck selection and display name
         */
        if (!this.validateCookies(res, req)) 
        {
            res.redirect(this.contextPlay + room + "/login");
            return;
        }

        /**
         * Assert that the user really accepted
         */
        const bForwardToGame = this.m_pServerInstance.roomManager.isAccepted(room, req.cookies.userId);
        if (bForwardToGame === null) 
        {   
            res.redirect(this.contextPlay + room + "/login");
            return;
        }
        else if (!bForwardToGame) 
        {
            res.redirect(this.contextPlay + room + "/lobby");
            return;
        }

        let dice = req.cookies.dice;
        
        /**
         * At this point, the user is allowed to enter the room.
         * 
         * The user may have joined with a second window. In that case, they would have 2 active sessions open.
         */
        let lTimeJoined = this.m_pServerInstance.roomManager.updateEntryTime(room, req.cookies.userId, dice);
        if (lTimeJoined === 0) 
        {
            res.redirect(this.contextPlay + room + "/login");
        }
        else
        {
            /* Force close all existing other sessions of this player */
            res.cookie('joined', lTimeJoined, { httpOnly: true, secure: true });
            this.m_pServerInstance.roomManager.updateDice(room, req.cookies.userId, dice);
            this.createExpireResponse(res, "text/html").send(this.m_pServerInstance.roomManager.loadGamePage(room, this.sanatiseCookieValue(req.cookies.userId), this.sanatiseCookieValue(req.cookies.username), lTimeJoined, dice)).status(200);
        }
    }

    /**
     * Simple cookie value check to avoid some illegal characters that could add 
     * custom code snippets - it basically removes potential string breaking characters
     * such as Quotes, Single Quotes, line break, tabs
     * 
     * @param {String} value 
     * @returns Value or random UUID to avoid any problems
     */
    sanatiseCookieValue(value)
    {
        if (value === undefined ||
            value === null ||
            value.indexOf("\"") !== -1 || 
            value.indexOf("'") !== -1 || 
            value.indexOf("\t") !== -1 || 
            value.indexOf("\n") !== -1)
            return UTILS.generateFlatUuid();
        else
            return value.trim();
    }

    /**
     * Check if all necessary cookies are still valid
     * 
     * @param {Object} res 
     * @param {Object} req 
     * @returns 
     */
    validateCookies(res, req) 
    {
        /** no cookies available */
        if (req.cookies.userId === undefined ||
            req.cookies.room === undefined ||
            req.cookies.joined === undefined)
            return false;

        try
        {
            if (req.cookies.userId.length !== UTILS.uuidLength())
                throw new Error("Invalid player uuid.");
            else if (req.cookies.joined < this.startupTime) 
                throw new Error("Cookie server time is old.");
            else if (!this.m_pServerInstance.roomManager.isValidRoomCreationTime(req.cookies.room, req.cookies.joined))
                throw new Error("Cookie does not match room.");

            return true;
        }
        catch (err)
        {
            console.warn(err.message);
        }

        this.clearCookies(res);
        return false;
    }
}

module.exports = GamePlayRouteHandler;