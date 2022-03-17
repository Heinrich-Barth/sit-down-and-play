/**
 * Some platforms may "sleep" if they do not receive any http requests.
 * If in a game, many things are cached and it is quite likely that there will
 * not be any "real" request anymore, except for images. If they are distributed
 * via a CDN, these requests also wont "count" and the server may sleep while in a game.
 * 
 * Therefore, this interval makes sure we send a simple ping request (which is not cached)
 * every 20mins
 */
let g_pIntervalID = setInterval(function () {
    fetch("/ping?_t=" + Date.now()).then(() =>
    {
        /** do nothing, simply accept the fetch */
    }).catch(() => 
    {
        /** ignore any errors here */
    });  
}, 1000 * 60 * 20);

/**
 * Allow to clear the ping after a game has ended. If the browser window
 * stays open, the ping will also be sent although not needed anymore.
 */
document.body.addEventListener("meccg-clear-ping", () => {
    if (g_pIntervalID !== null)
    {
        clearInterval(g_pIntervalID);
        g_pIntervalID = null;
    }
}, false);
