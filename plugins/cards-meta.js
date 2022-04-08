
/**
 * Manage Card Metadata
 */
function CreateCardsMeta(jCards) 
{ 
    return this.init(jCards);
}

const unifySecondaries = function(sSecondary) 
{
    if (typeof sSecondary === "undefined" || sSecondary === "")
        return "Not specified";
    else
        return sSecondary.substring(0, 1).toUpperCase() + sSecondary.substring(1).toLowerCase().replace(/-/g, " ");
};

CreateCardsMeta.prototype.updateSecondaries = function (cards) 
{
    let result = [];
    for (let card of cards) 
    {
        card.Secondary = unifySecondaries(card.Secondary);
        if (card.Secondary !== "" && !result.includes(card.Secondary))
            result.push(card.Secondary);
    }

    result.sort();
    return result;
};

CreateCardsMeta.prototype.updateAlign = function (cards) 
{
    let result = [];
    for (let card of cards) 
    {
        if (card.alignment !== "" && !result.includes(card.alignment))
            result.push(card.alignment);
    }

    result.sort();
};

CreateCardsMeta.prototype.updateTypes = function(cards) 
{
    let result = [];
    for (let card of cards) 
    {
        if (card.type !== "" && !result.includes(card.type))
            result.push(card.type);
    }

    result.sort();
    return result;
};

CreateCardsMeta.prototype.updateHazards = function (cards) 
{
    let result = [];
    for (let card of cards) 
    {
        let _category = card.type;

        if (_category === "Hazard" && !result.includes(card.Secondary))
            result.push(card.Secondary);
    }

    result.sort();
    return result;
};

CreateCardsMeta.prototype.updateResources = function (cards) 
{
    let result = [];
    for (let card of cards) 
    {
        let _category = card.type;

        if (_category !== "" && _category !== "Region" && _category !== "Site" && _category !== "Hazard" && !result.includes(card.Secondary))
            result.push(card.Secondary);
    }

    result.sort();
    return result;
};
    
CreateCardsMeta.prototype.init = function (cards) 
{
    const secs = this.updateSecondaries(cards);
    const aligns = this.updateAlign(cards);
    const types = this.updateTypes(cards);
    const hazards = this.updateHazards(cards);
    const resources = this.updateResources(cards);

    return { 
        secondaries: secs,
        alignment:  aligns,
        type: types,
        hazards: hazards,
        resources: resources,
    };
};

module.exports = CreateCardsMeta;