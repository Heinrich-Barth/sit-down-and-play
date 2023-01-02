
const https = require('https');
const HOOK_URL = process.env.DISCORD === undefined ? "" : process.env.DISCORD;
const PLATFORM_URL = process.env.PLATFORMURL === undefined ? "" : process.env.PLATFORMURL;

class Discord 
{
    constructor()
    {
        this.hookUrl = HOOK_URL;
        this.platformUrl = PLATFORM_URL;
    }

    createMessageArda(room, name, isCreated, urlWatch, urlJoin)
    {
        if (isCreated)
        {
            if (name === "")
                return `A new ARDA game (${room}) has just started. Drop by and watch at ${urlWatch} or join at ${urlJoin}`;
            else
                return `${name} just started new ARDA game (${room}). Drop by and watch at ${urlWatch} or join at ${urlJoin}`;
        }
        else if (name === "")
            return `Another player joined the ARDA game at ${room}. Drop by and watch at ${urlWatch} or join at ${urlJoin}`;
        else 
            return `${name} joined joined the ARDA game at ${room}. Drop by and watch at ${urlWatch} or join at ${urlJoin}`;
    }

    creeateMessageStandard(room, name, isCreated, urlWatch, urlJoin)
    {
        if (isCreated)
        {
            if (name === "")
                return `A new game ${room} has just started. Drop by and watch at ${urlWatch}`;
            else
                return `${name} started a new game (${room}). Drop by and watch at ${urlWatch}`;
        }
        else if (name === "")
            return `Another player joined the game ${room}. Drop by and watch ${urlWatch}`;
        else 
            return `${name} joined the game at ${room}. Drop by and watch at ${urlWatch}`;
    }

    createUrlWatch(room, isArda, platformUrl)
    {
        return isArda ? `${platformUrl}/arda/${room}/watch` : `${platformUrl}/play/${room}/watch`;
    }

    createUrlJoin(room, isArda, platformUrl)
    {
        return isArda ? `${platformUrl}/arda/${room}` : "";
    }

    createDiscordMessage(room, isArda, name, isCreated)
    {
        if (room === undefined || room === "")
            return "";

        const urlWatch = this.createUrlWatch(room, isArda, this.platformUrl);
        const urlJoin = this.createUrlJoin(room, isArda, this.platformUrl);

        if (isArda)
            return this.createMessageArda(room, name, isCreated, urlWatch, urlJoin);
        else 
            return this.creeateMessageStandard(room, name, isCreated, urlWatch, urlJoin)
    }

    postNotification(hookUrl, message)
    {
        if (hookUrl === undefined || hookUrl === "" || message === "")
            return;

        const options = {
            hostname: 'discord.com',
            port: 443,
            path: hookUrl,
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            }
        };

        try 
        {
            const req = https.request(options).on("error", (err) => console.warn(err.message));
            req.write(JSON.stringify({
                content: message
            }));
            req.end();
        }
        catch (err)
        {
            console.warn(err.message);
        }
    }

    sendDiscordNotificationGame(room, isArda, name, isCreated)
    {
        if (room !== undefined && room !== "")
            this.postNotification(this.hookUrl, this.createDiscordMessage(room, isArda, name, isCreated));
    }

    createScoreMessage(room, finalScore)
    {
        if (room === undefined || room === "" || finalScore === undefined)
            return "";

        if (finalScore.score === undefined || finalScore.players === undefined || Object.keys(finalScore.players).length < 2)
            return "";

        let list = [];
        let winner = {
            points: 0,
            name: ""
        }

        for (let id of Object.keys(finalScore.score))
        {
            const _name = finalScore.players[id];
            const val = this.calculateFinalScore(_name, finalScore.score[id]);

            if (val.total > winner.points)
            {
                winner.points = val.total;
                winner.name = _name !== undefined ? _name : "Another player";
            }

            list.push(val);
        }

        if (winner.name === "" || winner.points === 0)
            return "";

        let message = "";
        for (let line of list)
        {
            if (winner.name === line.name)
                message = line.name + " has won the game " + room + " scoring " + line.total + " points (" + line.details + ")";
        }

        for (let line of list)
        {
            if (winner.name !== line.name)
                message += ",\n" + line.name + " scored " + line.total + " points (" + line.details + ")";
        }

        return message.trim();
    }

    sendDiscordNotificationFinished(room, finalScore)
    {
        this.postNotification(this.hookUrl, this.createScoreMessage(room, finalScore));
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
        this.sendDiscordNotificationGame(room, isArda, name, true);
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
            pEventManager.addEvent("game-joined", this.sendDiscordMessageJoin.bind(this));
            pEventManager.addEvent("game-finished", this.sendDiscordNotificationFinished.bind(this));
        }
    }
}

module.exports = Discord;