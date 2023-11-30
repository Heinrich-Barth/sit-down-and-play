const Logger = require("../Logger");

class SaveGameEvaluation 
{
    #assignments;
    #errors = [];

    constructor(assignments)
    {
        this.#assignments = assignments;
    }

    #addError(message)
    {
        if (message !== "")
            this.#errors.push(message);
    }

    evaluateCardMap(playboard)
    {
        let _map = playboard.decks.cardMap;
        const cardIds = Object.keys(_map);
        for (let _cardId of cardIds)
        {
            const _formerOwner = _map[_cardId].owner;
            if (this.#assignments[_formerOwner] === undefined)
                delete _map[_cardId];
        }

        return Object.keys(_map).length > 0;
    }

    #evaluateOwnerMap(siteMap, type)
    {
        if (type === undefined)
            return false;

        const cardIds = Object.keys(siteMap);
        for (let _cardId of cardIds)
        {
            const _formerOwner = _cardId;
            if (this.#assignments[_formerOwner] === undefined)
            {
                Logger.warn("Cannot find former " + type + " owner " + _formerOwner + " of " + _cardId + ". Removing card.");
                delete siteMap[_cardId];
            }
        }

        return Object.keys(siteMap).length > 0;
    }

    #clearMap(siteMap)
    {
        const cardIds = Object.keys(siteMap);
        for (let _cardId of cardIds)
            delete siteMap[_cardId];

        return true;
    }

    evaluateCompanies(companies)
    {
        const companyIds = Object.keys(companies);
        for (let companyId of companyIds)
        {
            const _formerOwner = companies[companyId].playerId;
            if (_formerOwner === undefined)
                continue;
            
            if (this.#assignments[_formerOwner] === undefined)
            {
                Logger.warn("Cannot find former owner " + _formerOwner + " of company " + companyId + ". Removing card.");
                delete companies[companyId];
            }
            else if (companies[companyId].characters.length === 0)
                delete companies[companyId];
        }
        
        return Object.keys(companies).length > 0;
    }

    evaluate(game, isArda)
    {
        if (isArda !== game.meta.arda)
        {
            this.#addError("Arda missmatch");
            return null;
        }
        else if (!this.evaluateCardMap(game.playboard))
        {
            this.#addError("Could not restore card map.");
            return null;
        }
        else if (!this.#evaluateOwnerMap(game.playboard.decks.deck, "deck"))
        {
            this.#addError("No more decks available.");
            return null;
        }
        else if (!this.#evaluateOwnerMap(game.playboard.stagingarea, "staging area"))
        {
            this.#addError("No more staging areas available. Illegal state.");
            return null;
        }
        else if (!this.#evaluateOwnerMap(game.scoring, "scoring"))
        {
            this.#addError("No more scoring available. Illegal state.");
            return null;
        }

        this.#clearMap(game.playboard.decks.siteMap);
        this.evaluateCompanies(game.playboard.companies);

        return game;
    }

    getMessageString()
    {
        if (this.#errors.length === 0)
            return "";
        else
            return this.#errors.join("; ");
    }
}

module.exports = SaveGameEvaluation;