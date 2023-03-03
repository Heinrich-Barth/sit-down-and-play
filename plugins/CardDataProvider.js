
const fs = require('fs');
const CardsMeta = require("./CreateCardsMeta");
const CardRepository = require("./CardRepository");
const DeckValidator = require("./DeckValidator");
const ImageList = require("./ImageList");
const VerifyImages = require("./VerifyImages");

class CardDataProvider extends CardRepository {
   
    constructor(mapPos, cardsUrl, imageUrl)
    {
        super();

        this.imageUrl = imageUrl;
        this.cardsUrl = cardsUrl;
        this.mapPos = mapPos;
        this.filters = { };
        this.pImageList = new ImageList();
        this.cardsMap = {};
    }

    onProcessCardData()
    {
        this.pImageList.create(this.getCards(), this.imageUrl);
        this.cardsMap = require("./CardsMap")(this.getCards(), this.mapPos, this.pImageList.getImageList());
        this.filters = new CardsMeta(this.getCards());
        this.postProcessCardList();
        
        VerifyImages.validateImages(this.pImageList.getImageList());
    }

    getFilters()
    {
        return this.filters;    
    }

    loadLocally(file)
    {
        try 
        {
            console.log("Loading local card data from " + file);
            this.onCardsReceived(fs.readFileSync(file, 'utf8'));
            return true;
        } 
        catch (error) 
        {
            console.warn(error.message);
        }
        
        return false;
    }

    loadFromUrl(cardsUrl)
    {
        console.log("Loading data from url " + cardsUrl);
        const pThis = this;

        const https = require('https');
        https.get(cardsUrl,(res) => 
        {
            let body = "";
        
            res.on("data", (chunk) => body += chunk);
            res.on("end", () => pThis.onCardsReceived(body));
        
        }).on("error", (error) => console.error(error.message));
    }

    load() 
    {
        if (this.cardsUrl === "")
        {
            console.warn("No Cards URL/Path provided.");
            return;
        }

        if (!this.cardsUrl.startsWith("http") && !this.cardsUrl.startsWith("//"))
        {
            if (this.loadLocally(this.cardsUrl))
            {
                console.log("\t-- successfully loaded card data from local file " + this.cardsUrl + " --");
                return;
            }
            else
               console.log("Could not load locally");
        }
        
        this.loadFromUrl(this.cardsUrl);
    }

    validateDeck(jDeck)
    {
        return DeckValidator.validate(jDeck, this);
    }

    validateDeckArda(jDeck)
    {
        return DeckValidator.validateArda(jDeck, this);
    }

    validateDeckSingleplayer(jDeck)
    {
        return DeckValidator.validateSingleplayer(jDeck, this);
    }

    getImageList()
    {
        return {
            images: this.pImageList.getImageList(),
            fliped : this.pImageList.getQuestList()
        };
    }

    getMapdata(_imageList)
    {
        const data = this.cardsMap.mapdata;
        data.images = this.pImageList.getImageList();
        return data;
    }

    getSiteList()
    {
        return this.cardsMap.siteList;
    }

    getUnderdeepMapdata()
    {
        return this.cardsMap.underdeeps;
    }

    getAgents()
    {
        return super.getAgents();
    }
}

module.exports = CardDataProvider;