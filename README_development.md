# Development Information

This project allows you to play MECCG or similar.

*Middle-earth CCG and LotR are trademarks of Middle-earth Enterprises and/or Iron Crown Enterprises. This is not affiliated with Middle-earth Enterprises or Iron Crown Enterprises.*

## Getting started

Make sure you have [Node.js](http://nodejs.org/) installed. You will find further details about development and adaptation at the end of this page.

Open your terminal and access this project folder. THen run the following commands:

````
npm install
npm run dev
````

Your app should now be running on [localhost:8080](http://localhost:8080/).

### Environment variables explained

The application will make use of the local data files using `ENV` variables.

`PORT` sets the app's port (8080) 

`IMAGE_PATH` allows you to point to the subdirectory where your card images are stored. You can also use an URL to load external resources via a CDN or similar. If you use local images at `./data-local/images`, these will be made available via the url path `/data-local/images` on startup automatically.

`CARDURL` allows to specify where the card data is retreived from. If you have stored a local card file at `./data-local/cards.json`, this will be discovered automatically and used instead of pulling data.

`MAPPOS` is the filename of your position marker geo coordinates (map-positions-example.json)

Card data and images *are not part of this project* and you will have to provide them. See below for further information about how to do that.

### In Production

You can start this app via `node start`, but you will have to set your own ENV variables. They will not be taken from the start command automatically.

## Development

The application consits of 2 general part:

* Backend Server
* Frontend Application

The backend application's source can be found in the `./game-server` directory. Additional plugin/customisation code is located in `./plugins`.

The frontend HTML pages are located in the `./pages` folder. The JavaScript files are in the `./game-client` folder.

### Unit Testing

You can execute unit tests via `node test`.

### Understanding Plugins

The plugin folder is used to easily separate customisations from the core application, e.g. how card files are evaluated etc. Here, all images, map data and card information are gathered and processed. These will be used by the core application later.

In addition, you can also add certain events. Thereby, you could add certain access points or data to implement your own game.

### The game server

The game server (backend application) handles all the game play, deck accessing, etc.

A game room will be created for every new game and it has its own deck handler, gameplay manager, scores etc. to keep things separate per game.

The main access points are via `socket.io` once you are *at the table*.

### The game frontend

The frontend consist of several separate applications which are separated by dedicated folders, e.g.

* Card browser
* Deckbuilder
* Map view
* Game table

## Card data and images

### Providing Card Data

The card data file is central, because all further data is generated from it (which images and sites to use, etc.). 

There are two ways to provide for this json object:

* deploy the card data json file to ``cards.json``. See the section *Providing your own cards* down below for more detailed information.
* setup a dedicated CDN server and provide the endpoint to query the json from via your configuration file.

The file/url will be accessed via the env. variable `CARDURL`.

### Providing Card Images

Images can either be accessed as part of this project (subfolder) or via an external URL (*https* will be required and you will can use the env variable is `IMAGE_PATH`).

The image URL is being constructed as part of the `plugins/imagelist.js` module. Your own endpoint may be added via the configuration file. 

However, if your own cards.json file uses absolute image paths, those will be used explicitly.

## Maps

You have the following default adaptation possibilities:

* Providing your own map
* Adding markers to your map

### Providing your own map

To provide your own map, "simply" create all the necessary tiles and deploy them to 

`/media/maps/regions/`

A map file usually has a resolution of 5.376x5.376px or 13.312x13.312px

The following script uses imagemagic to create tiles from a map saved as map.jpg.

```
#!/bin/bash

maxTiles=1

for i in `seq 1 8`
do
    width=$maxTiles
    a=$((256*$width))

    echo "${i}.\tmkdir ./${i}"
    mkdir "./${i}"

    echo "${i}.\tconvert ./map.jpg -resize ${a}x${a} ./${i}/map.jpg into tiles $maxTiles"
    convert ./map.jpg -resize ${a}x${a} ./${i}/map.jpg

    echo "${i}.\tcreate tiles"
    convert ./${i}/map.jpg -crop 256x256 -set filename:tile "%[fx:page.x/256]_%[fx:page.y/256]" +repage +adjoin "./${i}/tile_%[filename:tile].jpg"

    echo "--------"

    maxTiles=$(($maxTiles*2))
done
```

During startup, all sites and regions will be extracted from your `cards.json`. 

Sites will be grouped by their regions and various alignments. The resulting format will be as follows

```
{
    "map": {
        "Arthedain": {
            "title": "Arthedain",
            "code": "Arthedain (TW)",
            "region_type": "",
            "area": [
                78.5343113218071,
                -108.14941406250001
            ],
            "sites": {
                "Bree": {
                    "area": [
                        78.63000556774836,
                        -107.35839843750001
                    ],
                    "underdeep": false,
                    "hero": {
                        "code": "Bree [H] (TW)",
                        "hold": "Border-hold"
                    }
                }
            }
        },
        "Rhudaur": {
            "title": "Rhudaur",
            "code": "Rhudaur (TW)",
            "region_type": "",
            "area": [
                79.24538842837468,
                -101.73339843750001
            ],
            "sites": {
                "Rivendell": {
                    "area": [
                        79.38390485685704,
                        -100.76660156250001
                    ],
                    "underdeep": false,
                    "hero": {
                        "code": "Rivendell [H] (TW)",
                        "hold": "Haven"
                    }
                }
            }
        }
    },
    "mapregions": {
        "Bree [H] (TW)": "Arthedain",
        "Rivendell [H] (TW)": "Rhudaur"
    },
    "alignments": [
        "hero"
    ],
    "images": {

    }
}
```
Map positions (i.e. their geo coordinates on you rmap) will me merged from your `map-positions.json` automatically.

### Adding markers to your map

You can edit your map quite conveniently by accessing the map editor via the URL path `/map/regions/edit`. 

Select the region from the list. This will load all images (sites and regions) in a list. 

To add a marker, click on an image first. Thereafter, click on the map. The position marker will be added to the map immediately. You can repeat these steps for every site and re-locate the markers at any time.

You can save your changes to your clipboard by clicking on the save icon. Thereafter, you have to manually merge these into your `map-positions.json`. The changes will be available after a restart the application.

## Providing your own cards

### Automatically importing cards, e.g. from GCCG

If you have created your game with GCCG, you may try and import those automatically. 

```
npm run build_xmls
```

This import process requires a master set XML file to be available at `./data-local/xmls/sets.xml` and its content needs to look simiar to this.

```
<?xml version="1.0" encoding="UTF-8"?>
<ccg>
  <cardset source="spoiler1.xml"/>
  <cardset source="spoiler2.xml"/>
</ccg>
```

Other nodes and information will be ignored.

Your individual set spoiler xml files referenced therein must be found at a subdirectory `./data-local/xmls/xmls`, e.g. `./data-local/xmls/xmls/spoiler1.xml`.

During the import process, those card sets will be processed in the order of your xml nodes. The structure of such a spoiler xml file should be similar to this one:

```
<?xml version="1.0" encoding="UTF-8"?>
<ccg-setinfo name="MYNAME" dir="ImageSubdirectory" abbrev="MN">
    <cards>
        <card name="John Doe" graphics="JohnDoe.jpg" text="Some description text">
            <attr key="unique" value="yes"/>
            <attr key="skills" value="Warrior"/>
            <attr key="type" value="Hero Character"/>
        </card>
    <cards>
</ccg-setinfo>
```

When using this format, the importer automatically creates your json card file for you.

The card's image will automatically be set to `"/data-local/images/{ImageSubdirectory}/${graphics}"` and you have to make sure the graphic can be fount at this location.

*The files will be read using `UTF-8`.*

### Manually creating card data

Now, this is not trivial at all, because you will have to put quite a lot of effort into your data.

However, the data structure itself is quite simple, because a simple JSON array of card data properties is all that is required:

```
[{ ... }, { ... }, ...]
```

You can either store this file locally at or make it available via your CDN.

The images can either be obtained via a remote server or from your local file system. The configuration file needs to be updated accordingly (see above).

The basic card data object is similar to this

```
{
    "alignment": "Hero|Minion|Neutral",
    "type": "Resource|Hazard|Character|Site|Region",
    "uniqueness": true|false,
    "title": "Precious Gold Ring",
    "normalizedtitle": "precious gold ring",
    "code": "Precious Gold Ring (TW) [H]",
    "ImageName": "metw_preciousgoldring.jpg",
    "set_code": "METW",
    "Region": "title of the respective region (for sites only)",
}
```

Each card is identified by its unique `code` and all quotes will be stripped when loading to avoid invalid html tags. 

If a card's `uniqueness` is `true`, the deckbuilder will only add it to your deck once. Otherwise, a card can be added up to three times.

Importantly, the general code should look similar to this:

`NAME [ALIGNMENT] (SET)`

e.g.

`Precious Gold Ring [H] (TW)`

*Importantly,* a region does not have an alignment in its code and follows the notation

`NAME (SET)`

The `alignment` value allows to differentiate hazard cards ("neutral") from non-hazards.

The `type` has implications on a card's playability:

* Only *Characters* can create a company.
* A *Resource* or *Hazard* can be attached to a chatacter or placed in the staging/event area.
* A *Region* or *Site* will only be available in the map to choose from.

The `set_code` is required and only used for image path purposes (see above). You may limit your cards to exactly one set also.

## Architecture

The web server handles everything but the in-game communication.

The in-game communication is handled via `socket.io` websockets and a reconnection attempt is triggerd automatically should a connection be lost (may happen depending on your internet connection stability).

A websocket requires "knowledge" of the game room's individual access key and your temporary user id.

The access verification will be handled during the `socket.io`handshake.

All these information are served with the game's HTML file in a dedicated `script` block.

Strong content-security-policy (CSP) restrictions are imposed on the game page to really limit connectivity to the sources absolutely essential to play the game - so in theory, a cross-site scripting (XSS) attacks should not be possible. Code injections would be denied as well. Even potential image src attacks should be impossible, because each card graphic is validated by its code (and other images would be blocked due to the CSP settings.

The deck data is also matched against the available card data and used as a read-only source to create a new and individual deck object. The number of cards in your deck is also limited to 300.

## Security

### Content Security Policy

This project does not require any databases or other storage containers. Everything is held in memory only.

All card images can be requested from a content delivery server (CDS) to keep images and this application separate.

To avoid cross-site-scripting attacks from the game participant's, the following *Content-Security-Policy* and *X-Content-Security-Policy* are applied in a game:

* default-src 'self'
* script-src 'self'
* img-src 'self' (and the CDS)

*Content-Security-Policy violation attempts can be reported if you provide such an endpoint and additional configuration setting.*

### Usernames

All usernames will be evaluated and the following rules applied:

* Leading and ending whitespaces will be removed.
* The username will be reduced to 30 characters if necessary.
* It will be stripped from any quotes characters.

A username will be rejected if it contains HTML breaking characters `<` or `>` and the login attempt will fail.

## Current Third-Party on Github

[Cardnum - Play Online](https://github.com/rezwits/cardnum)

[GCCG - Play online](https://github.com/council-of-rivendell)

## License

All information is given at the repository start page. Please consult https://github.com/Heinrich-Barth/sit-down-and-play/blob/main/LICENSE as well.

