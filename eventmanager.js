
function EventManager() 
{
}

EventManager.prototype.events = {};

EventManager.prototype.addEvent = function(id, callback) 
{
    this.events[id] = callback;
};

EventManager.prototype.dump = function()
{
    let keys = Object.keys(this.events);
    keys.sort();
    if (keys.length > 0)
    {
        console.log(keys.length + " event(s) registered\n\t- " + keys.join("\n\t- "));
    }
};

EventManager.prototype.trigger = function() 
{
    try
    {
        const params = Array.prototype.slice.call(arguments[0], 0);
        const id = params[0];
        const args = Array.prototype.slice.call(params, 1);
        if (this.events[id] !== undefined)
            this.events[id].apply(this, args);
    }
    catch (e)
    {
        console.log(e);
    }
};

const g_pEvents = new EventManager();

module.exports = 
{
    addEvent : (id, callback)  => g_pEvents.addEvent(id, callback),
    trigger : (...args) => g_pEvents.trigger(args),
    dump : () => g_pEvents.dump()
};
