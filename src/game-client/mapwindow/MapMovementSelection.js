
class MapViewMovementSelection {

    createInstance()
    {
        document.body.addEventListener("meccg-map-siteclick", this.onReceived.bind(this), false);
    }

    onReceived(e)
    {
        const region = e.detail.regionName;
        const code = e.detail.code;
        const image = e.detail.image;
        const isSite = e.detail.isSite;

        this.onProcessEvent(region, image, isSite, code);
    }

    onProcessEvent(region, image, isSite, code)
    {
        throw new Error("Action needed");
    }

    sendMovement(codeStart, regions, codeTarget)
    {
        if (codeStart === "")
            return;

        if (regions === undefined)
            regions = [];

        if (codeTarget === undefined)
            codeTarget = "";

        const data = {
            start : codeStart,
            regions: regions,
            target: codeTarget
        }
        document.body.dispatchEvent(new CustomEvent("meccg-map-selected-movement", { "detail":  data }));
    }
}
