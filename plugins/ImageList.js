
class ImageList {

    constructor()
    {
        this.g_ImageList = {};
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
        let isDCErratum = card.ImageNameErrataDC !== undefined && card.ImageNameErrataDC !== "";
        let isICErratum = false;
        
        if (isDCErratum)
            this.g_nCountErrataDC++;

        if (isICErratum)
            this.g_nCountErrataIC++;

        return {
            title: card.title,
            image: ImageList.createImageUrl(card.ImageName, card.set_code.toUpperCase(), imageUrl),
            ImageNameErrataDC : isDCErratum ? ImageList.createImageUrl(card.ImageNameErrataDC, card.set_code.toUpperCase(), imageUrl) : "",
            errata_ic : "",
            set_code: card.set_code.toUpperCase()
        };
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

    create(jsonCards, imageUrl)
    {
        if (imageUrl !== undefined)
        {
            this.g_ImageList = this.createImageList(jsonCards, ImageList.removeEndingSlash(imageUrl));
            this.g_QuestList = require("./CardsQuests").identifyQuests(jsonCards);
        }
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
