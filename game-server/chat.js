
class Chat {

    constructor(pApi, sEndpoint)
    {
        this._api = pApi;
        this._endpoint = sEndpoint;
    }

    send(from, text)
    {
        this.sendMessage(from, text);
    }

    sendMessage(from, text)
    {
        if (this._endpoint === undefined || this._endpoint === "" || this._api === null || text.indexOf(">") !== -1 || text.indexOf("<") !== -1)
            return;

        this._api.publish(this._endpoint, from, {
            userid: from,
            message: text
        });
    }
}

module.exports = Chat;