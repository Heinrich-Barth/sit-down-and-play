const EventManager = require("../EventManager");

class PlayboardManagerBase
{
    #data = { };
    #counter = 0;
    #eventManager = EventManager;

    triggerEventSetupNewGame()
    {
        this.#eventManager.trigger("setup-new-game", this.#data);
    }

    getEventManager()
    {
        return this.#eventManager;
    }

    /**
     * Get the data object (see plugins)
     * 
     * @returns Object
     */
    GetData()
    {
        return this.#data;
    }

    /**
     * Save current game state
     * @returns Object
     */
     Save()
     {
         return {
             counter : this.#counter
         };
     }
 
 
     Restore(playboard)
     {
        this.#counter = parseInt(playboard.counter);
     }
    
    /**
     * Create a new company id
     * 
     * @returns {String}
     */
    obtainUniqueCompanyId()
    {
        return "company_" + (++this.#counter);
    }
 
    reset()
    {
        this.#data = { };
        this.#counter = 0;
    }

    /**
     * JSON to String
     * @param {JSON} content
     * @returns {String} String value
     */
     toString(content)
     {
         try{
            return JSON.stringify(content, null, '\t');
         }
         catch (err)
         {

         }

         return "";         
     }
 
    ArrayUUIDClone(input)
    {
        let target = [];
        if (input === null || input === undefined || input.length === 0)
            return target;

        for (let inf of input)
        {
            let uuid = this.AssertString(inf);
            if (uuid !== "")
                target.push(uuid);
        }

        return target;
    }

    AssertString(input)
    {
        return input === undefined || input === null || typeof input !== "string" ? "" : input;
    }

    removeFromList(uuid, _list)
    {
        if (typeof _list === "undefined")
            return false;

        for (let y = _list.length - 1; y >= 0; y--)
        {
            if (_list[y] === uuid)
            {
                _list.splice(y, 1);
                return true;
            }
        }

        return false;
    }
}

module.exports = PlayboardManagerBase;