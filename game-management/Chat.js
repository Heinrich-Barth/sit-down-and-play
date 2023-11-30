const path = require("path");
const fs = require("fs");
const Logger = require("../Logger");

/**
 * This is a simple wrapper to send a chat message
 */
class Chat {

    #api;
    #endpoint;
    #saveLogsAfter
    #gameLogFileUri;
    #gameLogfileName;

    #players = {};
    #vsLogs = [];
    #hasLogData = false;

    /**
     * Create instance
     * @param {Object} pApi Game API Reference
     * @param {*} sEndpoint Target endpoint
     */
    constructor(pApi, sEndpoint, room, saveLogsAfter)
    {
        this.#api = pApi;
        this.#endpoint = sEndpoint;
        const gameLogfileName = Chat.#requireGameLogFile(room) 
        this.#gameLogFileUri = path.join(__dirname + "/../logs/" + gameLogfileName);
        this.#gameLogfileName = gameLogfileName;
        this.#saveLogsAfter = saveLogsAfter;
    }

    hasLogData()
    {
        return this.#hasLogData;
    }

    getLogSize()
    {
        return this.#vsLogs.length;
    }

    getGameLogFile()
    {
        return this.#gameLogfileName;
    }

    static #requireGameLogFile(room)
    {
        return Date.now() + (room === undefined || room === "" ? "" : "-" + room) + ".txt";
    }

    addPlayer(userid, displayname, deckChecksum)
    {
        this.#players[userid] = displayname;
        this.#appendLog(displayname + " joins the game (deck #" + deckChecksum + ")", "");
    }

    #appendLog(message, userid = "")
    {
        if (message === "" || this.#saveLogsAfter < 10)
            return;

        if (userid === "")
            this.#vsLogs.push(message);
        else
            this.#vsLogs.push(this.#getUserName(userid) + " " + message);

        if (this.#vsLogs.length > this.#saveLogsAfter)
        {
            this.#hasLogData = true;
            this.saveGameLog();
        }
    }

    #getUserName(userid)
    {
        const val = this.#players[userid];
        return val === undefined ? "A player" : val;
    }

    /**
     * Send a message
     * @param {String} userid Userid
     * @param {String} text Text message
     */
    send(userid, text, saveGameLog = false)
    {
        Logger.warn("deprecated chat.send");
        this.sendMessage(userid, text, saveGameLog);
    }

    gameLogNextPlayer(message)
    {
        this.#appendLog("\n", "");
        this.#appendLog(message, "");
        this.#appendLog("==================", "");
    }

    #getFinalScoreHeader(score)
    {
        const keys = Object.keys(score.score);
        if (keys.length < 1)
            return "";

        const first = score.score[keys[0]];
        const list = ["Name", "Total"];
        for (let key in first)
        {
            if (key.length > 7)
                list.push(key.substring(0,7));
            else
                list.push(key);
        }

        return list.join("\t");
    }

    createLogFinalScore(finalScores)
    {
        if (finalScores === undefined || finalScores === null)
            return null;


        const sHeader = this.#getFinalScoreHeader(finalScores);
        if (sHeader === "")
            return null;

        const list = ["\nFinal Scores\n==================", sHeader];

        let line;
        for (let id of Object.keys(finalScores.score))
        {
            const name = finalScores.players[id];
            if (name === undefined)
                continue;

            const row = finalScores.score[id];
            line = [name, this.#countScoreTotal(row)];
            for (let key in row)
                line.push(row[key]);

            list.push(line.join("\t"));
        }

        return list.length === 0 ? null : list;
    }

    appendLogFinalScore(finalScores)
    {
        const res = this.createLogFinalScore(finalScores);
        if (res === null)
            this.#appendLog("Could not calculate final scores.", "");   
        else
            this.#appendLog(res.join("\n"), "");   
    }

    #countScoreTotal(score)
    {
        let total = 0;

        for (let key in score)
            total += score[key];

        return total;
    }

    saveGameLog()
    {
        if (!this.#hasLogData)
            return;
        
        fs.appendFile(this.#gameLogFileUri, this.#vsLogs.join("\n"), function (err) 
        {
            if (err)
                Logger.error(err.message);
        });

        this.#vsLogs = [""];
    }

    /**
     * Send a message
     * @param {String} userid Userid
     * @param {String} text Text message
     * @param {Boolean} saveGameLog Save message to game log
     */
    sendMessage(userid, text, saveGameLog = false)
    {
        if (this.#endpoint === undefined || this.#endpoint === "" || this.#api === null || text.indexOf(">") !== -1 || text.indexOf("<") !== -1)
            return;

        this.#api.publish(this.#endpoint, userid, {
            userid: userid,
            message: text
        });

        if (saveGameLog)
            this.#appendLog(text, userid);
    }
}

module.exports = Chat;