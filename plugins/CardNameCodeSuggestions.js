
class CardNameCodeSuggestions
{
    stripQuote(input) 
    {
        return input.replace(/"/g, '');
    }

    createCardMap(cards)
    {
        let result = { };

        for (let card of cards)
        {
            const normalizedtitle = this.stripQuote(card.normalizedtitle.toLowerCase());
            const code = this.stripQuote(card.code.toLowerCase());

            if (typeof result[normalizedtitle] === "undefined")
                result[normalizedtitle] = [code];
            else if (!result[normalizedtitle].includes(code))
                result[normalizedtitle].push(code);
        }

        return result;
    }

    sortMap(resultMap)
    {
        for (let key of Object.keys(resultMap))
            resultMap[key].sort();
    }

    create(cards)
    {
        const result = this.createCardMap(cards);
        this.sortMap(result);
        return result;
    }

}

module.exports = CardNameCodeSuggestions;