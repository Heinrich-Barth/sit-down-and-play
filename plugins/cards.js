
const fs = require('fs');
const CardsMeta = require("./cards-meta");
const CardsMap = require("./cards-map");
const ImageList = require("./imagelist");
const CardRepository = require("./cards-repository");
const DeckValidator = require("./deckvalidator");

let g_pFilter = {}; 

const CardDataProvider = {

    imageUrl : "",
    cardsUrl : "",
    mapPos : "",
    _agentList : [],
    
    setConfiguration : function(mapPos, cardsUrl, imageUrl)
    {
        CardDataProvider.imageUrl = imageUrl;
        CardDataProvider.cardsUrl = cardsUrl;
        CardDataProvider.mapPos = mapPos;
    },

    onCardsReceived : function(body)
    {
        try 
        {
            const cards = CardRepository.setup(JSON.parse(body));
            CardsMap.init(cards, CardDataProvider.mapPos);
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
            console.warn(error.message);
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

    load : function() 
    {
        if (CardDataProvider.cardsUrl === "")
        {
            console.warn("No Cards URL/Path provided.");
            return;
        }

        if (!CardDataProvider.cardsUrl.startsWith("http") && !CardDataProvider.cardsUrl.startsWith("//"))
        {
            if (CardDataProvider.loadLocally(CardDataProvider.cardsUrl))
            {
                console.log("\t-- successfully loaded card data from local file " + CardDataProvider.cardsUrl + " --");
                return;
            }
            else
               console.log("Could not load locally");
        }
        
        CardDataProvider.loadFromUrl(CardDataProvider.cardsUrl);
    }
}

exports.setConfiguration = CardDataProvider.setConfiguration;

exports.validateDeck = (jDeck) => DeckValidator.validate(jDeck);

exports.validateDeckArda = (jDeck) => DeckValidator.validateArda(jDeck, CardRepository);

exports.validateDeckSingleplayer = (jDeck) => DeckValidator.validateSingleplayer(jDeck, CardRepository);

exports.load = () => CardDataProvider.load();

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