
/**
 * Manage Card Quantities
 */
 function CreateCardsMeta(jCards) 
 { 
    return this.init(jCards);
 }


CreateCardsMeta.prototype._listSecondaries = [ ];
CreateCardsMeta.prototype._listAlignments = [ ];
CreateCardsMeta.prototype._listType = [ ];
CreateCardsMeta.prototype._listHazardTypes = [ ];
CreateCardsMeta.prototype._listNonHazardTypes = [ ];
CreateCardsMeta.prototype._titleBasedIndices = { };
CreateCardsMeta.prototype._raw = { };
   
Quantities.prototype.add = function(sTitle, nQuantity)
{
    this._data[sTitle] = nQuantity;
};

Quantities.prototype.addType = function(sTitle, nQuantity)
{
    this._type[sTitle] = nQuantity;
};

function unifySecondaries(sSecondary) 
{
    if (typeof sSecondary === "undefined" || sSecondary === "")
        return "Not specified";
    else
        return sSecondary.substring(0, 1).toUpperCase() + sSecondary.substring(1).toLowerCase().replace(/-/g, " ");
};

Quantities.prototype.hasTypeLimitation = function(type)
{
    return typeof this._type[type] !== "undefined";
};

CreateCardsMeta.prototype.createCardCodeList = function () 
{
    for (var card of this._raw)
        this._titleBasedIndices[card.code] = card.index;
};

CreateCardsMeta.prototype.updateSecondaries = function () 
{
    var _secondaries = [];
    var _secondariesCards = {};

    for (var card of this._raw) 
    {
        card.Secondary = unifySecondaries(card.Secondary);

        if (typeof _secondariesCards[card.Secondary] === "undefined") {
            _secondariesCards[card.Secondary] = [];
            _secondaries.push(card.Secondary);
        }

        _secondariesCards[card.Secondary].push(card.index);
    }

    _secondaries.sort();

    this._listSecondaries = {};
    for (var _secondary of _secondaries) {
        this._listSecondaries[_secondary] = _secondariesCards[_secondary];
    }
};

CreateCardsMeta.prototype.updateAlign = function () 
{
    var _secondaries = [];
    var _secondariesCards = {};

    for (var card of this._raw) {
        if (_secondaries.indexOf(card.alignment) === -1) {
            _secondariesCards[card.alignment] = [];
            _secondaries.push(card.alignment);
        }

        _secondariesCards[card.alignment].push(card.index);
    }

    _secondaries.sort();

    for (var _secondary of _secondaries)
        this._listAlignments[_secondary] = _secondariesCards[_secondary];
};

CreateCardsMeta.prototype.updateTypes = function () 
{
    var _secondaries = [];
    var _secondariesCards = {};

    var _type;
    for (var card of this._raw) {
        _type = card.type;
        if (_secondaries.indexOf(_type) === -1) {
            _secondariesCards[_type] = [];
            _secondaries.push(_type);
        }

        _secondariesCards[_type].push(card.index);
    }

    _secondaries.sort();

    for (var _secondary of _secondaries)
        this._listType[_secondary] = _secondariesCards[_secondary];
};


CreateCardsMeta.prototype.addIndices = function () 
{
    var index = -1;
    for (var card of this._raw) {
        index++;
        card.index = index;
    }
},


CreateCardsMeta.prototype.updateHazardOrResource = function () 
{
    for (var card of this._raw) {
        _category = card.type;
        if (_category === "Region" || _category === "Site")
            continue;
        else if (_category === "Hazard" && !this._listHazardTypes.includes(card.Secondary))
            this._listHazardTypes.push(card.Secondary);
        else if (_category !== "Hazard" && !this._listNonHazardTypes.includes(card.Secondary))
            this._listNonHazardTypes.push(card.Secondary);
    }

    this._listHazardTypes.sort();
    this._listNonHazardTypes.sort();
};

CreateCardsMeta.prototype.saveMeta = function () 
{
    var meta = { };
    meta["secondaries"] = this._listSecondaries;
    meta["alignment"] = this._listAlignments;
    meta["type"] = this._listType;
    meta["hazards"] = this._listHazardTypes;
    meta["resources"] = this._listNonHazardTypes;
    meta["code-indices"] = this._titleBasedIndices;

    return meta;
};
    
CreateCardsMeta.prototype.init = function (jsonRaw) 
{
    this._raw = jsonRaw;
    this.addIndices();
    this.updateSecondaries();
    this.updateAlign();
    this.updateTypes();
    this.updateHazardOrResource();
    this.createCardCodeList();

    let _res = this._raw;

    delete this._raw;
    return this.saveMeta();
};
