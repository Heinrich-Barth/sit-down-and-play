const Loading = {

    assets: [],

    addAsset: function(url, label)
    {
        this.assets.push({
            url: url,
            label: label
        });
    },
    
    createFetchs: function()
    {
        let listFetches = [];

        for (let elem of this.assets)
            listFetches.push(fetch(elem.url).then(() => Loading.updateLabel(elem.label)));

        return listFetches;
    },

    updateLabel: function(text)
    {
        document.getElementById("detail").innerText = text;
    },

    createList : function()
    {
        this.addAsset("/data/list/cards", "Cards loaded");
        this.addAsset("/data/list/images", "Images loaded");
        this.addAsset("/data/list/underdeeps", "Underdeeps loaded");
        this.addAsset("/data/list/map", "Map loaded");
        this.addAsset("/data/list/sites", "Sites loaded");
        this.addAsset("/media/assets/backgrounds/home.webp", "Background loaded");        
    },

    init : function()
    {
        this.createList();

        const list = this.createFetchs();
        Promise.all(list).then(() => window.location.href = "/").catch((error) => {
            document.getElementById("detail").innerText = error.message;
            console.error(error);
        });
    }
}

Loading.init();
