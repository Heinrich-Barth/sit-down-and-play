class TurnTimer {

    constructor()
    {
        this._start = Date.now();
    }

    reset()
    {
        this.update(Date.now());
    }

    update(lNow)
    {
        this._start = lNow;
    }

    getElapsedMins(lNow)
    {
        const lDuration = lNow - this._start;
        return new Date(lDuration).getMinutes();
    }

    pollElapsedMins()
    {
        const lNow = Date.now();
        const lDuration = this.getElapsedMins(lNow);
        this.update(lNow);
        return lDuration;
    }
}

module.exports = TurnTimer;