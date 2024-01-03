const Logger = require("./Logger");

class EventManager
{
    #events = {};

    addEvent(id, callback) 
    {
        this.#events[id] = callback;
    }

    dump()
    {
        const keys = Object.keys(this.#events);
        keys.sort();
        if (keys.length > 0)
            Logger.info(keys.length + " event(s) registered\n\t- " + keys.join("\n\t- "));
    }

    trigger()
    {
        try
        {
            const params = Array.prototype.slice.call(arguments[0], 0);
            const id = params[0];
            if (typeof id !== "string")
                return;
            
            const args = Array.prototype.slice.call(params, 1);
            if (this.#events[id] !== undefined)
                this.#events[id].apply(this, args);
            else
                Logger.warn("Event not found: " + id);
        }
        catch (e)
        {
            Logger.warn("Event error");
            Logger.error(e);
        }
    }
}

const g_pEvents = new EventManager();

module.exports = 
{
    addEvent : (id, callback)  => g_pEvents.addEvent(id, callback),
    trigger : (...args) => g_pEvents.trigger(args),
    dump : () => g_pEvents.dump()
};
