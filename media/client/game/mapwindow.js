
const MapWindow = {

    _isReady : false,
    _lastMapRequestId : -1,

    assertValidMessage : function(id)
    {
        if (typeof id !== "undefined" && MapWindow._lastMapRequestId < id)
        {
            MapWindow._lastMapRequestId = id;
            return true;
        }
        else
            return false;
    },

    /**
     * Get IFrame message
     * @param {json} e Data from iframe
     */
    onMessage : function(e)
    {
        let sCompany = MapWindow.close();
        let jData = e.data;

        if (jData.type === "set" && typeof sCompany !== "undefined" && sCompany !== "")
        {
            MeccgApi.send("/game/company/location/set-location", {
                companyUuid: sCompany,
                start: jData.start, 
                regions: jData.regions, 
                destination: jData.target
            });
        }
    },

    close : function()
    {
        jQuery("#map-window").addClass("hide");

        let jFrame = jQuery("#map-iframe");
        let sCompany = jFrame.attr("data-company");
        jFrame.attr("src", jFrame.attr("data-blank"));
        jFrame.attr("data-company", "");
        return sCompany;
    },

    onClose : function(e)
    {
        MapWindow.close();

        e.preventDefault();
        return false;
    },

    init : function()
    {
        if (!MapWindow._isReady)
        {
            jQuery("body").append(`<div id="map-window" class="map-window hide">
                    <div class="map-overlay"></div>
                    <iframe src="/blank" class="map-view" id="map-iframe" data-blank="/blank" data-company=""></iframe>
                    </div>`);

            jQuery("#map-window .map-overlay").click(MapWindow.onClose);

            /* Getting the message from the iframe */
            window.onmessage = MapWindow.onMessage;
            MapWindow._isReady = true;
        }
    },

    /**
     * Show Rules
     * @param {String} sRule 
     */
    showRules : function(sRule)
    {
        let jFrame = jQuery("#map-iframe");
        jFrame.attr("data-company", "");
        jFrame.attr("src", "/rules/" + sRule);
        jQuery("#map-window").removeClass("hide");
    },

    showMap : function(company, code, messageId)
    {
        if (!MapWindow.assertValidMessage(messageId) || company === undefined || company === "" || typeof messageId === "undefined")
            return;

        if (code === undefined)
            code = "";

        let jFrame = jQuery("#map-iframe");
        jFrame.attr("data-company", company);
        jFrame.attr("src", "/map/regions?code=" + code);

        jQuery("#map-window").removeClass("hide");
    },

    onShowMapMessageEvent : function(e)
    {
        MapWindow.showMap(e.detail.company, e.detail.code, e.detail.id);
    },
};

jQuery(document).ready(MapWindow.init);

document.body.addEventListener("meccg-map-show", MapWindow.onShowMapMessageEvent, false);
