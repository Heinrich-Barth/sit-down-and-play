
class ImageList {

    constructor()
    {
        this.g_ImageList = {};
        this.g_ImageListMap = {};
        this.g_QuestList = {};
        this.g_nCountErrataDC = 0;
        this.g_nCountErrataIC = 0;
    }
    
    static removeEndingSlash(imageUrl)
    {
        return imageUrl.endsWith("/") ? imageUrl.substring(0, imageUrl.length - 1) : imageUrl;
    }

    static createImageUrl(imageName, setCode, imageUrl)
    {
        return imageName;
    }

    newImage(card, imageUrl) 
    {
        const isDCErratum = card.ImageNameErrataDC !== undefined && card.ImageNameErrataDC !== "";
        
        if (isDCErratum)
            this.g_nCountErrataDC++;


        const data = {
            image: ImageList.createImageUrl(card.ImageName, card.set_code.toUpperCase(), imageUrl)
        };

        if (typeof card["ImageNameES"] === "string")
            data["imageES"] = ImageList.createImageUrl(card.ImageName, card.set_code.toUpperCase(), imageUrl);

        if (isDCErratum)
            data.ImageNameErrataDC = ImageList.createImageUrl(card.ImageNameErrataDC, card.set_code.toUpperCase(), imageUrl);

        return data;
    }

    createImageList(jsonCards, imageUrl) 
    {
        let list = {};

        for (let card of jsonCards) 
            list[card.code] = this.newImage(card, imageUrl);

        console.log("\t- image url prefix: " + imageUrl);
        console.log("\t- IC errata images available: " + this.g_nCountErrataIC);
        console.log("\t- DC errata images available: " + this.g_nCountErrataDC);

        return list;
    }

    createImageListMap(jsonCards, imageUrl) 
    {
        let list = {};

        for (let card of jsonCards) 
        {
            if (card.type === "Site" || card.type === "Region")
                list[card.code] = this.newImage(card, imageUrl);
        }
        return list;
    }

    identifyQuestImages(cards)
    {
        const questsB = { };
        const quests = { };

        for (let card of cards)
        {
            const flipTitle = card["flip-title"].replace(" 2", "").replace(" A", "").replace(" 1", "").replace(" B", "");
            if (flipTitle!== card.normalizedtitle)
            {
                questsB[flipTitle] = card.code;
                questsB[flipTitle + card.alignment] = card.code;
            }
        }

        for (let card of cards)
        {
            const alignTitle = card.normalizedtitle + card.alignment;
            if (questsB[alignTitle] !== undefined)
            {
                const cardCodeA = card.code;
                const cardCodeB = questsB[alignTitle];
                quests[cardCodeA] = cardCodeB;
                quests[cardCodeB] = cardCodeA;
            }
        }

        console.log("\t- Flipped cards available: " + Object.keys(quests).length);
        return quests;
    }

    create(jsonCards, imageUrl)
    {
        if (imageUrl !== undefined)
        {
            this.g_ImageList = this.createImageList(jsonCards, ImageList.removeEndingSlash(imageUrl));
            this.g_ImageListMap = this.createImageListMap(jsonCards, ImageList.removeEndingSlash(imageUrl));
            this.g_QuestList = this.identifyQuestImages(jsonCards);
        }
    }

    getImageListMap()
    {
        return this.g_ImageListMap;
    }

    getImageList()
    {
        return this.g_ImageList;
    }

    getQuestList()
    {
        return this.g_QuestList;
    }

    getLists()
    {
        return {
            images: this.g_ImageList,
            fliped : this.g_QuestList
        };
    }

}

module.exports = ImageList;
