# Collectible Card Game Setup

You will need to follow these steps:

* Provide card data and images (sample data is included)
* Provide the map image slices (optionally, if a map is needed)
* Set the position markers on the map (optionally, if a map is needed)
* Provide starter decks (2 sample decks are included)
* Personalisation with custom dices, backgrounds and sounds (optionally)

Once everything is setup, you can start the project via

````
npm install
npm run build
npm start
````

This will fire up the application and you can access everything via `http://localhost:8080`. 

> The application does not require any additional tech stack such as databases. Player's decks and savegames will be stored locally on the player's disk. You can easily deploy this project in a docker container as well. By default, you would not need any volumes because nothing has to be persisted. A `Dockerfile` is not included in this project, though.

In the beginning, be aware that the http server allows for very strong browser caching, so clear it regularly when testing.

## System Requirements

The project does have a very low resource requirements:

* About 50-60 MB RAM
* Single Core CPU is enough

By default, the project does *does not* spawn separate processes, because room/game management via socket.io does not consider a multi-thread approach.

Of course, you can use a dedicated CDN domain to server static card (and/or map) graphics. However, due to caching settings, this *might not* be necessary. 

## Provide card data and images

There are 3 ways to setup this project.

* use the local sample data of this project
* import data from your (own) ccg games
* use CDN sever that hosts the data files (load balancing, separation of concerns, etc.)

The very last chapter describes how to create map data if necessary (not all CCGs need that).

### Using the sample data provided in this project

You are good to go!

### Using the sample data provided in this project

*Important Information:* This process is likely to change, so it is not as fail proof as one might hope. Generally speaking, the sample data provided here should give you enough of an idea how to transform your xml files into json properly.

You can run the `build from xmls` script to create the `cards.json` data file. To do so, please proceed as follows.

* create the following folders `./data-local/xmls` and `./data-local/xmls/xmls` (yes, that is correct)
* locate your ccg sets.xml file and copy it to `./data-local/xmls/sets.xml`
* copy the individual set spoiler.xmls to `./data-local/xmls/xmls` (you will find those files referenced in your sets.xml file)

Run the following command to create the `./data-local/cards.json` file. Please be aware that existing copies of that file will be overwritten.

````
npm run build_xmls
````

Upon successfull creation of this file, you can copy the card images into the `./data-local/images` directory. It is very probably, that your individual card images are arranged by set folders as given in the spoiler.xml files. Please maintain that structure inside the `./data-local/images` directory as well. You can verify the image path in the json file at any time.

### Using a CDN sever

This project comes with a sample configuration file at `./data/csp-data.json`. 

````
{
    "image" : "https://raw.githubusercontent.com"
}
````

To add more domains, just extend the value string with blank space as delimiter.

## Providing a Map

You can either use the sample map data provided at `./data-local/map-positions.json`.

You can always `edit` the map positions and add new markers to it via `localhost:8080/map/regions/edit`

### Providing map images

If your game uses a map, you will want to provide a map image. These need to be sliced into smaller tile images.

The map library requires tiles to be grouped by zoom level. Each zoom level contians tile images in its respective folder.

The map uses the following zoom levels at 

* `/media/maps/regions/3`
* `/media/maps/regions/4`
* `/media/maps/regions/5`
* `/media/maps/regions/6`

Please see below on how to create such a file using the map editor.

### Creating a suitable map file

To create zoom levels and image tiles, your original map image must have any of the following resolutions:

* 5.376x5.376px 
* 13.312x13.312px

The following scripts use `imagemagic` to create tiles from a map saved as `map.jpg`.

Your original map file may need some resizing. This can be done via any image processing application manually of automatically. Importantly, you may only need to enlarge the canvas size and resize the image by keeping the aspect ratio. For example, you may use this `imagemagic` command to create a `map.jpg`from your original image `map-original.jpg`:

```
convert map-original.jpg -resize 5376x5376  -background Black -gravity center -extent 5376x5376 map.jpg
```

With the resulting `map.jpg`, you may run the following script to create all necesasry tiles and zoom levels.

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

You can move the required zoom level folders to `/media/maps/regions`

The project provides a dedicated endpoint to access the map at `localhost:8080/map/regions`.

### Setting the position markers on the map

Once your map file is ready, you can access the map marker editor via `localhost:8080/map/regions/edit`.

The map is grouped by regions and sites are assigned to a region. Therefore, you start by adding a region marker to the map first. Thereafter, you can add site markers.

## Provide starter decks

Starter decks can be useful for players to check out the game and start right away. You can provide as many starter decks as you want. Starter decks come in "collections", and each collection is represented by a dedicated folder. You can create a new collection, e.g. `Starter Decks` in `./data/decks`. A deck can be constructed with the deckbuilder at `localhost:8080/deckbuilder`.

An example structure may look like this

```
./public/decks/Starter Decks/deckname1.meccg
./public/decks/Starter Decks/deckname2.meccg
```

The deck collections's folder name will be used to group the decks during the deck selection process before a game. The deck's file names will be used (except the file extension) inside your collection list.

The decks will be discovered upon application start automatically.

## Personalisation with custom dices and backgrounds

### Custom Background Images

If you want, you can deploy background image files into the folder `./media/personalisation/backgrounds`. These will be discovered upon application start and made available to the player automatically.

### Custom Dices

Custom dices can be added to the folder `/public/media/personalisation/dice`. A dice collection consists of 6 `PNG` image files which have to be named using a specific pattern, e.g. `dice-1.png` .... `dice-6.png`. Each collection of dice images has to be stored in a separate folder, e.g-

```
./public/media/personalisation/dice/folder1/dice-1.png
./public/media/personalisation/dice/folder1/dice-2.png
./public/media/personalisation/dice/folder1/dice-3.png
./public/media/personalisation/dice/folder1/dice-4.png
./public/media/personalisation/dice/folder1/dice-5.png
./public/media/personalisation/dice/folder1/dice-6.png
```

Dices will be discovered automatically upon application start.

### Sound Effects

To make use of sound effects, you need to create the folder `./public/media/personalisation/sounds`. Its best to deploy all sound files here as well.

Finally, create a json file `./public/media/personalisation/sounds/sounds.json` and paste this example

```
{
    "dice": "/media/personalisation/sounds/roll_dice.ogg",
    "drawcard": "/media/personalisation/sounds/card_pickup.ogg",
    "discard": "/media/personalisation/sounds/card_drop.ogg",
    "shuffle": "/media/personalisation/sounds/shuffle.ogg",
    "score": "/media/personalisation/sounds/flip_coin.ogg",
    "launch": "/media/personalisation/sounds/launch.ogg",
    "yourturn": "/media/personalisation/sounds/launch.ogg",
    "endgame": "/media/personalisation/sounds/endgame.ogg"
}
```

You obviously want to change the URI paths to the different sound effects. If you do not want to use certain sound effects, simple leave the respective property empty.
