

module.exports = {
    
    create: function ()
    {
        return new SCORES();
    }
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
    }

    /**
     * Update sheet and calculate points
     * @param {json} jData 
     */
    update(jData)
    {
        for (var key in this._sheet)
        {
            if (typeof jData[key] !== "undefined")
                this._sheet[key] = jData[key];
        }

        this._total = this._calculate().total;
    }

    _calcTotal()
    {
        let _tot = 0;
        for (var key in this._sheet)
        {
            if (key !== "stage")
                _tot += this._sheet[key];
        }

        return _tot;
    }

    _findHighestKey(nMax)
    {
        let _res = "";
        let _tempMax = -1;

        for (var key in this._sheet)
        {
            if (key !== "stage" && this._sheet[key] > nMax &&_tempMax < this._sheet[key])
            {
                _res = key;
                _tempMax = this._sheet[key];
            }
        }

        return _res;
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
        let _res = {
            character: 0,
            ally: 0,
            item: 0,
            faction: 0,
            kill: 0,
            misc: 0
        };

        let _tot = 0;
        let _half = Math.ceil(this._calcTotal() / 2);
        let _highestKey = this._findHighestKey(_half);

        let key;
        for (key in this._sheet)
        {
            _res[key] = _highestKey === key ? _half : this._sheet[key];
            _tot += _res[key];
        }

        _res.stage = this._sheet.stage;
        _res.total = _tot;

        return _res;
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
            return null;
        else
        {
            this._sheets[userid].updateCategory(type, nPoints);
            this._sheets[userid]._calculate();  
            return this.getPlayerScore(userid);
        }
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
            return 0;
        else
            return this._sheets[sPlayerId].getTotal();
    }

    updateScore(sPlayerId, jData)
    {
        if (typeof this._sheets[sPlayerId] !== "undefined")
        {
            this._sheets[sPlayerId].update(jData);
            return true;
        }
        else
            return false;
    }
}