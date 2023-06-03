
/**
 * Manage Card Quantities
 */
function Quantities() 
{ 
    this.init();
}


Quantities.prototype._data = { };
Quantities.prototype._type = { };

Quantities.prototype.add = function(sTitle, nQuantity)
{
    this._data[sTitle] = nQuantity;
};

Quantities.prototype.addType = function(sTitle, nQuantity)
{
    this._type[sTitle] = nQuantity;
};

Quantities.prototype.hasTypeLimitation = function(type)
{
    return typeof this._type[type] !== "undefined";
};


/**
 * Get the custom value
 * @param {String} title 
 * @returns {Number} Value or the default value
 */
Quantities.prototype.getTypeLimit = function(title, def) 
{
    if (title === "" || typeof this._type[title] === "undefined")
        return def;
    else
        return this._type[title];
};

/**
 * Get the custom value
 * @param {String} title 
 * @returns {Number} Value or the default value
 */
Quantities.prototype.getLimit = function(title) 
{
    if (title === "" || typeof this._data[title] === "undefined")
        return 3;
    else
        return this._data[title];
};

Quantities.prototype.init = function()
{
    this.add("Black Horse", 9);
    this.add("Tear of Yavanna", 4);
    this.add("Share of the Treasure", 14);

    this.addType("Avatar", 5);
    this.addType("Site", 1);
    this.addType("Region", 0);
};

Quantities.prototype.getUnique = function()
{
    return 1;
};