


const _register = function(pEventManager)
{
    /*
    pEventManager.addEvent("test", function(p1, p2, p3)
    {
        console.log("Param1 " + p1);
        console.log("Param2 " + p2);
        console.log("Param3 " + p3);
    });
    */
    console.log("register custom events");
    return;
};

exports.registerEvents = (pEventManager) => _register(pEventManager);