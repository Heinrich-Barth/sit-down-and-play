const https = require('https');
const Logger = require("../Logger");

const HOOK_URL = process.env.DISCORD === undefined ? "" : process.env.DISCORD;
const PLATFORM_URL = process.env.PLATFORMURL === undefined ? "" : process.env.PLATFORMURL;

const DISCORD_URL = "discord.com";
const DISCORD_PORT = 443;

class Discord 
{
    constructor()
    {
        this.hookUrl = HOOK_URL;
        this.platformUrl = PLATFORM_URL;
        this.roomMessages = { };
    }

    createRoomEntry(room)
    {
        if (this.roomMessages[room] === undefined)
        {
            this.roomMessages[room] = {
                id : "",
                created : Date.now(),
                message: "",
                players: []
            }

            return true;
        }
        else
            return false;
    }

    updateRoomMessageId(room, id)
    {
        if (this.roomMessages[room] !== undefined)
            this.roomMessages[room].id = id;
    }

    updateRoomPlayerList(room, name)
    {
        if (this.roomMessages[room] === undefined || name === "")
            return false;

        name = name.toLowerCase();
        if (!this.roomMessages[room].players.includes(name))
        {
            this.roomMessages[room].players.push(name);
            return true;
        }

        return false;
    }

    updateRoomMessage(room, message)
    {
        if (this.roomMessages[room] === undefined)
            return message;

        let summary = message;

        if (this.roomMessages[room] !== undefined)
            summary = (this.roomMessages[room].message + " " + message).trim();

        this.roomMessages[room].message = summary;
        return summary;
    }

    saveDiscordMessageId(room, data)
    {
        try
        {
            if (data !== "")
            {
                const id = JSON.parse(data).id;
                if (id !== undefined)
                    this.updateRoomMessageId(room, id);
            }
        }
        catch (err)
        {
            Logger.error(err);
        }

        return "";
    }

    createMessageArda(room, name, isCreated, isOpenChallenge, urlWatch, urlJoin)
    {
        if (!isCreated)
            return `${name} joined.`;
    
        const res = [];

        if (isOpenChallenge)
            res.push("Open challenge!");

        res.push(`${name} just started a new ARDA game (${room}).`);

        if (isOpenChallenge)
        {
            res.push(`Drop by and watch at ${urlWatch} or join at ${urlJoin}`);
            res.push(`If players are not on discord, they probably use the free https://meet.jit.si/${room} for communication.`);
        }
        else
            res.push(`Drop by and watch at ${urlWatch}.`);
        
        return res.join(" ");
    }

    creeateMessageStandard(room, name, isCreated, isOpenChallenge, urlWatch, urlJoin)
    {
        if (!isCreated)
            return `${name} joined.`;

        const res = [];

        if (isOpenChallenge)
            res.push("Open challenge!");

        res.push(`${name} just started a new game (${room}).`);

        if (isOpenChallenge)
            res.push(`Join the table at ${urlJoin} or drop by watch at ${urlWatch}`);
        else
            res.push(`Drop by and watch at ${urlWatch}`);
        
        return res.join(" ");
        }

    createUrlWatch(room, isArda, platformUrl)
    {
        return isArda ? `${platformUrl}/arda/${room}/watch` : `${platformUrl}/play/${room}/watch`;
    }

    createUrlJoin(room, isArda, platformUrl)
    {
        return isArda ? `${platformUrl}/arda/${room}` : `${platformUrl}/play/${room}`;
    }

    createDiscordMessage(room, isArda, name, isCreated, isOpenChallenge)
    {
        if (room === undefined || room === "")
            return "";

        const urlWatch = this.createUrlWatch(room, isArda, this.platformUrl);
        const urlJoin = this.createUrlJoin(room, isArda, this.platformUrl);

        if (isArda)
            return this.createMessageArda(room, name, isCreated, isOpenChallenge, urlWatch, urlJoin);
        else 
            return this.creeateMessageStandard(room, name, isCreated, isOpenChallenge, urlWatch, urlJoin)
    }

    updateMessage(room, hookUrl, message)
    {
        if (hookUrl === undefined || hookUrl === "" || message === "" || this.roomMessages[room] === undefined || this.roomMessages[room].id === undefined || this.roomMessages[room].id === "")
            return false;
            
        try 
        {
            const req = https.request(this.getPostOptions(room, hookUrl)).on("error", (err) => Logger.warn(err.message));
            req.write(JSON.stringify({
                content: message
            }));
            req.end();
            return true;
        }
        catch (err)
        {
            Logger.warn(err.message);
        }
        return false;
    }

    getPostOptions(room, hookUrl)
    {
        const options = {
            hostname: DISCORD_URL,
            port: DISCORD_PORT,
            path: hookUrl + "?wait=true",
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            }
        };

        if (this.roomMessages[room] !== undefined && this.roomMessages[room].id !== "")
        {
            options.method = "PATCH";
            options.path = hookUrl + "/messages/" + this.roomMessages[room].id;
        }

        return options;
    }

    doPost(room, hookUrl, prevMessage, processResponse)
    {
        try 
        {
            const pThis = this;
            const thisRoom = room;
            const req = https.request(this.getPostOptions(room, hookUrl), function(res)
            {
                if (processResponse)
                {
                    let body = '';
                    res.on('data', (chunk) => body += chunk);
                    res.on('end', ()  => pThis.saveDiscordMessageId(thisRoom, body));    
                }

            }).on("error", (err) => Logger.warn(err.message));
            req.write(JSON.stringify({
                content: prevMessage
            }));
            req.end();
        }
        catch (err)
        {
            Logger.warn(err.message);
        }
    }

    postNotification(room, hookUrl, message, processResponse)
    {
        if (hookUrl === undefined || hookUrl === "" || message === "")
            return;

        this.createRoomEntry(room);
        const prevMessage = this.updateRoomMessage(room, message);
        this.doPost(room, hookUrl, prevMessage, processResponse);
    }

    sendDiscordNotificationGame(room, isArda, name, isCreated, isOpenChallenge)
    {
        if (room !== undefined && room !== "")
        {
            if (isCreated)
                this.updateRoomMessage(room, "");

            this.postNotification(room, this.hookUrl, this.createDiscordMessage(room, isArda, name, isCreated, isOpenChallenge), isCreated);
            this.updateRoomPlayerList(room, name);
        }
    }

    compareScores( a, b ) 
    {
        if ( a.total > b.total )
          return -1;
        else if ( a.total < b.total )
          return 1;
        else
            return 0;
      }

    sortScores(score, players)
    {
        if (score === undefined || players === undefined)
            return [];

        let list = [];

        for (let id of Object.keys(score))
        {
            let _name = players[id];
            if (_name === undefined || _name === "")
                _name = "A player";

            const val = this.calculateFinalScore(_name, score[id]);
            list.push(val);
        }

        if (list.length > 1)
            list.sort(this.compareScores);

        return list;
    }

    createScoreMessage(room, finalScore)
    {
        if (room === undefined || room === "" || finalScore === undefined || finalScore.score === undefined || finalScore.players === undefined || Object.keys(finalScore.players).length < 1)
            return "";

        const list = this.sortScores(finalScore.score, finalScore.players);
        const winner = list.shift();
        return this.createScoredMessageResult(room, winner, list);
    }

    createScoredMessageResult(room, winner, others)
    {
        if (winner.total === 0 || others.length === 0)
            return "";

        let message = winner.name + " won the game " + room + " scoring " + winner.total + " points (" + winner.details + ")";
        for (let line of others)
        {
            message += ",\n" + line.name + " scored " + line.total + " points";
            if (line.total > 0)
                message += " (" + line.details + ")";
        }

        return message.trim() + ".";
    }

    sendDiscordNotificationFinished(room, finalScore)
    {
        if (this.updateMessage(room, this.hookUrl, this.createScoreMessage(room, finalScore)))
            this.removeGameEntry(room);
    }

    removeGameEntry(room)
    {
        if (typeof this.roomMessages[room] !== "undefined")
            delete this.roomMessages[room];
    }

    getLogfileMessage(gameLog)
    {
        if (typeof gameLog !== "string" || gameLog === "")
            return "";
        else
            return `You may check out the game log at ${this.platformUrl}/logs/${gameLog} for some limited time.`;
        
    }

    getEndGameMessage(room, gameLog)
    {
        const players = this.listRoomPlayers(room);
        const logMessage = this.getLogfileMessage(gameLog); 
        if (players !== "")
            return `The game of ${players} (${room}) has ended.\n${logMessage}`.trim();
        else
            return `The game ${room} has ended.\n${logMessage}`.trim();
    }

    sendDiscordGameEnded(room, gameLog)
    {
        const message = this.getEndGameMessage(room, gameLog);
        this.updateMessage(room, this.hookUrl, message);
        this.removeGameEntry(room);
    }

    listRoomPlayers(room)
    {
        if (typeof this.roomMessages[room] === "undefined")
            return "";
        else
            return this.roomMessages[room].players.join(", ");
    }

    calculateFinalScore(name, score)
    {
        let keys = Object.keys(score);
        let message = "";

        let total = 0;
        for (let key of keys)
        {
            let val = score[key];
            if (val > 0)
            {
                if (message !== "")
                    message += ", ";

                message += key + " (" + val + ")"
                total += val;
            }
        }

        return {
            name : name === undefined ? "Another player" : name,
            total: total,
            details: message
        } 
    }    

    sendDiscordMessageCreated(room, isArda, name)
    {
        this.removeGameEntry(room);
        this.sendDiscordNotificationGame(room, isArda, name, true, false);
    }

    sendDiscordMessageCreatedOpenChallange(room, isArda, name)
    {
        this.removeGameEntry(room);
        this.sendDiscordNotificationGame(room, isArda, name, true, true);
    }

    sendDiscordMessageJoin(room, isArda, name)
    {
        this.sendDiscordNotificationGame(room, isArda, name, false);
    }

    registerEvents(pEventManager)
    {
        if (this.hookUrl !== "" && this.platformUrl !== "")
        {
            pEventManager.addEvent("game-created", this.sendDiscordMessageCreated.bind(this));
            pEventManager.addEvent("game-created-openchallenge", this.sendDiscordMessageCreatedOpenChallange.bind(this))
            pEventManager.addEvent("game-joined", this.sendDiscordMessageJoin.bind(this));
            pEventManager.addEvent("game-finished", this.sendDiscordNotificationFinished.bind(this));
            pEventManager.addEvent("game-remove", this.sendDiscordGameEnded.bind(this));
        }
    }
}

module.exports = Discord;