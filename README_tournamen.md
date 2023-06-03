# Tournaments

There are many tournament formats and some allow you to modify your deck throughout the tournament. Others require you to always play with the deck you started with.

Since this platform does not offer a persistence unit, tournament organisers rely on trusting the participants to not alter their decks. Although this is usually enough, a dedicated game result token can be created at the end of the game to ensure that decks remain unaltered throughout the tournament.

## Understanding Game Result Tokens

In short, a game result token is a JSON web token (JWT) that contains game relevant data and signs these with a secret hashing mechanism. That way, the tournament organiser can be sure that the result token is legitimate and can be trusted.

### Sample Result Token

A game result token consists of 3 parts separated by a `.` and looks similar to this

`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29yZSI6eyJlMTVhYzQwMC0wYmVmLTQ4MjEtOTE0ZC00OWEzMTkyZmZiODgiOnsiYWxseSI6MSwiY2hhcmFjdGVyIjoyLCJmYWN0aW9uIjozLCJpdGVtIjo0LCJraWxsIjo1LCJtaXNjIjo2fX0sInN0YXRzIjp7fSwiZHVyYXRpb24iOjIxMTkxLCJ0dXJucyI6MywiY2hlY2tzdW1zIjpbIjlhM2E3NTNhYTEyZGJjNTMxMTU3NDU5ZjZhMDRmYzJkY2M3NTY5MTFlZTdjNGU0Mjk5YzcyYTE1YzFmOGIzYTQiXSwicGxheWVycyI6eyJlMTVhYzQwMC0wYmVmLTQ4MjEtOTE0ZC00OWEzMTkyZmZiODgiOiJQaGlsIn0sImRhdGUiOjE2ODAwMDc3NDcyMzJ9.IMi2yoKqYoSKFP00YSrGnVz4dYPjoAUIvDXh28yR_Dc`

The middle part contains the relevant game data and the last part is the signed hash to check the authenticity (see below).

Any token contains data similar to this 

```
{
  "date": 1680007747232,
  "duration": 21191,
  "turns": 3,
  "players": {
    "e15ac400-0bef-4821-914d-49a3192ffb88": "Phil"
  },
  "checksums": [
    "9a3a753aa12dbc531157459f6a04fc2dcc756911ee7c4e4299c72a15c1f8b3a4"
  ],
  "score": {
    "e15ac400-0bef-4821-914d-49a3192ffb88": {
      "ally": 1,
      "character": 2,
      "faction": 3,
      "item": 4,
      "kill": 5,
      "misc": 6
    }
  },
  "stats": {},
}
```

Besides the date of the game, its duration and the turns played, the token includes the players' names and their respective points as well as a list of deck `checksums`. 

### Deck Checksums

Deck checksums are calculated based on the deck provided by a player. Using the same deck different games results in the identical checksum. That way, the tournament organiser can verify that a player has played with the same deck as befode.

## Obtaining a Result Token

Once you have finised your game, the final results will be dispayed and link `Copy result to clipboard` will be made available

![The Result Screen](public/readme-data/resulttoken-splash.png)

This automatically copies the result token to your clipboard and you can conveniently forward it to the tournament organiser.

## Reading a Game Result Token

You can evaluate any token via a dedicated endpoint `/tournament`. You will find a text field into which you can paste the token. It will automatically be analysed and its information presented in a readible manner.

![The Result Screen](public/readme-data/resulttoken-example.png)

If a token is invalid (e.g. somebody has changed the data), the signature hash becomes invalid and the token will not be accepted.