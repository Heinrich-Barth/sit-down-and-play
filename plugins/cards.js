
const fs = require('fs');
const CardsMeta = require("./cards-meta");
const CardsMap = require("./cards-map");
const ImageList = require("./imagelist");
const CardRepository = require("./cards-repository");
const Agents = require("./cards-agents");
const DeckValidator = require("./deckvalidator");

let g_pFilter = {}; 

const CardDataProvider = {

    onCardsReceived : function(body)
    {
        try 
        {
            const cards = CardRepository.setup(JSON.parse(body));
            CardsMap.init(cards);
            ImageList.init(cards);
            Agents.createAgentList(cards);
            g_pFilter = new CardsMeta(CardRepository.getCards());
            CardRepository.postProcessCardList();
        } 
        catch (error) 
        {
            console.error(error.message);
            console.log(error);
        };
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
        };
        
        return false;
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

    load : function(cardsUrl) 
    {
        if (CardDataProvider.loadLocally("./data/cards-raw.json"))
            console.log("Successfully loaded card data from local file.");
        else if (cardsUrl !== undefined && cardsUrl !== "")
            CardDataProvider.loadFromUrl(cardsUrl);
        else
            console.log("Invalid cards url " + cardsUrl);
    }
}


exports.validateDeck = (jDeck) => DeckValidator.validate(jDeck, CardRepository);

exports.load = (cardsUrl) => CardDataProvider.load(cardsUrl);

exports.getCards = () => CardRepository.getCards();

exports.isCardAvailable = (code) => CardRepository.isCardAvailable(code);

exports.getCardType = (code) => CardRepository.getCardType(code);

exports.getAgents = () => Agents.getAgents();

exports.getFilters = () => g_pFilter;

exports.getImageList = () => ImageList.getList();

exports.getSiteList = () => CardsMap.getSiteList();

exports.getMapdata = () => CardsMap.getMapdata(ImageList.getImages());
