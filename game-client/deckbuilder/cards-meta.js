
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
CreateCardsMeta.prototype._listSets = [ ];

   
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
}

Quantities.prototype.hasTypeLimitation = function(type)
{
    return typeof this._type[type] !== "undefined";
};

CreateCardsMeta.prototype.createCardCodeList = function (cards) 
{
    for (let card of cards)
        this._titleBasedIndices[card.code] = card.index;
};

CreateCardsMeta.prototype.updateSets = function (cards) 
{
    let _data = { };
    for (let card of cards)
    {
        if (card.set_code !== "")
            _data[card.set_code] = card.full_set;
    }

    this._listSets = _data;
};


CreateCardsMeta.prototype.updateSecondaries = function (cards) 
{
    let _secondaries = [];
    let _secondariesCards = {};

    for (let card of cards) 
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
    for (let _secondary of _secondaries)
        this._listSecondaries[_secondary] = _secondariesCards[_secondary];
};

CreateCardsMeta.prototype.updateAlign = function (cards) 
{
    let _secondaries = [];
    let _secondariesCards = {};

    for (let card of cards) 
    {
        if (_secondaries.indexOf(card.alignment) === -1) 
        {
            _secondariesCards[card.alignment] = [];
            _secondaries.push(card.alignment);
        }

        _secondariesCards[card.alignment].push(card.index);
    }

    _secondaries.sort();

    for (let _secondary of _secondaries)
        this._listAlignments[_secondary] = _secondariesCards[_secondary];
};

CreateCardsMeta.prototype.updateTypes = function (cards) 
{
    let _secondaries = [];
    let _secondariesCards = {};

    let _type;
    for (let card of cards) {
        _type = card.type;
        if (_secondaries.indexOf(_type) === -1) 
        {
            _secondariesCards[_type] = [];
            _secondaries.push(_type);
        }

        _secondariesCards[_type].push(card.index);
    }

    _secondaries.sort();

    for (let _secondary of _secondaries)
        this._listType[_secondary] = _secondariesCards[_secondary];
};


CreateCardsMeta.prototype.addIndices = function (cards) 
{
    let index = -1;
    for (let card of cards)
        card.index = (++index);
};


CreateCardsMeta.prototype.updateHazardOrResource = function (cards) 
{
    for (let card of cards) 
    {
        const _category = card.type;
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
    let meta = { };
    meta["secondaries"] = this._listSecondaries;
    meta["alignment"] = this._listAlignments;
    meta["type"] = this._listType;
    meta["hazards"] = this._listHazardTypes;
    meta["resources"] = this._listNonHazardTypes;
    meta["code-indices"] = this._titleBasedIndices;
    meta["sets"] = this._listSets;

    return meta;
};
    
CreateCardsMeta.prototype.init = function (cards) 
{
    this.addIndices(cards);
    this.updateSets(cards);
    this.updateSecondaries(cards);
    this.updateAlign(cards);
    this.updateTypes(cards);
    this.updateHazardOrResource(cards);
    this.createCardCodeList(cards);
    return this.saveMeta();
};
