
/**
 * Manage players dice types and dice rolls
 */
class PlayerDices {
    
    #dices = { };
    #stats = { };
    static #diceList = ["black", "black-grey", "gold", "gold-light", "grey", "minion", "red", "redblack", "redwhite", "rune-alatar", "rune-gandalf", "rune-palando", "rune-radagast", "rune-saruman", "zblack-marc"];

    /**
     * Random number [1-nMax]
     */
    #getRandom(nMax)
    {
        if (nMax === undefined || nMax < 1)
            nMax = 6;

        return Math.floor(Math.random() * nMax) + 1;
    }

    /**
      * Obtain dice roll
      * @returns Number between [1-6]
      */
    roll()
    {
        const nTimes = this.#getRandom(10);
            
        let _res = 6;
        for (let i = 0; i < nTimes; i++)
            _res = this.#getRandom(6);

        return _res;
    }

    getStats()
    {
        return this.#stats;
    }

    saveRoll(userid, nValue)
    {
        if (nValue < 1 || nValue > 12 || userid === "")
            return false;

        if (this.#stats[userid] === undefined)
        {
            const data = { };
            for (let i = 1; i < 13; i++)
                data["" + i] = 0;

            this.#stats[userid] = data;
        }

        this.#stats[userid]["" + nValue] += 1;
        return true;
    }

    /**
     * Get all dice types
     * @returns Array
     */
    getAvailableDices()
    {
        return [...PlayerDices.#diceList];
    }

    /**
     * Get all player's dice type
     * @returns JSON
     */
    getDices()
    {
        let res = {};
        for (let key in this.#dices)
            res[key] = this.#dices[key];

        return res;
    }

    /**
     * Get player's dice type
     * @param {String} userid 
     * @returns Dice
     */
    getDice(userid)
    {
        return userid === undefined || userid === "" || this.#dices[userid] === undefined ? "" : this.#dices[userid]; 
    }

    /**
     * Set a player's dice type
     * 
     * @param {String} userid 
     * @param {String} dice 
     * @returns 
     */
    setDice(userid, dice)
    {
        if (userid === undefined || userid === "" || dice === undefined || dice === "")
            return false;

        if (PlayerDices.#diceList.includes(dice))
        {
            this.#dices[userid] = dice;
            return true;
        }
        else
            return false;
    }
}

module.exports = PlayerDices;