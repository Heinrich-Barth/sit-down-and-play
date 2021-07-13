
const UTILS = require("../meccg-utils");

class GameAPI {

    constructor(io, room)
    {
        this._sockets = {};
        this._vsPaths = [];
        this._funcs = {};
        this._room = room;
        this._io = io;
    }

    removeSockets()
    {
        this._sockets = {};
    }

    removeSocket(id)
    {
        if (id !== "" && typeof this._sockets[id] !== "undefined")
            delete this._sockets[id];
    }

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

    getRandomDiceRoll()
    {
        var nTimes = this.getRandomDiceNumber();
        
        var _res = nTimes;
        for (var i = 0; i < nTimes; i++)
            _res = this.getRandomDiceNumber();

        return _res;
    }

    addListener(sPath, func_callback)
    {
        if (typeof this._funcs[sPath] === "undefined")
        {
            this._vsPaths.push(sPath);
            if (typeof func_callback === "function")
                this._funcs[sPath] = func_callback;
            else
                this._funcs[sPath] = function() { };
        }
    }
    
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

    onInitPaths(socket)
    {
        const THIS = this;
        for (const path of this._vsPaths)
        {
            socket.on(path, (data) =>  { 
                THIS.onPath(socket, path, data); 
            });
        }

        socket.isingame = true;
    }

    initGameEndpoints()
    {
        for (const key in this._sockets)
        {
            this.initGameEndpoint(this._sockets[key]);
            this._sockets[key] = null;
            delete this._sockets[key];
        }
    }

    initGameEndpoint(socket)
    {
        this.onInitPaths(socket);
    }

    send(socket, path, data)
    {
        if (typeof data === "undefined")
            data = {};

        this._io.to(socket.room).emit(path, data);
    }

    reply(sPath, socket, data)
    {
        if (typeof data === "undefined")
            data = {};

        socket.emit(sPath, {target: socket.userid, payload: data});
    }

    publish(sPath, player, data)
    {
        if (typeof data === "undefined")
            data = {};
        
        this._io.to(this._room).emit(sPath, {target: player, payload: data});
    }
}

class Chat {

    constructor(pApi)
    {
        this._api = pApi;
    }

    send(from, text)
    {
        this.sendMessage(from, text);
    }

    sendMessage(from, text)
    {
        if (this._api === null || text.indexOf(">") !== -1 || text.indexOf("<") !== -1)
            return;

        console.log("chat: " + text);
        this._api.publish("/game/chat/message", from, {
            userid: from,
            message: text
        });
    }
};

const Game = require("./game.js");

exports.newGame = function(io, room, _agentList, _eventManager, _gameCardProvider)
{
    console.log("Setting up game " + room);

    let pAPI = new GameAPI(io, room);
    let pChat = new Chat(pAPI);
    let pGame = Game.newInstance(pAPI, pChat, _agentList, _eventManager, _gameCardProvider);

    return {
        secret: UTILS.createSecret(),
        lobbyToken : UTILS.createSecret(),
        created: Date.now(),
        game: pGame, 
        api: pAPI, 
        chat: pChat, 
        players: {},
        name: room
    };
}; 