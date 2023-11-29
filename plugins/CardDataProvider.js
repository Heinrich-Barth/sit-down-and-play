const fs = require('fs');
const CardsMeta = require("./CreateCardsMeta");
const CardRepository = require("./CardRepository");
const DeckValidator = require("./DeckValidator");
const ImageList = require("./ImageList");
const VerifyImages = require("./VerifyImages");
const Logger = require("../Logger");
const Configuration = require("../Configuration");

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
            Logger.info("Loading local card data from " + file);
            this.onCardsReceived(fs.readFileSync(file, 'utf8'));
            return true;
        } 
        catch (error) 
        {
            Logger.warn(error.message);
        }
        
        return false;
    }

    loadFromUrl(cardsUrl)
    {
        Logger.info("Loading data from url " + cardsUrl);
        const pThis = this;

        const https = require('https');
        https.get(cardsUrl,(res) => 
        {
            let body = "";
        
            res.on("data", (chunk) => body += chunk);
            res.on("end", () => pThis.onCardsReceived(body));
        
        }).on("error", (error) => Logger.error(error.message));
    }

    load() 
    {
        if (this.cardsUrl === "")
        {
            Logger.warn("No Cards URL/Path provided.");
            return;
        }

        if (!this.cardsUrl.startsWith("http") && !this.cardsUrl.startsWith("//"))
        {
            if (this.loadLocally(this.cardsUrl))
            {
                Logger.info("\t-- successfully loaded card data from local file");
                return;
            }
            else
                Logger.warn("Could not load locally");
        }
        
        this.loadFromUrl(this.cardsUrl);
    }

    getAvatarInDPile(jDeck)
    {
        for(let k in jDeck)
        {
            if (jDeck[k] === 0)
                continue;
    
            const _code = this.getVerifiedCardCode(k.replace(/"/g, '').toLowerCase());
            if (this.isAvatar(_code))
                return _code;
        }

        return "";
    }

    getAvatar(jDeck)
    {
        if (jDeck.pool === undefined || jDeck.chars === undefined)
            return "";

        const val = this.getAvatarInDPile(jDeck.chars);
        if (val !== "")
            return val;

        return this.getAvatarInDPile(jDeck.pool)
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
        data.images = this.pImageList.getImageListMap();
        return data;
    }

    getSiteList()
    {
        return this.cardsMap.siteList;
    }

    getImageByCode(code)
    {
        return this.pImageList.getImageByCode(code.toLowerCase());
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

const Instance = new CardDataProvider(Configuration.mapPositionsFile(), Configuration.cardUrl(), Configuration.imageUrl());
Instance.load();

module.exports = Instance;