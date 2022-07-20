
const ReadDeck = {
    
    isJson : function(data)
    {
        return data.startsWith("{");
    },

    isTextDeck : function(data)
    {
        return data.indexOf("####") > 0;
    },
   
    convert : function(data)
    {
        const deck = this.createDeck(data);
        if (deck !== null)
            document.body.dispatchEvent(new CustomEvent("meccg-deck-available", { "detail": deck }));
    },

    createDeck : function(data)
    {
        if (data !== null && data !== "")
        {
            if (this.isJson(data))
                return JSON.parse(data);
            else if (this.isTextDeck(data))
                return this.convertDeck(data)
        }

        return null;
    },

    convertDeck : function(data)
    {
        const deck = {};

        deck.pool = this.getCardListSection(data, "Pool");
        deck.sideboard = this.getCardListSection(data, "Sideboard");

        this.mergeMaps(deck.sideboard, this.getCardListSection(data, "Sideboard vs. fw"));

        const deckSection = this.extractDeckPart(data, "Deck");
        deck.hazards = this.getCardList(this.extractDeckSectionSpecifica(deckSection, "Hazard"));
        deck.character = this.getCardList(this.extractDeckSectionSpecifica(deckSection, "Character"));
        deck.resources = this.getCardList(this.extractDeckSectionSpecifica(deckSection, "Resource"));
        deck.notes = this.extractDeckPart(data, "Notes");
        return deck;
    },

    extractDeckSectionSpecifica(text, label)
    {
        const pattern = label + " (";
        let nOffset = text.indexOf(pattern);
        if (nOffset === -1)
            return "";

        nOffset = text.indexOf("\n", nOffset);
        if (nOffset === -1)
            return;

        const nEnd = text.indexOf("#", nOffset);
        if (nEnd === -1)
            return text.substring(nOffset);
        else
            return text.substring(nOffset, nEnd).trim();
    },

    getCardListSection : function(data, label)
    {
        return this.getCardList(this.extractDeckPart(data, label));
    },

    extractDeckPart : function(data, label)
    {
        const pattern = "##\n" + label + "\n##";
        let nOffset = data.indexOf(pattern);
        if (nOffset === -1)
            return "";
        
        nOffset = data.indexOf("\n", nOffset + pattern.length);
        if (nOffset === -1)
            return "";
        else
        {
            const nEnd = data.indexOf("\n##", nOffset);
            return nEnd === -1 ? data.substring(nOffset).trim() : data.substring(nOffset, nEnd).trim();
        }
    },

    ignoreLine: function(line)
    {
        return line === "" || line.startsWith("#");
    },

    getCardList : function(text)
    {
        const deck = {};
        const lines = text.split("\n");

        for (let _line of lines)
        {
            const num = this.ignoreLine(_line) ? 0 :  this.extractNumber(_line);
            if (num > 0)
            {
                const code = this.extractCardCode(_line);
                this.addToDeckEntry(deck, code, num);
            }
        }

        return deck;
    },

    addToDeckEntry : function(deck, code, num)
    {
        if (code !== "" && num > 0)
        {
            if (deck[code] === undefined)
                deck[code] = num;
            else
                deck[code] += num;
        }
    },

    extractCardCode : function(entry)
    {
        const nPos = entry === "" ? -1 : entry.indexOf(" ");
        if (nPos === -1)
            return "";
        else
            return entry.substring(nPos+1).trim();
    },

    extractNumber : function(entry)
    {
        const nPos = entry === "" ? -1 : entry.indexOf(" ");
        if (nPos === -1)
            return 0;

        try
        {
            const val = entry.substring(0, nPos).trim();
            const num = parseInt(val);
            if (!isNaN(num))
                return num;
        }
        catch(err)
        {
            console.error(err);
        }

        return 0;
    },
    mergeMaps:function(target, other)
    {
        if (target === undefined || other === undefined)
            return;

        for (let keys of Object.keys(other))
        {
            if (target[keys] === undefined)
                target[keys] = other[keys];
            else
                target[keys] += other[keys];
        }
    },
    toString(jDeck, title, notes)
    {
        console.log(jDeck);
        let text = `#
# GCCG v0.9.4 Middle-earth deck
#
# ${title}
#

####
Deck
####`;

        text += this.toStringPart(jDeck.deck.hazards, "Hazard");
        text += this.toStringPart(jDeck.deck.characters, "Character");
        text += this.toStringPart(jDeck.deck.resources, "Resource");

        text += `

####
Pool
####`;

        text += this.toStringPart(jDeck.pool.characters, "Character");
        text += this.toStringPart(jDeck.pool.resources, "Resource");
        text += this.toStringPart(jDeck.pool.hazards, "Hazard");

        text += `

####
Sideboard
####`;

        text += this.toStringPart(jDeck.sideboard.characters, "Character");
        text += this.toStringPart(jDeck.sideboard.resources, "Resource");
        text += this.toStringPart(jDeck.sideboard.hazards, "Hazard");
        if (notes !== "")
        {
            text += `

####
Notes
####
${notes}`        
        }


        return text;
    },

    toStringPart(jDeck, label)
    {
        if (jDeck === undefined)
            return "";

        let body = "";
        let count = 0;
        for (let code of Object.keys(jDeck))
        {
            if (jDeck[code] > 0)
            {
                count += jDeck[code];
                body += "\n" + jDeck[code] + " " + code;
            }
        }

        if (count === 0)
            return "";
        else
            return "\n\n# " + label + " (" + count + ")\n" + body;
    }
}

if (typeof module !== "undefined" && typeof module.exports !== "undefined")
    module.exports = ReadDeck;
else
    document.body.addEventListener("meccg-file-dropped", (e) => ReadDeck.convert(e.detail), false);
