
const fs = require('fs');

class Xml2Json
{
    constructor()
    {
        this.dir = "";
        this.baseDir = __dirname + "/data-local/gccg";
        this.setList = [];
        this.knownKeys = ["name", "ImageName", "text"];
        this.knownTypes = [];
    }

    getFileEncoding()
    {
        return 'utf-8';
    }

    readFile(file)
    {
        try
        {
            return fs.readFileSync(file, this.getFileEncoding())
        }
        catch (err)
        {
            console.error(err);
        }

        return null;
    }

    extractNodeSimpleLine(data, open)
    {
        const pattern = "<" + open;

        let pos = data.indexOf(pattern);
        if (pos === -1)
            return "";
            
        const end = data.indexOf(">", pos);
        return end === -1 ? "" : data.substring(pos, end);
    }

    getXmls()
    {
        const data = this.readFile(this.baseDir + "/sets.xml");
        if (data === null)
            return [];

        this.dir = this.baseDir + "/xmls";

        let result = [];
        let offset = 0, _end;
        while (offset !== -1)
        {
            offset = data.indexOf("<cardset ", offset);
            if (offset === -1)
                break;

            _end = data.indexOf(">", offset);
            if (_end === -1)
                break;

            let _val = this.extractAttribute(data.substring(offset, _end), "source");
            if (_val !== "")
                result.push(this.dir + "/" + _val);

            offset = _end;
        }

        return result;
    }

    extractAttribute(input, name)
    {
        const pattern = name + "=\"";
        let pos = input.indexOf(pattern);
        if (pos === -1)
            return "";

        pos += pattern.length;
        const end = input.indexOf("\"", pos);
        return end === -1 ? "" : input.substring(pos, end);
    }


    sanatiseString(str)
    {
        return str.replace(/[\u{0080}-\u{FFFF}]/gu, "");
    } 

    processSetXmlCard(setInfo, cardXml)
    {
        let cardJson = this.extractAttributes(cardXml);
        if (cardJson === null)
            return null;

        cardJson.title = this.sanatiseString(this.removeQuotes(this.extractAttribute(cardXml, "name")));
        cardJson.normalizedtitle = cardJson.title.toLowerCase().trim();
        cardJson.ImageName = "/data/images/" + setInfo.dir + "/" + this.extractAttribute(cardXml, "graphics");
        cardJson.alignment = this.getAlignmentByType(cardJson.type);
        cardJson.type = this.removeAlignmentPrefix(cardJson.type);
        cardJson.text = this.extractAttribute(cardXml, "text");
        cardJson.full_set = setInfo.name;
        cardJson.set_code = setInfo.abbrev;
        cardJson.trimCode = "(" + cardJson.set_code + ")";

        if (cardJson.class !== undefined && cardJson.class !== "")
        {
            /** probably a hazard */
            cardJson.Secondary = this.getSecondaryFromClass(cardJson.class);
            delete cardJson.class;
        }

        if (this.expectEquals(cardJson.type, "Hazard") && this.expectEquals(cardJson.keyword, "Hazard Agent"))
        {
            cardJson.type = "Character";
            cardJson.Secondary = "Agent";
        }
        else if (cardJson.type === "Character")
        {
            if (this.expectEquals(cardJson.keyword, "avatar"))
                cardJson.Secondary = "Avatar";
            else
                cardJson.Secondary = "character";
        }
        else if (cardJson.type === "Site" || cardJson.type === "Region")
        {
            cardJson.Secondary = cardJson.type.toLowerCase();
        }

        if (cardJson.unique !== undefined)
        {
            cardJson.uniqueness = cardJson.unique;
            delete cardJson.unique;
        }

        return cardJson;
    }

    expectEquals(input1, input2)
    {
        return input1 !== undefined && input2 !== undefined && input1.toLowerCase() === input2.toLowerCase();
    }

    isAvatar(input)
    {
        return input !== undefined && input.toLowerCase() === "avatar";
    }

    getSecondaryFromClass(value)
    {
        const val_lower = value.toLowerCase();
        if (val_lower.indexOf(" faction") !== -1 || val_lower.indexOf(" ally") !== -1)
            return this.removeAlignmentPrefix(value);
        else
            return value;
    }

    addCardToSetList(result, cardJson)
    {
        if (result.cards[cardJson.normalizedtitle] === undefined)
            result.cards[cardJson.normalizedtitle] = [cardJson];
        else
            result.cards[cardJson.normalizedtitle].push(cardJson);
    }

    addKnownKeys(cardJson)
    {
        for (let _key of Object.keys(cardJson))
        {
            if (!this.knownKeys.includes(_key))
                this.knownKeys.push(_key);
        }
    }
    
    createSetInfo(setinfo, setIndex)
    {
        return {
            name : this.extractAttribute(setinfo, "name"),
            dir : this.extractAttribute(setinfo, "dir"),
            abbrev : this.extractAttribute(setinfo, "abbrev"),
            size : 0,
            order: setIndex,
            cards: { }
        };
    }

    processSetXml(file, setIndex)
    {
        const data = this.readFile(file);
        if (data === null)
            return null;

        const result = this.createSetInfo(this.extractNodeSimpleLine(data, "ccg-setinfo"), setIndex)

        let count = 0;
        let offset = 0, _end, _card;
        while (offset !== -1)
        {
            offset = data.indexOf("<card ", offset);
            _end = offset === -1 ? -1 : data.indexOf("</card>", offset);
            if (_end === -1)
                break;
            
            _card = data.substring(offset, _end);
            offset = _end;

            const cardJson = this.processSetXmlCard(result, _card);
            if (cardJson !== null)
            {
                this.addCardToSetList(result, cardJson)
                this.addKnownKeys(cardJson);
                this.addKnownTypes(cardJson);
                count++;
            }
        }

        result.size = count;
        return result;
    }
    addKnownTypes(cardJson)
    {
        if (cardJson.type !== undefined && !this.knownTypes.includes(cardJson.type))
            this.knownTypes.push(cardJson.type);
    }

    removeQuotes(sCode) 
    {
        return sCode.replace("&quot;", "").replace("&quot;", "");
    }

    extractAttributes(data)
    {
        let result = {};
        let offset = 0, _end;
        while (offset !== -1)
        {
            offset = data.indexOf("<attr ", offset);
            if (offset === -1)
                break;

            _end = data.indexOf("/>", offset);
            if (_end === -1)
                break;

            let _card = data.substring(offset, _end);
            let _key = this.extractAttribute(_card, "key");
            
            if (_key !== "")
                result[_key] = this.extractAttribute(_card, "value");

            offset = _end;
        }

        return Object.keys(result).length > 0 ? result : null;
    }

    readAllSets()
    {
        const xmls = this.getXmls();
        let index = 1;
        for (let file of xmls)
        {
            let _set = this.processSetXml(file, index);
            if (_set.size > 0)
            {
                index++;
                this.setList.push(_set);
            }
        }
        
        console.log(this.setList.length + " set(s) read");
    }

    createCardsJson(sXmlDir)
    {
        this.baseDir = sXmlDir;
        this.readAllSets();
        return this.mergeSets();
    }

    mergeSets()
    {
        const cardsByName = {};
        for (let set of this.setList)
            this.mergeSetsCards(set, cardsByName);

        return this.createUniqueCards(cardsByName);
    }

    mergeSetsCards(set, cardsByName)
    {
        console.log("Processing set " + set.name + " with " + set.size + " card(s)");
        for (let _name of Object.keys(set.cards))
        {
            if (cardsByName[_name] === undefined)
                cardsByName[_name] = set.cards[_name];
            else
                cardsByName[_name].push(...set.cards[_name]);
        }
    }

    removeAlignmentPrefix(type)
    {
        const pos = type.indexOf(" ");
        return pos === -1 ? type : type.substring(pos+1);
    }

    getAlignmentPrefix(type)
    {
        const pos = type.indexOf(" ");
        return pos === -1 ? "" : type.substring(0,pos);
    }

    getAlignmentByType(type)
    {
        const res = this.getAlignmentPrefix(type);
        if (type !== "")
            return res;
        else if (type === "Hazard")
            return "Neutral";
        else
            return "unspecific";
    }

    createUniqueCards(cardsByName)
    {
        const names = Object.keys(cardsByName);
        names.sort();

        const result = [];
        for (let name of names)
            this.createUniqueCardsMultiple(cardsByName[name], result);

        return result;
    }

    createCardCodeSimple(card)
    {
        return card.title.trim() + " (" + card.set_code + ")";
    }

    createCardCodeComplex(card)
    {
        const al = this.getAlignmentAbbrev(card.alignment);
        if (al === "")
            return this.createCardCodeSimple(card);
        else
            return card.title.trim() + " [" + al + "] (" + card.set_code + ")";
    }

    getAlignmentAbbrev(text)
    {
        if (text.length < 1)
            return text;

        if ("Neutral" === text)
            return "";

        const pos = text.indexOf("-");
        if (pos === -1)
            return text.substring(0, 1);

        let res = "";
        for (let part of text.split("-"))
        {
            if (part !== "")
                res += part.substring(0,1).toUpperCase();
        }
        
        return res;
    }

    createUniqueCardsMultiple(cards, result)
    {
        if (cards.length === 1)
        {
            cards[0].code = this.createCardCodeSimple(cards[0]);
            result.push(cards[0]);
        }
        else if (cards.length > 1)
        {
            for (let card of cards)
            {
                card.code = this.createCardCodeComplex(card);
                result.push(card);
            }
        }
    }
}

const json = new Xml2Json().createCardsJson(__dirname + "/data-local/xmls");
if (json.length > 0)
{
    fs.writeFileSync(__dirname + "/data-local/cards.json", JSON.stringify(json, null, '\t'), 'utf-8');
    console.log(json.length + " cards saved to ./data-local/cards.json");
}
else
    console.log("No cards available. Aborting...");
