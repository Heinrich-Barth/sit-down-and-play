
/**
 * Force redirect to HTTPs if necessary (but not if localhost)
 * @returns void
 */
 (function()
 {
     let sUrl = window.location.href;
     if (window.location.protocol.toLocaleLowerCase().indexOf("https") === 0 || sUrl.toLocaleLowerCase().indexOf("http://localhost:") === 0)
         return;
 
     const nPos = sUrl.indexOf("//");
     window.location.href = "https:" + sUrl.substring(nPos);
 })();