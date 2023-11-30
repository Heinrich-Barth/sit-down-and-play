const Logger = require("../Logger");

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
        Logger.error(err);
    }

    return {};
};

const g_pScores = loadScoreStats();

class ScorintSheet {

    #total = 0;
    #sheet;

    constructor(isExtended)
    {
        this.#sheet = createNewScoreSheet(isExtended);
    }

    updateCategory(type, nPoints)
    {
        if (type !== "" && typeof this.#sheet[type] !== "undefined")
            this.#sheet[type] += nPoints;

        return this.#calculate();
    }

    setCategory(type, nPoints)
    {
        if (type !== "" && typeof this.#sheet[type] !== "undefined")
            this.#sheet[type] = nPoints;

        return this.#calculate();
    }

    /**
     * Update sheet and calculate points
     * @param {json} jData 
     */
    update(jData)
    {
        for (let key in this.#sheet)
        {
            if (typeof jData[key] !== "undefined")
                this.#sheet[key] = jData[key];
        }

        return this.#calculate();
    }

    getTotal()
    {
        return this.#total;
    }

    getSheet()
    {
        let _res = { };
        for (let key in this.#sheet)
            _res[key] = this.#sheet[key];

        return _res;
    }

    /**
     * Calculate total
     */
    #calculate()
    {
        let _tot = 0;

        for (let key in this.#sheet)
        {
            if (key !== "stage")
                _tot += this.#sheet[key];
        }

        this.#total = _tot;
        return _tot;
    }
    
    save()
    {
        return {
            scores: this.#sheet,
            total: this.#total
        };
    }

    restore(scores)
    {
        if (scores === null || scores === undefined)
            return;

        this.total = 0;
        for (let key of Object.keys(this.#sheet))
        {
            this.#sheet[key] = scores[key] === undefined ? 0 : parseInt(scores[key]);
            this.total += this.#sheet[key];
        }
    }
}

class Scores {
    
    #sheets = { };
    #isExtended;

    constructor(isExtended)
    {
        this.#isExtended = isExtended;
    }

    reset()
    {
        this.#sheets = { };
    }

    save()
    {
        let data = {};
        let keys = Object.keys(this.#sheets);
        for (let key of keys)
            data[key] = this.#sheets[key].save();

        return data;
    }

    restore(scores)
    {
        this.reset();

        let keys = Object.keys(scores);
        for (let sPlayerId of keys)
        {  
            this.add(sPlayerId);
            this.#sheets[sPlayerId].restore(scores[sPlayerId].scores);
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
        if (typeof this.#sheets[sPlayerId] === "undefined")
            this.#sheets[sPlayerId] = new ScorintSheet(this.#isExtended);
    }

    update(userid, type, nPoints)
    {
        if (typeof this.#sheets[userid] === "undefined" || nPoints === 0)
            return -1;
        else
            return this.#sheets[userid].updateCategory(type, nPoints);
    }

    getScoreSheets() 
    {
        let sheets = { };
        
        for (let key in this.#sheets)
            sheets[key] = this.#sheets[key].getSheet();
        
        return sheets;
    }

    getScoreSheet(userid)
    {
        if (typeof this.#sheets[userid] === "undefined")
            return { };
        else
            return this.#sheets[userid].getSheet();
    }

    getPlayerScore(sPlayerId)
    {
        if (typeof this.#sheets[sPlayerId] === "undefined")
            return -1;
        else
            return this.#sheets[sPlayerId].getTotal();
    }

    updateScore(sPlayerId, jData)
    {
        if (typeof this.#sheets[sPlayerId] !== "undefined")
            return this.#sheets[sPlayerId].update(jData);
        else
            return -1;
    }

    setCategory(sPlayerId, type, nPoints)
    {
        if (typeof this.#sheets[sPlayerId] !== "undefined")
            return this.#sheets[sPlayerId].setCategory(type, nPoints);
        else
            return -1;
    }
}

module.exports = Scores;