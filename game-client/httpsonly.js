
/**
 * Force redirect to HTTPs if necessary (but not if localhost)
 * @returns void
 */
(function()
{
    if (location.protocol !== "https:" && window.location.href.toLocaleLowerCase().indexOf("http://localhost:") !== -1) 
        location.protocol = "https:";
})();