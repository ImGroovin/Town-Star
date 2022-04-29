# Groove's Town Star Enhancement Scripts

### ___Respect each other. Don't abuse the capabilities offered by these scripts.___

### Auto Sell
* Automatically sell crafted items
* Automatically collects earnings from returning trade vehicles
* Compatible with Trade Depot, Express Depot, Trade Pier, and Freight Pier
* Future-proofed for compatibility with a 50 capacity trade vehicle
* Attempts to avoid "stuck" trade window problems
* Configurable "minimum sale" amounts to restrict sales to batches of 100 (e.g. Freight Pier)
* Configurable "keep amount" to avoid selling prerequisite craft items
* Configurable "minimum gas" to avoid selling low value / high production items too fast
* Automatically accepts gasoline airdrops
* Avoids the "stuck at 60% loading" problem
* Automatically clicks the "Play" button on the server selection screen
* Automatically collects challenge rewards
* Automatically applies all Mirandus skins in inventory

__Instructions__
* For each item that you wish to sell, set the "item" and "keepAmt" values within the craftedItems variable.
* Optionally, set the sellMin and minGas values for each item.
* The "keepAmt" value is the amount of that item that you DO NOT want to sell. A value of 5 will only sell if you have at least 15 of that item (sell 10, keep 5).
* Load the script in your browser. This can be done via a browser plugin such as Tampermonkey, or by directly pasting the code into your browser's console.
* __Respect each other. Don't abuse the capabilities offered by this script.__

### Production Rate Monitor
This script will track the production rate of specific items.
NOTE: An item that is destroyed does not get included in the calculations.

__Instructions__
* For each item that you wish to track, set the "item" value with the trackedItems variable. Leave the other values set to zero.
* Load the script in your browser. This can be done via a browser plugin such as Tampermonkey, or by directly pasting the code into your browser's console.

### Enhanced Leaderboard
This script adds functionality to the in-game Leaderboard.
* Click a row on the Leaderboard to jump directly to that town on the map.
* Tracks point rates for the top 20 towns and populates the leaderboard with those numbers.

__Instructions__
Load the script in your browser. This can be done via a browser plugin such as Tampermonkey, or by directly pasting the code into your browser's console.

### General Instructions
These scripts are built primarily for use with TamperMonkey. [TamperMonkey](https://www.tampermonkey.net/) is a userscript manager available for free as a browser extension.

1. Install TamperMonkey
2. Select the desired \*.user.js file in this repo. View the file and click the "Raw" button to view its source.
3. Copy the source
4. Open Tampermonkey in your browser and click the Add Script tab (icon with a plus symbol)
5. Paste the source into the script window and click File > Save
