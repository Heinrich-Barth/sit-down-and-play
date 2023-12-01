class ChangeSeating
{
    #players = [];
    #initialOrder = [];

    static change()
    {
        const map = MeccgPlayers.getUserMap();
        const avatar = MeccgPlayers.getAvatarMap();

        const instance = new ChangeSeating();
        for (let id in map)
            instance.add(id, map[id], avatar[id], MeccgPlayers.isChallenger(id));

        instance.show();
    }

    add(id, name, avatar, isMe)
    {
        if (id === "" || name === "")
            return;

        if (typeof avatar === "undefined")
            avatar = "";

        this.#players.push({
            id: id,
            name: isMe ? "Myself" : name,
            avatar: avatar
        });

        this.#initialOrder.push(id);
    }

    #createLinkAction(id, moveUp)
    {
        const aUp = document.createElement("a");
        aUp.setAttribute("href", "#");
        aUp.setAttribute("data-id", id);
        aUp.onclick = this.onMoveAction.bind(this);

        if (moveUp)
        {
            aUp.setAttribute("data-action", "up");
            aUp.setAttribute("title", "Move up");
            aUp.setAttribute("class", "fa arrow-up fa-arrow-circle-up");
        }
        else
        {
            aUp.setAttribute("data-action", "down");
            aUp.setAttribute("title", "Move down");
            aUp.setAttribute("class", "fa arrow-down fa-arrow-circle-down");
        }

        return aUp;
    }

    #createPlayerEntry(id, name, src)
    {
        const img = document.createElement("img");
        img.setAttribute("src", g_Game.CardList.getImage(src));

        const imgWrapp = document.createElement("div");
        imgWrapp.setAttribute("class", "avatar-box");
        imgWrapp.append(img);


        const pName = document.createElement("span");
        pName.innerText = name;

        const aUp = this.#createLinkAction(id, true);
        const aDown = this.#createLinkAction(id, false);

        const div = document.createElement("div");
        div.setAttribute("class", "avatar-text-box")
        div.append(pName, aUp, aDown);

        const res = document.createElement("li");
        res.setAttribute("class", "label")
        res.setAttribute("data-id", id);
        res.append(imgWrapp, div);
        return res;
    }

    onMoveAction(e)
    {
        const elem = e.target.parentElement.parentElement;
        const moveUp = e.target.getAttribute("data-action") === "up";
        if (moveUp)
            this.#moveElementUp(elem);
        else
            this.#moveElementDown(elem);

        return false;
    }

    #moveElementUp(elem)
    {
        const tagetNode = elem.previousSibling;
        if (tagetNode !== null)
            elem.parentElement.insertBefore(elem, tagetNode); /** this moves the existing node automatically */
    }

    #moveElementDown(elem)
    {
        const directSibling = elem.nextSibling;
        const tagetNode = directSibling === null ? null : directSibling.nextSibling;
        if (tagetNode !== null)
            elem.parentElement.insertBefore(elem, tagetNode); /** this moves the existing node automatically */
        else
            elem.parentElement.appendChild(elem);
    }

    #createButton(isSave)
    {
        const button = document.createElement("button");
        button.onclick = this.onButtonClick.bind(this);

        if (isSave)
        {
            button.setAttribute("data-save", "true");
            button.innerText = "Save changes";
        }
        else
        {
            button.setAttribute("class", "buttonCancel");
            button.innerText = "Ignore changes";
        }

        return button;
    }

    onButtonClick(e)
    {
        const dialog = document.getElementById("change-seating");
        if (dialog === null)
            return;

        const isSaveAction = e.target.hasAttribute("data-save");
        const list = isSaveAction ? this.#getOrder(dialog) : [];
        
        dialog.close();

        if (list.length > 0)
            this.#sendPositionUpdate(list);
    }

    #assertValidPlayerOrder(list)
    {
        if (list.length !== this.#players.length)
        {
            this.#messageError("Invalid number of players.");
            return false;
        }
        else if (this.#initialOrder.join("") === list.join(""))
        {
            this.#messageInfo("Same order. No need to update");
            return false;
        }

        for (let player of this.#players)
        {
            if (!list.includes(player.id))
            {
                this.#messageError("Invalid player array! Cannot and will not update order.");
                return false;
            }
        }

        return true;
    }

    #sendPositionUpdate(list)
    {
        if (this.#assertValidPlayerOrder(list))
            MeccgApi.send("/game/players/reorder", { list: list });
    }

    #getOrder(dialog)
    {
        const elems = dialog.querySelectorAll("li");
        if (elems === null)
            return [];

        const list = [];
        for (let elem of elems)
            list.push(elem.getAttribute("data-id"));

        return list;
    }

    onCloseDialog()
    {
        const dialog = document.getElementById("change-seating");
        if (dialog !== null)
            dialog.parentElement.removeChild(dialog);
    }

    #createHtml()
    {
        const h3 = document.createElement("h3");
        h3.innerText = "Rearrange the seating position.";

        const p = document.createElement("p");
        p.innerText = "Each players plays hazards against the following opponent (you play hazards to your right/following opponent)";

        const ul = document.createElement("ul");
        ul.setAttribute("class", "avatar-list");
        
        for (let elem of this.#players)
            ul.appendChild(this.#createPlayerEntry(elem.id, elem.name, elem.avatar));
        
        const div = document.createElement("div");
        div.setAttribute("class", "button-actions");
        div.appendChild(this.#createButton(true));
        div.appendChild(this.#createButton(false));

        const res = document.createElement("dialog");
        res.onclose = this.onCloseDialog.bind(this);
        res.setAttribute("id", "change-seating");
        res.setAttribute("class", "change-seating");
        res.appendChild(h3);
        res.appendChild(p);
        res.appendChild(ul);
        res.appendChild(div);

        return res;
    }

    #messageInfo(val)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-info", { "detail": val }));
    }

    #messageError(val)
    {
        document.body.dispatchEvent(new CustomEvent("meccg-notify-error", { "detail": val }));
    }

    show()
    {
        if (this.#players.length < 3)
        {
            this.#messageInfo("You can only change player order with more than 2 players.");
            return;
        }

        const dialog = this.#createHtml();
        document.body.appendChild(dialog);
        dialog.showModal();
    }
}