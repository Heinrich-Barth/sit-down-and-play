/**
 * This is a simple wrapper to send a chat message
 */
class Chat {

    /**
     * Create instance
     * @param {Object} pApi Game API Reference
     * @param {*} sEndpoint Target endpoint
     */
    constructor(pApi, sEndpoint)
    {
        this._api = pApi;
        this._endpoint = sEndpoint;
    }

    /**
     * Send a message
     * @param {String} userid Userid
     * @param {String} text Text message
     */
    send(userid, text)
    {
        this.sendMessage(userid, text);
    }

    /**
     * Send a message
     * @param {String} userid Userid
     * @param {String} text Text message
     */
    sendMessage(userid, text)
    {
        if (this._endpoint === undefined || this._endpoint === "" || this._api === null || text.indexOf(">") !== -1 || text.indexOf("<") !== -1)
            return;

        this._api.publish(this._endpoint, userid, {
            userid: userid,
            message: text
        });
    }
}

module.exports = Chat;