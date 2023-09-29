const Logger = require("../Logger");
const fs = require('fs');
const UTILS = require("../meccg-utils");

const GamePlayRouteHandlerUtil = require("./GamePlayRouteHandlerUtil");

class GamePlayRouteHandler extends GamePlayRouteHandlerUtil
{
    constructor(pServer, sContext, sPagePlayRoot, sPageLogin, sLobbyPage, g_pAuthentication)
    {
        super(pServer, sContext);

        this.contextPlay = sContext + "/";
        this.contextRoot = sContext;
        this.pAuthentication = g_pAuthentication;

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
            Logger.error(err);
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

    onHome(_req, res)
    {
        this.createExpireResponse(res, "text/html").status(200).send(this.pageHome);
    }

    setupRoutes()
    {
        this.getServerInstance().instance.use(this.contextRoot, this.pAuthentication.isSignedInPlay);

        /**
         * Home
         */
        this.getServerInstance().instance.get(this.contextRoot, this.onHome.bind(this));

        /**
         * Verify game room and add to request object
         */
        this.getServerInstance().instance.use(this.contextPlay + ":room", this.onVerifyGameRoomParam.bind(this));
        
        /**
         * The LOGIN page.
         * 
         * Here, the user will provide a display name used in the game and
         * also upload their deck.
         * 
         * The page forwards to a login page which will create all cookies.
         */
        this.getServerInstance().instance.get(this.contextPlay + ":room/login",
            this.redirectToGameIfMember.bind(this),
            this.gameJoinSupported.bind(this), 
            this.onLogin.bind(this)
        );
        
        /**
         * Perform the login and set all necessary cookies.
         * 
         * The room will only allow ALPHANUMERIC characters and the display name will also be
         * checked to be alphanumeric only to avoid any HTML injection possibilities.
         * 
         */
         this.getServerInstance().instance.post(this.contextPlay + ":room/login/check", 
            this.gameJoinSupported.bind(this), 
            this.onRoomIsTooCrowded.bind(this),
            this.onLoginCheck.bind(this),
            this.redirectToRoom.bind(this)
        );

        /**
         * Player enters the lobby to wait until addmitted to the table.
         * 
         * If the player entering this lobby is the first player (or allowed to access the table),
         * the player will be redirected to the game.
         * 
         * If the player does not yet have logged in, redirect to login.
         * Otherwise, simply show the waiting screen
         */
         this.getServerInstance().instance.get(this.contextPlay + ":room/lobby", this.onValidateGameCookies.bind(this), this.onLobby.bind(this));

        /**
         * Get a list of players who are waiting to join this game
         
         this.getServerInstance().instance.get(this.contextPlay + ":room/waiting/:token", this.onWaiting.bind(this));
        */
        this.getServerInstance().instance.post(this.contextPlay + ":room/invite/:token/:type/:allow", this.onJoinTable.bind(this));

        this.getServerInstance().instance.get(this.contextPlay + ":room/accessibility", this.onSendAccessibility.bind(this));

        /**
         * Allow player to access the table
         *
         this.getServerInstance().instance.post(this.contextPlay + ":room/invite/:id/:token", this.onJoinTable.bind(this));

        /**
         * Reject player access to table
         this.getServerInstance().instance.post(this.contextPlay + ":room/reject/:id/:token", this.onReqjectEntry.bind(this));
         */

        /**
         * Reject player access to table
         */
         this.getServerInstance().instance.post(this.contextPlay + ":room/remove/:id/:token", this.onRemovePlayer.bind(this));

        /**
         * Get the status of a given player (access denied, waiting, addmitted)
         */
        this.getServerInstance().instance.get(this.contextPlay + ":room/status/:id", this.onPlayerStatus.bind(this));

        /**
         * Setup spectator
         */
        this.getServerInstance().instance.get(this.contextPlay + ":room/watch", this.onWatchSupported.bind(this), this.onWatch.bind(this));


        /**
         * Perform the login and set all necessary cookies.
         * 
         * The room will only allow ALPHANUMERIC characters and the display name will also be
         * checked to be alphanumeric only to avoid any HTML injection possibilities.
         * 
         */
         this.getServerInstance().instance.post(this.contextPlay + ":room/watch/check", 
            this.onWatchSupported.bind(this), 
            this.onWatchCheck.bind(this),
            this.redirectToLobby.bind(this)
        );


        /**
         * Player joins a table.
         * 
         * The room name has to be ALPHANUMERIC. Otherwise, the requets will fail.
         */
         this.getServerInstance().instance.get(this.contextPlay + ":room", 
            this.onValidateGameCookies.bind(this), 
            this.onPlayAtTable.bind(this), 
            this.onAfterPlayAtTableSuccessSocial.bind(this),
            this.onAfterPlayAtTableSuccessCreate.bind(this),
            this.onAfterPlayAtTableSuccessJoin.bind(this)
        );
    }

    onLogin(req, res)
    {
        /** no cookies available */
        if (req.cookies.userId !== undefined && req.cookies.userId !== null && req.cookies.userId.length === UTILS.uuidLength())
        {
            /* already in the game. redirect to game room */
            const status = this.getServerInstance().roomManager.isAccepted(req.params.room, req.cookies.userId)
            if (status !== null && status)
            {
                res.redirect(this.contextPlay + req.params.room);
                return;
            }
        }

        const sUser = req.cookies.username === undefined ? "" : this.sanatiseCookieValue(req.cookies.username);

        this.clearCookies(req, res);
        this.createExpireResponse(res, "text/html").send(this.pageLogin.replace("{DISPLAYNAME}", sUser)).status(200);
    }

    validateDeck(jDeck)
    {
        /**
         * Validate Deck first
         */
        return this.getServerInstance().cards.validateDeck(jDeck);
    }

    getAvatar(jDeck)
    {
        if (this.isArda() || this.isSinglePlayer())
            return  "";
        else
            return this.getServerInstance().cards.getAvatar(jDeck);
    }

    redirectToGameIfMember(req, res, next)
    {
        if (this.userIsAlreadyInGame(req))
            this.createExpireResponse(res, 'text/plain').redirect(this.contextPlay + req.room);
        else
            next();
    }

    onWatchSupported(req, res, next)
    {
        if (this.getServerInstance().roomManager.grantAccess(req.room, false))
            next();
        else
            this.createExpireResponse(res).redirect("/error/denied");
    }

    onWatchCheck(req, res, next)
    {
        try 
        {
            const room = req.room;

            const jData = JSON.parse(req.body.data);
            const displayname = jData.name;
            const shareMessage = typeof jData.share === "string" ? jData.share : "";

            /**
             * assert the username is alphanumeric only
             */
            if (!UTILS.isAlphaNumeric(displayname))
                throw new Error("Invalid data");

            if (!this.getServerInstance().roomManager.roomExists(room))
                throw new Error("Room does not exist");

            const userId = this.requireUserId(req);

            /** add player to lobby */
            const lNow = this.getServerInstance().roomManager.addSpectator(room, userId, displayname);

            /** proceed to lobby */
            this.updateCookieUser(res, userId, displayname);

            const jSecure = { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, secure: true };
            res.cookie('room', room, jSecure);
            res.cookie('joined', lNow, jSecure);
            res.cookie('socialMedia', shareMessage, jSecure);

            next();
        }
        catch (e) 
        {
            Logger.error(e);
            this.createExpireResponse(res).redirect("/error/login");
        }
    }

    redirectToLobby(req, res)
    {
        this.createExpireResponse(res, 'text/plain').redirect("/play/" + req.room + "/lobby");
    }

    gameJoinSupported(req, res, next)
    {
        const nPlayers = this.getServerInstance().roomManager.countPlayersInRoom(req.room);
        if (nPlayers < 1)
            next();
        else if (!this.isSinglePlayer() && this.getServerInstance().roomManager.grantAccess(req.room, true))
            next();
        else
            this.createExpireResponse(res).redirect("/error/denied");
    }

    onRoomIsTooCrowded(req, res, next)
    {
        const room = req.room;
        if (this.getServerInstance().roomManager.tooManyRooms() || this.getServerInstance().roomManager.tooManyPlayers(room))
        {
            Logger.info("Too many rooms or too many players in room " + room);
            this.createExpireResponse(res).redirect("/error/login");
            return;
        }
        
        const nPlayers = this.getServerInstance().roomManager.countPlayersInRoom(room);
        if (GamePlayRouteHandler.maxPlayersPerRoom > 0 && nPlayers > GamePlayRouteHandler.maxPlayersPerRoom)
        {
            Logger.info("Too crowded in room " + room);
            this.createExpireResponse(res).redirect("/error/login");
            return;
        }

        next();
    }

    onLoginCheck(req, res, next)
    {
        try 
        {
            const room = req.room;
            const jData = JSON.parse(req.body.data);
            const displayname = jData.name;
            const useDCE = jData.dce === true;
            const useJitsi = jData.jitsi === true;
            const shareMessage = typeof jData.share === "string" ? jData.share : "";

            /**
             * assert the username is alphanumeric only
             */
            if (!UTILS.isAlphaNumeric(displayname) || jData.deck === undefined)
                throw new Error("Invalid data");

            /**
             * Validate Deck first
             */
            const jDeck = this.validateDeck(jData.deck);
            if (jDeck === null)
                throw new Error("Invalid Deck");

            const avatar = this.getAvatar(jData.deck);

            /** Now, check if there already is a game for this Room */
            const userId = this.requireUserId(req);

            const roomOptions = {
                arda: this.isArda(),
                singleplayer: this.isSinglePlayer(),
                dce: useDCE,
                jitsi:  useJitsi,
                avatar: avatar
            };

            /** add player to lobby */
            const lNow = this.getServerInstance().roomManager.addToLobby(room, userId, displayname, jDeck, roomOptions);
            if (lNow === -1)
            {
                /** ghost game */
                this.createExpireResponse(res).redirect("/");
                return;
            }

            /** proceed to lobby */
            this.updateCookieUser(res, userId, displayname);

            const jSecure = { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, secure: true };
            res.cookie('room', room, jSecure);
            res.cookie('joined', lNow, jSecure);
            res.cookie('socialMedia', shareMessage, jSecure);

            next();
        }
        catch (e) 
        {
            Logger.error(e);
            this.createExpireResponse(res).redirect("/error/login");
        }
    }

    redirectToRoom(req, res)
    {
        this.createExpireResponse(res, 'text/plain').redirect(this.contextPlay + req.room);
    }

    hasValidUserId(req)
    {
        if (req.cookies.userId === undefined || req.cookies.userId === null)
            return false;
        else
            return req.cookies.userId.trim().length === UTILS.uuidLength()
    }

    requireUserId(req)
    {
        return this.hasValidUserId(req) ? req.cookies.userId : UTILS.generateUuid();
    }

    updateCookieUser(res, userId, displayName)
    {
        const jSecure = { maxAge: 365 * 60 * 60 * 1000, httpOnly: true, secure: true };
        res.cookie('userId', userId, jSecure);
    
        if (displayName !== undefined && displayName !== "")
            res.cookie('username', displayName.trim(), jSecure);
    }

    onWatch(req, res)
    {
        this.clearCookies(req, res);
        
        if (!this.getServerInstance().roomManager.roomExists(req.room))
            res.redirect("/error/nosuchroom");
        else
            this.createExpireResponse(res, 'text/html').send(this.pageWatch).status(200);
    }

    onLobby(req, res)
    {
        if (this.getServerInstance().roomManager.isAccepted(req.room, req.cookies.userId))  /* if player is admin or accepted, simply redirect to game room */
        {
            res.redirect(this.contextPlay + req.room);
        }
        else 
        {
            this.getServerInstance().roomManager.sendJoinNotification(req.room);
            this.createExpireResponse(res, "text/html").send(this.pageLobby.replace("{room}", this.sanatiseCookieValue(req.room)).replace("{id}", this.sanatiseCookieValue(req.cookies.userId))).status(200);
        }
    }

    onWaiting(req, res)
    {
        if (this.getServerInstance().roomManager.isGameHost(req.params.room, req.params.token))
        {
            let data = {
                waiting: this.getServerInstance().roomManager.getWaitingList(req.params.room),
                players : this.getServerInstance().roomManager.getPlayerList(req.params.room)
            }

            this.createExpireResponse(res, "application/json").send(data).status(200);
        }
        else
            res.sendStatus(401);
    }

    onSendAccessibility(req, res)
    {
        const data = {
            player: this.getServerInstance().roomManager.grantAccess(req.room, true),
            visitor: this.getServerInstance().roomManager.grantAccess(req.room, false)
        } 

        this.createExpireResponse(res, "application/json").send(data).status(200);
    }

    onJoinTable(req, res)
    {
        if (!this.getServerInstance().roomManager.isGameHost(req.params.room, req.params.token))
        {
            res.sendStatus(401);
            return;
        }

        const type = req.params.type;
        if (type === "visitor" || type === "player")
            this.getServerInstance().roomManager.updateAccess(req.params.room, type, req.params.allow === "true");

        this.createExpireResponse(res).sendStatus(204);
    }

    onReqjectEntry(req, res)
    {
        if (this.getServerInstance().roomManager.isGameHost(req.params.room, req.params.token))
        {
            this.getServerInstance().roomManager.rejectEntry(req.params.room, req.params.id);
            this.createExpireResponse(res).sendStatus(204);
        }
        else
            res.sendStatus(401);
    }

    onRemovePlayer(req, res)
    {
        if (this.getServerInstance().roomManager.isGameHost(req.params.room, req.params.token))
        {
            this.getServerInstance().roomManager.removePlayerFromGame(req.params.room, req.params.id);
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

        let status = this.getServerInstance().roomManager.isAccepted(req.params.room, req.params.id);
        if (status !== null)
            _obj.status = status ? "ok" : "wait";

        this.createExpireResponse(res, 'application/json').send(_obj).status(200);
    }

    onPlayAtTable(req, res, next)
    {
        const room = req.room;

        /**
         * Assert that the user really accepted
         */
        const bForwardToGame = this.getServerInstance().roomManager.isAccepted(room, req.cookies.userId);
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
        let lTimeJoined = this.getServerInstance().roomManager.updateEntryTime(room, req.cookies.userId, dice);
        if (lTimeJoined === 0) 
        {
            res.redirect(this.contextPlay + room + "/login");
        }
        else
        {
            /* Force close all existing other sessions of this player */
            res.cookie('joined', lTimeJoined, { httpOnly: true, secure: true });

            req._doShare = typeof req.cookies.socialMedia === "string" ? req.cookies.socialMedia : "";

            this.clearSocialMediaCookies(res);
    
            this.getServerInstance().roomManager.updateDice(room, req.cookies.userId, dice);
            this.createExpireResponse(res, "text/html").send(this.getServerInstance().roomManager.loadGamePage(room, this.sanatiseCookieValue(req.cookies.userId), this.sanatiseCookieValue(req.cookies.username), lTimeJoined, dice)).status(200);

            next();
        }
    }

    onAfterPlayAtTableSuccessJoin(req, _res)
    {
        this.getServerInstance().eventManager.trigger("game-joined", req._roomName, this.isArda(), req._socialName);
    }

    onAfterPlayAtTableSuccessSocial(req, _res, next)
    {
        if (this.isSinglePlayer() || !req._doShare)
            return;
        
        /* enforece lowercase room, is always alphanumeric */
        const room = req.params.room.toLocaleLowerCase();
        if (!this.getServerInstance().roomManager.roomExists(room))
            return;

        const roomCount = this.getServerInstance().roomManager.countPlayersInRoom(room); 
        const noSharing = req._doShare !== "openchallenge" && req._doShare !== "visitor";

        let proceedNext = !noSharing;
        if (roomCount === 1)
            this.getServerInstance().roomManager.setAllowSocialMediaShare(room, !noSharing);
        else 
            proceedNext = this.getServerInstance().roomManager.getAllowSocialMediaShare(room) && !noSharing;

        if (proceedNext)
        {
            req._roomCount = roomCount;
            req._roomName = room;
            req._socialName = this.sanatiseCookieValue(req.cookies.username);
            next();    
        }
    }
    
    onAfterPlayAtTableSuccessCreate(req, _res, next)
    {
        if (req._roomCount !== 1)
            next();
        else if (req._doShare === "openchallenge")
            this.getServerInstance().eventManager.trigger("game-created-openchallenge", req._roomName, this.isArda(), req._socialName);
        else
            this.getServerInstance().eventManager.trigger("game-created", req._roomName, this.isArda(), req._socialName);
    }

}

module.exports = GamePlayRouteHandler;