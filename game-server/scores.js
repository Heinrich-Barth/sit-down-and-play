

exports.create =  function ()
{
    return new SCORES();
};

class ScorintSheet {

    constructor()
    {
        this._sheet = {
            stage: 0,
            character: 0,
            ally: 0,
            item: 0,
            faction: 0,
            kill: 0,
            misc: 0
        };

        this._total = 0;
    }

    updateCategory(type, nPoints)
    {
        if (type !== "" && typeof this._sheet[type] !== "undefined")
            this._sheet[type] += nPoints;

        return this._calculate();
    }

    /**
     * Update sheet and calculate points
     * @param {json} jData 
     */
    update(jData)
    {
        for (let key in this._sheet)
        {
            if (typeof jData[key] !== "undefined")
                this._sheet[key] = jData[key];
        }

        return this._calculate();
    }

    getTotal()
    {
        return this._total;
    }

    getSheet()
    {
        let _res = { };
        for (var key in this._sheet)
            _res[key] = this._sheet[key];

        return _res;
    }

    /**
     * Calculate total
     */
    _calculate()
    {
        let _tot = 0;

        for (let key in this._sheet)
        {
            if (key !== "stage")
                _tot += this._sheet[key];
        }

        this._total = _tot;
        return _tot;
    }
    
    save()
    {
        return {
            scores: this._sheet,
            total: this._total
        };
    }
}

class SCORES {
    
    constructor()
    {
        this._sheets = { };
    }

    reset()
    {
        this._sheets = { };
    }

    save()
    {
        let data = {};
        let keys = Object.keys(this._sheets);
        for (let key of keys)
            data[key] = this._sheets[key].save();

        return data;
    }

    /**
     * Create new score sheet
     * 
     * @param {String} sPlayerId 
     */
    add(sPlayerId)
    {
        if (typeof this._sheets[sPlayerId] === "undefined")
            this._sheets[sPlayerId] = new ScorintSheet();
    }

    update(userid, type, nPoints)
    {
        if (typeof this._sheets[userid] === "undefined" || nPoints === 0)
            return -1;
        else
            return this._sheets[userid].updateCategory(type, nPoints);
    }

    getScoreSheets() 
    {
        let sheets = { };
        
        for (var key in this._sheets)
            sheets[key] = this._sheets[key].getSheet();
        
        return sheets;
    }

    getPlayerScore(sPlayerId)
    {
        if (typeof this._sheets[sPlayerId] === "undefined")
            return -1;
        else
            return this._sheets[sPlayerId].getTotal();
    }

    updateScore(sPlayerId, jData)
    {
        if (typeof this._sheets[sPlayerId] !== "undefined")
            return this._sheets[sPlayerId].update(jData);
        else
            return -1;
    }
}