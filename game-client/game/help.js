

(function() 
{ 
    if (typeof MapWindow === "undefined")
        return;

    const elem = document.createElement("i");
    elem.setAttribute("class", "fa fa-question-circle");
    elem.setAttribute("aria-hidden", "true");

    const div = document.createElement("div");
    div.setAttribute("class", "icons");
    div.appendChild(elem);

    const divParent = document.createElement("div");
    divParent.setAttribute("class", "help-wrapper blue-box cursor-pointer");
    divParent.appendChild(div);
    divParent.onclick = () => MapWindow.showIframe("/help", "");
    
    document.body.appendChild(divParent);
})();
