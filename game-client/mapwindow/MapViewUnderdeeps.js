
/**
 * Show Underdeeps Map
 */
class MapViewUnderdeeps extends MapView {

    constructor(data)
    {
        super("underdeeps");

        this.sites = data.sites;
        this.images = data.images;
        this.codeStart = "";
        this.pCurrentObserver = null;
    }

    getStartupLat()
    {
        return 66;
    }

    getStartLon()
    {
        return -90.800;
    }

    getZoomStart()
    {
        return 4;
    }

    getAdjacentSites(code)
    {
        return code === "" || code === undefined || this.sites[code] === undefined ? Object.keys(this.images) : this.sites[code];
    }

    getImage(code)
    {
        return code === "" || code === undefined || this.images[code] === undefined ? "" : this.images[code].image;
    }

    onClickCard(e)
    {
        const code = e.target.getAttribute("data-code");

        const data = {
            start : this.codeStart === "" ? code : this.codeStart,
            regions: [],
            target: this.codeStart !== "" ? code : ""
        }
        document.body.dispatchEvent(new CustomEvent("meccg-map-selected-movement", { "detail":  data }));
    }

    createImage(code, isTapped, isHidden)
    {
        const sUrl = this.getImage(code);
        const sCss = isHidden === true ? "hidden" : "";
        
        const img = document.createElement("img");
        img.setAttribute("decoding", "async");
        if (isTapped !== true)
            img.setAttribute("class", "site-image " + sCss);
        else
            img.setAttribute("class", "site-image site-is-tapped " + sCss);

        if (isHidden === true)
        {
            img.setAttribute("src", "/data/backside");
            img.setAttribute("data-src", sUrl);
        }
        else
        {
            img.setAttribute("src", sUrl);
            img.setAttribute("data-src", sUrl);
        }

        img.setAttribute("data-code", code);
        img.setAttribute("title", code);
        img.onclick = this.onClickCard.bind(this);
        return img;
    }

    insertIntersector(pElement)
    {
        if (document.getElementById("help_observer") !== null)
            return;

        const div = document.createElement("div");
        div.setAttribute("id", "help_observer");
        div.innerHTML = "<p>&nbsp;</p>";
        pElement.appendChild(div);

        return div;
    }

    removeObserver()
    {
        if (this.pCurrentObserver !== null)
        {
            this.pCurrentObserver.disconnect();
            this.pCurrentObserver = null;
        }

        this.pCurrentObserverElement = null;
        DomUtils.remove(document.getElementById("help_observer"));
    }

    createObserver(pElement)
    {
        let elem = this.insertIntersector(pElement);
        this.pCurrentObserverElement = pElement;

        this.pCurrentObserver = new IntersectionObserver(this.onObserving.bind(this));

        this.pCurrentObserver.observe(elem);
    }

    onObserving(entries)
    {
        if (entries[0].intersectionRatio <= 0 || this.pCurrentObserverElement === null) 
            return;

        const list = this.pCurrentObserverElement.querySelectorAll(".hidden");
        if (list === null || list.length === 0)
        {
            this.removeObserver();
            return;
        }

        let len = list.length;
        if (len > 20)
            len = 20;

        for (let i = 0; i < len; i++)
        {
            let _img = list[i];
            _img.setAttribute("src", _img.getAttribute("data-src"));
            _img.classList.remove("hidden");
        }
    }

    populateSites(startingCode)
    {
        this.codeStart = startingCode;
        const elem = document.getElementById("found_sites");
        if (elem === null)
            return;

        const list = this.getAdjacentSites(startingCode);
        for (let code of list)
            elem.appendChild(this.createImage(code));


        const helpCont = document.createElement("div");
        helpCont.setAttribute("id", "allsites");

        const h2 = document.createElement("h2")
        h2.innerText = "All other sites";
        helpCont.appendChild(h2);

        let added = false;
        for (let code of Object.keys(this.images))
        {
            if (!list.includes(code))
            {
                added = true;
                helpCont.appendChild(this.createImage(code, false, true));
            }
        }

        if (added)
        {
            elem.appendChild(helpCont);
            this.createObserver(helpCont);
        }
            
        ArrayList(elem).find("img").each((_e) => CardPreview.initMapViewCard(_e));
    }

}