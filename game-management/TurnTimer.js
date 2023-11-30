class TurnTimer {

    #start = Date.now();

    reset()
    {
        this.update(Date.now());
    }

    update(lNow)
    {
        this.#start = lNow;
    }

    getElapsedMins(lNow)
    {
        const lDuration = lNow - this.#start;
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