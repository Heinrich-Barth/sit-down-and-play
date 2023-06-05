

/**
 * Read the score json object
 * 
 * @param {Boolean} isExtended 
 * @returns Array of ids
 */
const createNewScoreSheet = function(isExtended)
{
    let res = {};
    
    for (let category of g_pScores)
    {
        if (!category.extended || (isExtended && category.extended))
            res[category.value] = 0;
    }

    return res;
};


const loadScoreStats = function()
{
    try
    {
        const fs = require("fs");
        const data = JSON.parse(fs.readFileSync("data-local/scores.json"));
        return data.categories;
    }
    catch (err)
    {
        console.log(err);
    }

    return {};
};

const g_pScores = loadScoreStats();

class ScorintSheet {

    constructor(isExtended)
    {
        this._sheet = createNewScoreSheet(isExtended);
        this._total = 0;
    }

    updateCategory(type, nPoints)
    {
        if (type !== "" && typeof this._sheet[type] !== "undefined")
            this._sheet[type] += nPoints;

        return this._calculate();
    }

    setCategory(type, nPoints)
    {
        if (type !== "" && typeof this._sheet[type] !== "undefined")
            this._sheet[type] = nPoints;

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
        for (let key in this._sheet)
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

    restore(scores)
    {
        if (scores === null || scores === undefined)
            return;

        this.total = 0;
        for (let key of Object.keys(this._sheet))
        {
            this._sheet[key] = scores[key] === undefined ? 0 : parseInt(scores[key]);
            this.total += this._sheet[key];
        }
    }
}

class Scores {
    
    constructor(isExtended)
    {
        this._sheets = { };
        this._isExtended = isExtended;
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

    restore(scores)
    {
        this.reset();

        let keys = Object.keys(scores);
        for (let sPlayerId of keys)
        {  
            this.add(sPlayerId);
            this._sheets[sPlayerId].restore(scores[sPlayerId].scores);
        }

        return true;
    }

    /**
     * Create new score sheet
     * 
     * @param {String} sPlayerId 
     */
    add(sPlayerId)
    {
        if (typeof this._sheets[sPlayerId] === "undefined")
            this._sheets[sPlayerId] = new ScorintSheet(this._isExtended);
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
        
        for (let key in this._sheets)
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

    setCategory(sPlayerId, type, nPoints)
    {
        if (typeof this._sheets[sPlayerId] !== "undefined")
            return this._sheets[sPlayerId].setCategory(type, nPoints);
        else
            return -1;
    }
}

module.exports = Scores;