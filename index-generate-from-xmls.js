
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

    readFile(file)
    {
        let xmlUtf8 = this.readFileWithEncoding(file, "utf-8");
        let enc = this.extractXmlEncoding(xmlUtf8);
        if (enc === "utf-8" || enc === "")
            return xmlUtf8;
        else if (enc === "iso-8859-1")
            enc = "latin1";

        let xmlOther = this.readFileWithEncoding(file, enc);
        if (xmlOther === null)
        {
            console.log(file + " could not be read with encoding " + enc + ". Using UTF-8 instead.");
            return xmlUtf8;
        }
        else
        {
            return Buffer.from(xmlOther).toString();
        } 
    }

    readFileWithEncoding(file, encoding)
    {
        try
        {
            if (encoding === undefined || encoding === null)
                encoding = "utf-8";
            
            return fs.readFileSync(file, { encoding : encoding  });
        }
        catch (err)
        {
            console.error(err);
        }

        return null;
    }

    extractXmlEncoding(content)
    {
        const PATTERN = "encoding=\"";
        let pos = content === null ? -1 : content.indexOf("?>");
        if (pos === -1)
            return "";

        let line = content.substring(0, pos).trim();
        pos = line.indexOf(PATTERN)
        if (pos === -1)
            return "";
        else
            return line.substring(pos + PATTERN.length).replace('"', "").replace('"', "").trim().toLowerCase();
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
        return str;
    } 

    processSetXmlCard(setInfo, cardXml)
    {
        let cardJson = this.extractAttributes(cardXml);
        if (cardJson === null)
            return null;

        cardJson.title = this.sanatiseString(this.removeQuotes(this.extractAttribute(cardXml, "name")));
        cardJson.normalizedtitle = cardJson.title.toLowerCase().trim();
        cardJson.ImageName = "https://meccg.es/meta/cards/graphics/en-remastered/" + setInfo.abbrev.toLowerCase() + "/" + this.extractAttribute(cardXml, "graphics");
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

        if (cardJson.type === "Site" && cardJson.region !== undefined)
        {
            cardJson.Region = this.sanatiseString(cardJson.region);
            delete cardJson.region;
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

const updates =  {

}

const addUpdate = function(sTitle, sSet, sSetName)
{
    updates[sTitle] = {
        set: sSet.toUpperCase(),
        name: sSetName
    };
}

addUpdate("Fury of the Iron Crown", "tw", "The Wizards");
addUpdate("Deadly Dart", "le", "The Lidless Eye");
addUpdate("The Arkenstone", "le", "The Lidless Eye");
addUpdate("Fatty Bolger", "tw", "The Wizards");
addUpdate("Ireful Flames", "td", "The Dragons");
addUpdate("Black Arrow", "tw", "The Wizards");
addUpdate("Neeker-breekers", "tw", "The Wizards");
addUpdate("The Iron Crown", "tw", "The Wizards");

console.log(updates);

const json = new Xml2Json().createCardsJson(__dirname + "/data-local/xmls");
const res = []
for (let card of json)
{
    if (card.set_code === "FB" || card.set_code === "DF")
        continue;

    if (card.set_code === "PR")
    {
        if (updates[card.title] !== undefined)
        {
            const newTimCode = "(" + updates[card.title].set + ")";
            card.code = card.code.replace(card.trimCode, newTimCode);
            card.ImageName = card.ImageName.replace("/" + card.set_code.toLowerCase() + "/", "/" + updates[card.title].set.toLowerCase() + "/");
            card.set_code = updates[card.title].set;
            card.full_set = updates[card.title].name;
            card.trimCode = "(" + updates[card.title].set + ")";
            console.log("Updating " + card.code);
        }
        else
        {
            console.log("Cannot find " + card.title);
        }
    }

    res.push(card);
}

if (json.length > 0)
{
    fs.writeFileSync(__dirname + "/data-local/cards.json", JSON.stringify(res, null, '\t'), 'utf-8');
    console.log(json.length + " cards saved to ./data-local/cards.json");
}
else
    console.log("No cards available. Aborting...");
