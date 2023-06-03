


class BackgroundChooser extends PreferenceChoise 
{
    getHeadline()
    {
        return "Choose Background";
    }

    getDescription()
    {
        return "Click on am image to immediately choose it or click anywhere else to close the panel";
    }

    insertOption(folder)
    {
        const elem = document.createElement("div");
        elem.setAttribute("class", "dice-option image-option " + folder);
        elem.setAttribute("data-type", folder);
        elem.setAttribute("title", "Click to use this background");
        elem.onclick = (e) => this.onDiceClick(e.target);
        elem.innerText = " ";

        return elem;
    }

    _replaceBackground(sNew)
    {
        if (sNew === undefined || sNew === "" || document.body.classList.contains(sNew))
            return false;

        document.body.classList.add(sNew)

        let list = document.body.classList;
        for (let _name of list)
        {
            if (_name !== sNew && _name.indexOf("bg-") === 0)
                document.body.classList.remove(_name);
        }

        return true;
    }

    onClickPerformed(elem)
    {
        this._replaceBackground(elem);
        this.updateCookie("background", elem);
    }
}

document.body.addEventListener("meccg-background-chooser", () => new BackgroundChooser().init("/data/backgrounds"), false);
