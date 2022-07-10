
const Player = require("./Player");

class Visitor extends Player
{
    constructor(displayname,  timeAdded)
    {
        super(displayname, {}, false, timeAdded);
    }

    isVisitor()
    {
        return true;
    }

    isAdmin()
    {
        return false;
    }
}

module.exports = Visitor;