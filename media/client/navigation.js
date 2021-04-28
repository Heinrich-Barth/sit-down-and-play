

function MECCGNavigation() 
{ 
}

MECCGNavigation.prototype.insertCSS = function()
{
    /** add CSS  */
    jQuery("<link>", {
        rel: "stylesheet",
        type: "text/css",
        href: "/media/assets/css/navigation.css"
    }).appendTo('head');
};


MECCGNavigation.prototype.onReady = function()
{
    const nSize = list.length;
    if (nSize === 0)
        return;

    this.insertCSS();

    let jNav = jQuery("<div>", {
        class: "blue-box navigation",
    });

    for (let i = 0; i < nSize; i++)
    {
        const _item = list[i];
        jNav.append(`<a href="${_item.href}">${_item.name}</a>`);
    }

    jNav.appendTo("body");
};


jQuery(document).ready(function()
{
    jQuery.get("/data/navigation", { }, new MECCGNavigation().onReady);
});
