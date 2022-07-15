# Collectible Card Game Setup

There are 3 ways to setup this project.

* use the local sample data of this project
* import data from your (own) ccg games
* use CDN sever that hosts the data files (load balancing, separation of concerns, etc.)

Whichever of the first twho methods you prefer, please create the following local directories:

`./data-local`
`./data-local/images`

If you want to use a CDN server, you do not need to create those folders.

The very last chapter describes how to create map data if necessary (not all CCGs need that).

Once everything is setup, you can start the project via

````
npm install
npm start
````

This will fire up the application and you can access everything via `http://localhost:8080`.

In the beginning, be aware that the http server allows for very strong browser caching, so clear it regularly when testing.

## Providing Card Data

### Using the sample data provided in this project

Simply copy 

* `./data/cards.json` to `./data-local/cards.json`
* `./data/card-images/*` to `./data-local/images`

### Using the sample data provided in this project

You can run the `build from xmls` script to create the `cards.json` data file. To do so, please proceed as follows.

* create the following folders `./data-local/xmls` and `./data-local/xmls/xmls` (yes, that is correct)
* locate your ccg sets.xml file and copy it to `./data-local/xmls/sets.xml`
* copy the individual set spoiler.xmls to `./data-local/xmls/xmls` (you will find those files referenced in your sets.xml file)

Run the following command to create the `./data-local/cards.json` file. Please be aware that existing copies of that file will be overwritten.

````
npm run build_xmls
````

Upon successfull creation of this file, you can copy the card images into the `./data-local/images` directory. It is very probably, that your individual card images are arranged by set folders as given in the spoiler.xml files. Please maintain that structure inside the `./data-local/images` directory as well.

### Using a CDN sever

This project comes with a sample configuration file at `./data/config-example.json`. Simply copy this file to `./data/config.json` and edit it with the editor or your choice.

````
{
    "image_domain" : "https://my-cdn.com",
    "cardsUrl" : "https://my-cdn.com/data/cards"
}
````

If you use this approach, `cardsUrl` refers to the URL where you can find the content matching the `cards.json` data. `image_domain` is the URL where you can find the images. 

## Providing and editing map data

You can either use the sample map data provided at `./data/map-positions-example.json` and copy that to `./data/map-positions.json`.

You can always `edit` the map positions and add new markers to it via `localhost:8080/map/regions/edit`

## Providing map images

If your game uses a map, you will want to provide a map image. These need to be sliced into smaller tile images.

The map library requires tiles to be grouped by zoom level. Each zoom level contians tile images in its respective folder.

The map uses the following zoom levels at 

* `/media/maps/regions/3`
* `/media/maps/regions/4`
* `/media/maps/regions/5`
* `/media/maps/regions/6`

To create zoom levels and image tiles, your original map image must have any of the following resolutions:

* 5.376x5.376px 
* 13.312x13.312px

The following script uses `imagemagic` to create tiles from a map saved as `map.jpg`.

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

