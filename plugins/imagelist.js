
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
        return imageUrl + "/" + setCode + "/" + imageName;
    }

    newImage(card, imageUrl) 
    {
        let isDCErratum = card.erratum !== undefined && card.erratum === true;
        let isICErratum = card.ice_errata !== undefined && card.ice_errata === true;
        
        if (isDCErratum)
            this.g_nCountErrataDC++;

        if (isICErratum)
            this.g_nCountErrataIC++;

        return {
            title: card.title,
            image: ImageList.createImageUrl(card.ImageName, card.set_code.toUpperCase(), imageUrl),
            errata_dc : isDCErratum ? ImageList.createImageUrl("dce-" + card.ImageName, card.set_code.toUpperCase(), imageUrl) : "",
            errata_ic : isICErratum ? ImageList.createImageUrl("ice-" + card.ImageName, card.set_code.toUpperCase(), imageUrl) : "",
            set_code: card.set_code.toUpperCase()
        };
    };

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

    init(jsonCards, imageUrl)
    {
        if (imageUrl !== undefined)
        {
            this.g_ImageList = this.createImageList(jsonCards, ImageList.removeEndingSlash(imageUrl));
            this.g_QuestList = require("./cards-quests").identifyQuests(jsonCards);
        }
    }

    getImages()
    {
        return this.g_ImageList;
    }

    getList()
    {
        return {
            images: this.g_ImageList,
            fliped : this.g_QuestList
        };
    }

}

const pImageList = new ImageList();

exports.init = (jsonCards, imageUrl) => pImageList.init(jsonCards, imageUrl);

exports.getImages = () => pImageList.getImages();

exports.getList = () => pImageList.getList();