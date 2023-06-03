
/**
 * Force redirect to HTTPs if necessary (but not if localhost)
 * @returns void
 */
(function()
{
    if (location.protocol !== "https:" && location.hostname !== "localhost") 
        location.protocol = "https:";
})();