


(function()
{
    document.getElementById("field1").focus();

    let vpList = document.getElementsByClassName("hidden");
    if (vpList !== null)
    {
        for (let i = vpList.length - 1; i >= 0; i--)
            vpList[i].classList.remove("hidden");
    }
    
    const elem = document.getElementById("theform");
    elem.setAttribute("action", "/login");
    elem.setAttribute("method", "post");

    document.querySelector("button").onclick = () => 
    {
        const pField = document.getElementById("field1");
        if (pField === null)
            return false;
    
        const name = pField.value.trim();
        if (name.length <= 2)
        {
            pField.focus();
            return false;
        }
        else
        {
            document.querySelector("form").submit();
        }
    }

    document.getElementById("field1").focus();

})();
