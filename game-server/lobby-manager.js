

const DeckValidator = 
{
    isEmpty : function(_deck)
    {
        return _deck == undefined || Object.keys(_deck).length === 0;
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
                chars : this.copyGenericCards(jDeck.chars),
                resources : this.copyGenericCards(jDeck.hazards),
                hazards : this.copyGenericCards(jDeck.resources)
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