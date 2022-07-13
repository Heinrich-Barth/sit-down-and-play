
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
        const data = this.readFile(this.baseDir + "/metw.xml");
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

    processSetXml(file, setIndex)
    {
        const data = this.readFile(file);
        if (data === null)
            return null;

        const setinfo = this.extractNodeSimpleLine(data, "ccg-setinfo");
        const result = {
            name : this.extractAttribute(setinfo, "name"),
            dir : this.extractAttribute(setinfo, "dir"),
            abbrev : this.extractAttribute(setinfo, "abbrev"),
            size : 0,
            order: setIndex,
            cards: { }
        };

        let count = 0;
        let offset = 0, _end, _card;
        while (offset !== -1)
        {
            offset = data.indexOf("<card ", offset);
            if (offset === -1)
                break;

            _end = data.indexOf("</card>", offset);
            if (_end === -1)
                break;
            
            _card = data.substring(offset, _end);
            offset = _end;

            let json = this.extractAttributes(_card);
            if (json === null)
                continue;

            json.title = this.sanatiseString(this.removeQuotes(this.extractAttribute(_card, "name")));
            json.normalizedtitle = json.title.toLowerCase().trim();
            json.ImageName = "/data/images/" + result.dir + "/" + this.extractAttribute(_card, "graphics");
            json.alignment = this.getAlignmentByType(json.type);
            json.type = this.removeAlignmentPrefix(json.type);
            json.text = this.extractAttribute(_card, "text");
            json.full_set = result.name;
            json.set_code = result.abbrev;
            json.trimCode = "(" + json.set_code + ")";

            if (json.class !== undefined)
            {
                json.Secondary = json.class;
                delete json.class;
            }
            if (json.unique !== undefined)
            {
                json.uniqueness = json.unique;
                delete json.unique;
            }

            

            if (result.cards[json.normalizedtitle] === undefined)
                result.cards[json.normalizedtitle] = [json];
            else
                result.cards[json.normalizedtitle].push(json);

            for (let _key of Object.keys(json))
            {
                if (!this.knownKeys.includes(_key))
                    this.knownKeys.push(_key);
            }

            if (json.type !== undefined && !this.knownTypes.includes(json.type))
                this.knownTypes.push(json.type);

            count++;
        }

        result.size = count;
        return result;
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

    getAlignmentByType(type)
    {
        if (type === "Hazard")
            return "Neutral";
        else if (type.startsWith("Hero "))
            return "Hero";
        else if (type.startsWith("Minion "))
            return "Minion";
        else if (type.startsWith("Fallen-"))
            return "Fallen-wizard";
        else if (type.startsWith("Grey "))
            return "Grey";
        else if (type.startsWith("Elf-lord"))
            return "Elf-lord";
        else if (type.startsWith("Balrog"))
            return "Balrog";
        else if (type.startsWith("Dwarf-lord"))
            return "Dwarf-lord";
        else if (type.startsWith("Dual"))
            return "Dual";
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
        switch(text)
        {
            case "Hero":
                return "H";
            case "Minion":
                return "M";
            case "Fallen-wizard":
                return "FW";
            case "Grey":
                return "G";
            case "Elf-lord":
                return "EL";
            case "Dwarf-lord":
                return "DL";
            case "Balrog":
                return "BA";
            case "Neutral":
                return "";
            default:
                console.warn("Unkown alignment: " + text);
                return "";
        }
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
