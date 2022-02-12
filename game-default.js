const fs = require('fs');
const UTILS = require("./meccg-utils");

const onLogin = function(SERVER, req, res)
{
    SERVER.clearCookies(res);

    /* assert the room is valid */
    if (!UTILS.isAlphaNumeric(req.params.room))
    {
        res.redirect("/error");
    }
    else
    {
        const sUser = req.cookies.username === undefined ? "" : req.cookies.username;
        let sHtml = fs.readFileSync(__dirname + "/pages/login.html", 'utf8');

        res.setHeader('Content-Type', 'text/html');
        SERVER.expireResponse(res).send(sHtml.replace("{DISPLAYNAME}", sUser)).status(200);
    }
};

const onLoginCheck = function(SERVER, req, res)
{
    try 
    {
        const room = req.params.room.toLocaleLowerCase();

        if (!UTILS.isAlphaNumeric(room))
            throw  new Error("Invalid room name");

        const jData = JSON.parse(req.body.data);
        const displayname = jData.name;

        /**
         * assert the username is alphanumeric only
         */
        if (!UTILS.isAlphaNumeric(displayname) || jData.deck === undefined)
            throw new Error("Invalid data");

        if (SERVER.roomManager.isTooCrowded(room))
            throw new Error("Too crowded");

        /**
         * Validate Deck first
         */
        const jDeck = SERVER.cards.validateDeck(jData.deck);
        if (jDeck === null)
            throw new Error("Invalid Deck");

        /**
         * Now, check if there already is a game for this Room
         */
        const userId = UTILS.generateUuid();

        /** add player to lobby */
        const lNow = SERVER.roomManager.addToLobby(room, userId, displayname, jDeck);

        /** proceed to lobby */
        const jSecure = { httpOnly: true, secure: true };
        res.cookie('room', room, jSecure);
        res.cookie('username', displayname, jSecure);
        res.cookie('userId', userId, jSecure);
        res.cookie('joined', lNow, jSecure);
        res.setHeader('Content-Type', 'text/plain');
        SERVER.expireResponse(res).redirect("/play/" + req.params.room);
    }
    catch (e) 
    {
        console.log(e);
        SERVER.expireResponse(res).redirect("/error/login");
    }
};

const onLobby = function(SERVER, req, res)
{
    /** assert that all necessary cookies are available and valid at this point  */
    if (!SERVER.validateCookies(res, req)) 
    {
        res.redirect("/play/" + req.params.room + "/login");
    }
    else if (SERVER.roomManager.isAccepted(req.params.room, req.cookies.userId))  /* if player is admin or accepted, simply redirect to game room */
    {
        res.redirect("/play/" + req.params.room);
    }
    else 
    {
        SERVER.roomManager.sendJoinNotification(req.params.room);
        let sHtml = fs.readFileSync(__dirname + "/pages/lobby.html", 'utf8');
        SERVER.expireResponse(res, "text/html").send(sHtml.replace("{room}", req.params.room).replace("{id}",req.cookies.userId)).status(200);
    }
};

const onWaiting = function(SERVER, req, res)
{
    if (SERVER.roomManager.isGameHost(req.params.room, req.params.token))
    {
        let data = {
            waiting: SERVER.roomManager.getWaitingList(req.params.room),
            players : SERVER.roomManager.getPlayerList(req.params.room)
        }

        SERVER.expireResponse(res, "application/json").send(data).status(200);
    }
    else
        res.sendStatus(401);
};

const onJoinTable = function(SERVER, req, res)
{
    if (SERVER.roomManager.isGameHost(req.params.room, req.params.token))
    {
        SERVER.roomManager.inviteWaiting(req.params.room, req.params.id);
        SERVER.expireResponse(res).sendStatus(204);
    }
    else
        res.sendStatus(401);
};

const onReqjectEntry = function(SERVER, req, res)
{
    if (SERVER.roomManager.isGameHost(req.params.room, req.params.token))
    {
        SERVER.roomManager.rejectEntry(req.params.room, req.params.id);
        SERVER.expireResponse(res).sendStatus(204);
    }
    else
        res.sendStatus(401);
};

const onRemovePlayer = function(SERVER, req, res)
{
    if (SERVER.roomManager.isGameHost(req.params.room, req.params.token))
    {
        SERVER.roomManager.removePlayerFromGame(req.params.room, req.params.id);
        SERVER.expireResponse(res).sendStatus(204);
    }
    else
        res.sendStatus(401);
};

const onPlayerStatus = function(SERVER, req, res)
{
    let _obj = {
        status: "denied",
        room: req.params.room
    };

    let status = SERVER.roomManager.isAccepted(req.params.room, req.params.id);
    if (status !== null)
        _obj.status = status ? "ok" : "wait";

    res.setHeader('Content-Type', 'application/json');
    SERVER.expireResponse(res).send(_obj).status(200);
};

const onPlayAtTable = function(SERVER, req, res)
{
    if (!UTILS.isAlphaNumeric(req.params.room))
    {
        res.redirect("/error.html");
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
    if (!SERVER.validateCookies(res, req)) 
    {
        res.redirect("/play/" + room + "/login");
        return;
    }

    /**
     * Assert that the user really accepted
     */
    let bForwardToGame = SERVER.roomManager.isAccepted(room, req.cookies.userId);
    if (bForwardToGame === null) 
    {
        res.redirect("/play/" + room + "/login");
        return;
    }
    else if (!bForwardToGame) 
    {
        res.redirect("/play/" + room + "/lobby");
        return;
    }

    /**
     * At this point, the user is allowed to enter the room.
     * 
     * The user may have joined with a second window. In that case, they would have 2 active sessions open.
     */
    let lTimeJoined = SERVER.roomManager.updateEntryTime(room, req.cookies.userId);
    if (lTimeJoined === 0) 
    {
        res.redirect("/play/" + room + "/login");
    }
    else
    {
        /* Force close all existing other sessions of this player */
        res.cookie('joined', lTimeJoined, { httpOnly: true, secure: true });
        SERVER.expireResponse(res, "text/html").send(SERVER.roomManager.loadGamePage(room, req.cookies.userId, req.cookies.username, lTimeJoined)).status(200);
    }
};

exports.setup = function(SERVER)
{
    /**
     * The LOGIN page.
     * 
     * Here, the user will provide a display name used in the game and
     * also upload their deck.
     * 
     * The page forwards to a login page which will create all cookies.
     */
    SERVER.instance.get("/play/:room/login", (req, res) => onLogin(SERVER, req, res));
    
    /**
     * Perform the login and set all necessary cookies.
     * 
     * The room will only allow ALPHANUMERIC characters and the display name will also be
     * checked to be alphanumeric only to avoid any HTML injection possibilities.
     * 
     */
    SERVER.instance.post("/play/:room/login/check", (req, res) => onLoginCheck(SERVER, req, res));

    /**
     * Player enters the lobby to wait until addmitted to the table.
     * 
     * If the player entering this lobby is the first player (or allowed to access the table),
     * the player will be redirected to the game.
     * 
     * If the player does not yet have logged in, redirect to login.
     * Otherwise, simply show the waiting screen
     */
    SERVER.instance.get("/play/:room/lobby", (req, res) => onLobby(SERVER, req, res));

    /**
     * Get a list of players who are waiting to join this game
     */
    SERVER.instance.get("/play/:room/waiting/:token", (req, res) => onWaiting(SERVER, req, res));

    /**
     * Allow player to access the table
     */
    SERVER.instance.post("/play/:room/invite/:id/:token", (req, res) => onJoinTable(SERVER, req, res));

    /**
     * Reject player access to table
     */
    SERVER.instance.post("/play/:room/reject/:id/:token", (req, res) => onReqjectEntry(SERVER, req, res));

    /**
     * Reject player access to table
     */
    SERVER.instance.post("/play/:room/remove/:id/:token", (req, res) => onRemovePlayer(SERVER, req, res));

    /**
     * Get the status of a given player (access denied, waiting, addmitted)
     */
    SERVER.instance.get("/play/:room/status/:id", (req, res) => onPlayerStatus(SERVER, req, res));

    /**
     * Player joins a table.
     * 
     * The room name has to be ALPHANUMERIC. Otherwise, the requets will fail.
     */
    SERVER.instance.get("/play/:room", (req, res) => onPlayAtTable(SERVER, req, res));
};
