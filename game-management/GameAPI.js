
/**
 * Handle basic Socket.IO data message handling.
 */
class GameAPI 
{
    constructor(io, room)
    {
        this._sockets = {};
        this._vsPaths = [];
        this._funcs = {};
        this._room = room;
        this._io = io;
    }

    /**
     * Empty socket map
     */
    removeSockets()
    {
        this._sockets = {};
    }

    /**
     * Remove socket by id
     * @param {String} id 
     */
    removeSocket(id)
    {
        if (id !== "" && typeof this._sockets[id] !== "undefined")
            delete this._sockets[id];
    }

    /**
     * Add given socket to a map
     * 
     * @param {String} id 
     * @param {Object} socket 
     */
    addSocket(id, socket)
    {
        if (typeof this._sockets[id] === "undefined")
            this._sockets[id] = socket;
    }
    
    /**
     * Random dice [1-6] number
     */
    getRandomDiceNumber()
    {
        return Math.floor(Math.random() * Math.floor(6)) + 1;
    }

    /**
     * Obtain dice roll
     * @returns Number
     */
    getRandomDiceRoll()
    {
        const nTimes = this.getRandomDiceNumber();
        
        let _res = nTimes;
        for (let i = 0; i < nTimes; i++)
            _res = this.getRandomDiceNumber();

        return _res;
    }

    /**
     * Set a callback function to handle given path data
     * @param {String} sPath 
     * @param {Function} func_callback 
     */
    addListener(sPath, func_callback)
    {
        if (typeof this._funcs[sPath] === "undefined")
        {
            this._vsPaths.push(sPath);
            if (typeof func_callback === "function")
                this._funcs[sPath] = func_callback;
            else
                this._funcs[sPath] = function() { /** fallback */};
        }
    }
    
    /**
     * Execute callback function to handle received path data
     * @param {Object} socket 
     * @param {String} path 
     * @param {JSON} data 
     * @returns 
     */
    onPath(socket, path, data)
    {
        if (path === "" || typeof this._funcs[path] === "undefined")
        {
            console.log("no endpint available at requested path (not printed for security reasons).");
            return;
        }

        try
        {
            this._funcs[path](socket.userid, socket, data);
        } 
        catch (e)
        {
            console.log("An unexpected exception occurred...");
            console.log(e);
        }
    }

    /**
     * Add socket message listener
     * @param {Object} socket 
     */
    onInitPaths(socket)
    {
        const THIS = this;
        for (const path of this._vsPaths)
            socket.on(path, (data) => THIS.onPath(socket, path, data));

        socket.isingame = true;
    }

    /**
     * Init socket game endpoints.
     */
    initGameEndpoints()
    {
        for (const key in this._sockets)
        {
            this.initGameEndpoint(this._sockets[key]);
            this._sockets[key] = null;
            delete this._sockets[key];
        }
    }

    /**
     * Init socket game endpoint for given socket
     * 
     * @param {Object} socket 
     */
    initGameEndpoint(socket)
    {
        this.onInitPaths(socket);
    }

    /**
     * Publish an object to the given path 
     * 
     * @param {Object} socket 
     * @param {String} path 
     * @param {JSON} data 
     */
    send(socket, path, data)
    {
        if (typeof data === "undefined")
            data = {};

        this._io.to(socket.room).emit(path, data);
    }

    /**
     * Send a reply to the given user only
     * 
     * @param {String} sPath Path
     * @param {String} userid Socket
     * @param {JSON} data Data to be sent
     */
    replyTo(sPath, userid, data)
    {
        this.reply(sPath, this._sockets[userid], data);
    }

    /**
     * Send a reply trough the given socket
     * @param {String} sPath Path
     * @param {Object} socket Socket
     * @param {JSON} data Data to be sent
     */
    reply(sPath, socket, data)
    {
        if (socket === undefined || socket === null)
            return;

        if (typeof data === "undefined")
            data = {};

        socket.emit(sPath, {target: socket.userid, payload: data});
    }

    /**
     * Publish an object to the given path 
     * @param {String} sPath 
     * @param {String} player 
     * @param {JSON} data Data to be sent (optional)
     */
    publish(sPath, player, data)
    {
        if (typeof data === "undefined")
            data = {};
        
        this._io.to(this._room).emit(sPath, {target: player, payload: data});
    }
}

module.exports = GameAPI;
