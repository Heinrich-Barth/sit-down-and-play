
const fs = require('fs');
const CardsMeta = require("./cards-meta");
const CardsMap = require("./cards-map");
const ImageList = require("./imagelist");
const CardRepository = require("./cards-repository");
const DeckValidator = require("./deckvalidator");

let g_pFilter = {}; 

const CardDataProvider = {

    imageUrl : "",
    _agentList : [],

    onCardsReceived : function(body)
    {
        try 
        {
            const cards = CardRepository.setup(JSON.parse(body));
            CardsMap.init(cards);
            ImageList.init(cards, CardDataProvider.imageUrl);
            this.createAgentList(cards);
            g_pFilter = new CardsMeta(CardRepository.getCards());
            CardRepository.postProcessCardList();
        } 
        catch (error) 
        {
            console.error(error.message);
            console.log(error);
        }
    },

    createAgentList : function (jsonCards)
    {
        for (let card of jsonCards) 
        {
            if (card["type"] === "Character" && card["Secondary"] === "Agent") 
                this._agentList.push(card.code);
        }
    },

    loadLocally : function(file)
    {
        try 
        {
            CardDataProvider.onCardsReceived(fs.readFileSync(file, 'utf8'));
            return true;
        } 
        catch (error) 
        {
        }
        
        return false;
    },

    getAgents : function()
    {
        return this._agentList;
    },

    loadFromUrl : function(cardsUrl)
    {
        const https = require('https');
        https.get(cardsUrl,(res) => 
        {
            let body = "";
        
            res.on("data", (chunk) => body += chunk);
            res.on("end", () => CardDataProvider.onCardsReceived(body));
        
        }).on("error", (error) => console.error(error.message));
    },

    load : function(cardsUrl, imageUrl) 
    {
        CardDataProvider.imageUrl = imageUrl;

        if (CardDataProvider.loadLocally("./data/cards-raw.json"))
            console.log("\t-- successfully loaded card data from local file ./data/cards-raw.json --");
        else if (cardsUrl !== undefined && cardsUrl !== "")
            CardDataProvider.loadFromUrl(cardsUrl);
        else
            console.log("Invalid cards url " + cardsUrl);
    }
}


exports.validateDeck = (jDeck) => DeckValidator.validate(jDeck);

exports.validateDeckArda = (jDeck) => DeckValidator.validateArda(jDeck, CardRepository);

exports.validateDeckSingleplayer = (jDeck) => DeckValidator.validateSingleplayer(jDeck, CardRepository);

exports.load = (cardsUrl, imageUrl) => CardDataProvider.load(cardsUrl, imageUrl);

exports.getCards = () => CardRepository.getCards();

exports.isCardAvailable = (code) => CardRepository.isCardAvailable(code);

exports.getCardType = (code) => CardRepository.getCardType(code);

exports.getAgents = () => CardDataProvider.getAgents();

exports.getFilters = () => g_pFilter;

exports.getImageList = () => ImageList.getList();

exports.getSiteList = () => CardsMap.getSiteList();

exports.getMapdata = () => CardsMap.getMapdata(ImageList.getImages());

exports.getCardMind = (code) => CardRepository.getCardMind(code);

exports.getCardByCode = (code) => CardRepository.getCardByCode(code);

exports.getCardTypeSpecific = (code) => CardRepository.getCardTypeSpecific(code);

exports.getMarshallingPoints = (code) => CardRepository.getMarshallingPoints(code);