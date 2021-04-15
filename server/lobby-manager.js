

const DeckValidator = 
{
    isEmpty : function(_deck)
    {
            return _deck == undefined || Object.keys(_deck).length === 0;
    },

    stripAllQuotes : function(jDeck)
    {
        console.log(someStr.replace(/['"]+/g, ''));
    },

    copyCards : function(jDeck, sType)
    {
        let res = { };

        for(var k in jDeck)
        {
            let count = jDeck[k];
            if (count < 1)
                continue;
            
            let _code = k.replace(/"/g, '');
            res[_code] = {
                count: count,
			    code: _code,
    			type: sType
            }
        }

        return res;
    },

    copyGenericCards : function(jDeck)
    {
        let res = { };

        for(var k in jDeck)
        {
            let count = jDeck[k];
            if (count < 1)
                continue;
            
            let _code = k.replace(/"/g, '');
            res[_code] = {
                count: count,
			    code: _code,
    			type: g_LibCards.getCardType(_code)
            }
        }

        return res;
    },


    validate : function(jDeck)
    {
        if (jDeck === undefined || this.isEmpty(jDeck.pool) || this.isEmpty(jDeck.chars) || (this.isEmpty(jDeck.hazards) && this.isEmpty(jDeck.resources)))
            return null;
        else
            return {
                pool: this.copyGenericCards(jDeck.pool),
                sideboard: this.copyGenericCards(jDeck.sideboard),
                chars : this.copyCards(jDeck.chars, "Character"),
                resources : this.copyCards(jDeck.hazards, "Hazard"),
                hazards : this.copyCards(jDeck.resources, "Resource")
            };
    }
};

let g_LibCards = null;

module.exports = {

    setup : function(libCards)
    {
        g_LibCards = libCards;
    },

    validateDeck : function(jDeck)
    {
        return DeckValidator.validate(jDeck);
    }
}