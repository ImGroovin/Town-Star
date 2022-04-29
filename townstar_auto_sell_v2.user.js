// ==UserScript==
// @name         Town Star Auto-Sell
// @namespace    http://tampermonkey.net/
// @version      2.4
// @description  Automatically sell crafted items.
// @author       Groove
// @match        *://*.sandbox-games.com/launch*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
	// keepAmt is the amount that you do not want to sell
	// sellMin is the minimum amount needed before attempting to sell
	//    setting a sellMin of 100 will ensure that the item is only sold in batches of 100 (e.g. via Freight Ship)
	// minGas is the minimum amount of gas needed in storage before attempting to sell this item
	//    this enables high volume / low value / overflow items to only be sold if there is a sufficient gas reserve
    const craftedItems = [
        {item: 'Wool', keepAmt: 0, sellMin: 0, minGas: 1},
        {item: 'Pinot_Noir_Grapes', keepAmt: 0, sellMin: 0, minGas: 1},
        {item: 'Feed', keepAmt: 0, sellMin: 100, minGas: 19},
    ]
    let apiTokenSet = false;

    new MutationObserver(function(mutations) {
        let airdropcollected = 0;
        if(document.getElementsByClassName('hud-jimmy-button')[0] && document.getElementsByClassName('hud-jimmy-button')[0].style.display != 'none'){
            document.getElementsByClassName('hud-jimmy-button')[0].click();
            document.getElementById('Deliver-Request').getElementsByClassName('yes')[0].click();
            document.getElementById('Deliver-Request').getElementsByClassName('close-button')[0].click();
        }
        if(document.getElementsByClassName('hud-airdrop-button')[0] && document.getElementsByClassName('hud-airdrop-button')[0].style.display != 'none'){
            if(airdropcollected == 0){
                airdropcollected = 1;
                document.getElementsByClassName('hud-airdrop-button')[0].click();
                document.getElementsByClassName('air-drop')[0].getElementsByClassName('yes')[0].click();
            }
        }
        if (document.getElementById("progressText") && parseFloat(document.getElementById("progressText").innerText) > 25 && API && !apiTokenSet) {
            apiTokenSet = true;
            if (API.token) {
                Utilities.browserUtilities.LOCAL_STORAGE.set("token", API.token);
            } else {
                API.token = Utilities.browserUtilities.LOCAL_STORAGE.get("token");
            }
        }
        if (document.getElementById("playButton") && document.getElementById("playButton").style.visibility && document.getElementById("playButton").style.visibility !== "hidden") {
            if(typeof Game == 'undefined' || (Game && Game.gameData == null)) {
                window.location.reload();
            } else {
                document.getElementById("playButton").click();
                console.log(Date.now() + ' ---===ACTIVATING AUTO SELL===---');
                ActivateAutoSell();
            }
        }
    }).observe(document, {childList: true, subtree: true});

    function GetAvailableTradeObject(capacity) {
        return Object.values(Game.town.objectDict).filter(tradeObj => tradeObj.logicType === 'Trade')
            .find(tradeObj =>
                  Game.unitsData[tradeObj.objData.UnitType].Capacity == capacity
                  && !Game.town.tradesList.find(activeTrade => activeTrade.source.x == tradeObj.townX && activeTrade.source.z == tradeObj.townZ)
                 )
    }

    function CloseWindows(elements, checkParent) {
        for (let i=0, n=elements.length; i < n; i++) {
            let el = checkParent ? elements[i].closest('.container') : elements[i];
            let elVis = el.currentStyle ? el.currentStyle.visibility : getComputedStyle(el, null).visibility;
            let elDis = el.currentStyle ? el.currentStyle.display : getComputedStyle(el, null).display;
            if (!(elVis === 'hidden' || elDis === 'none')) {
                el.querySelector('.close-button') && el.querySelector('.close-button').click();
            }
        }
    }

    async function WaitForCompletion(selector) {
        while (document.querySelector(selector) !== null) {
            await new Promise( resolve => requestAnimationFrame(resolve) )
        }
        return document.querySelector(selector);
    }

    async function WaitForTradeLoad(targetTradeObj) {
        return await new Promise(resolve => {
            const waitForUpdate = setInterval(() => {
                let tradeUiObj = Game.app.root.findByName('TradeUi').script.trade.townObject;
                if (tradeUiObj && tradeUiObj.townX == targetTradeObj.townX && tradeUiObj.townZ == targetTradeObj.townZ && Game.app.root.findByName('TradeUi').script.trade.cityPaths[0].gasCost) {
                    resolve('Loaded');
                    clearInterval(waitForUpdate);
                };
            }, 500);
        });
    }

    async function WaitForElement(selector) {
        while (document.querySelector(selector) === null) {
            await new Promise( resolve => requestAnimationFrame(resolve) )
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        return document.querySelector(selector);
    }

    async function CheckCrafts() {
        let allTradeObjects = Object.values(Game.town.objectDict).filter(tradeObj => tradeObj.logicType === 'Trade');
        for (let i=0, n=allTradeObjects.length; i < n; i++) {
            if (allTradeObjects[i].logicObject.tapToCollectEntity.enabled) {
                allTradeObjects[i].logicObject.OnTapped();
            }
        }
        if (Game.town.GetStoredCrafts()['Gasoline'] >= 1) {
            for (let i=0, n=craftedItems.length; i < n; i++) {
                if ((Game.town.GetStoredCrafts()[craftedItems[i].item] >= craftedItems[i].keepAmt + 10) && (Game.town.GetStoredCrafts()['Gasoline'] >= craftedItems[i].minGas)) {
                    let targetTradeObj;
                    if (Game.town.GetStoredCrafts()[craftedItems[i].item] >= 100 + craftedItems[i].keepAmt) {
                        targetTradeObj = GetAvailableTradeObject(100);
                    }
                    if (!targetTradeObj && Game.town.GetStoredCrafts()[craftedItems[i].item] >= 50 + craftedItems[i].keepAmt && craftedItems[i].sellMin <= 50){
                        targetTradeObj = GetAvailableTradeObject(50);
                    }
                    if (!targetTradeObj && Game.town.GetStoredCrafts()[craftedItems[i].item] >= 10 + craftedItems[i].keepAmt && craftedItems[i].sellMin <= 10){
                        targetTradeObj = GetAvailableTradeObject(10);
                    }
                    if (targetTradeObj){
                        CloseWindows(document.querySelectorAll('body > .container > .player-confirm .dialog-cell'), false);
                        CloseWindows(document.querySelectorAll('.container > div:not(.hud):not(.player-confirm)'), true);
                        Game.town.selectObject(targetTradeObj);
                        Game.app.fire('SellClicked', {x: targetTradeObj.townX, z: targetTradeObj.townZ});
                        await WaitForCompletion('.LoadingOrders');
                        document.querySelector('#trade-craft-target [data-name="' + craftedItems[i].item + '"]').click();
                        await WaitForTradeLoad(targetTradeObj);
                        if (Game.town.GetStoredCrafts()['Gasoline'] >= Game.app.root.findByName('TradeUi').script.trade.cityPaths[0].gasCost) {
                            document.querySelector('#destination-target .destination .sell-button').click();
							let tradeTimeout = setTimeout(function(){
								document.querySelector('.trade-connection .no').click();
							},10000);
                            await WaitForCompletion('.trade-connection .compass');
							clearTimeout(tradeTimeout);
                        } else {
                            console.log('Whoops! You have run out of gas.');
                            document.querySelector('#autosell-status .bank').textContent = 'ALERT: Out of gas!'
                            document.querySelector('.container > .trade .close-button').click();
                        }
                    }
                }
            }
        } else {
            console.log('Whoops! You have run out of gas.');
            document.querySelector('#autosell-status .bank').textContent = 'ALERT: Out of gas!'
        }
        setTimeout(CheckCrafts, 5000);
    }

    function CheckChallenge(){
        let checkProgress = setInterval(function(){
            if (Game.challenge.goalProgress >= Game.challenge.goalAmount) {
                clearInterval(checkProgress);
                Game.challenge.collect();
                let waitCollect = setTimeout(function(){
                    let nextCheck = Game.challenge.endTime - new Date().getTime() + 3600000;
                    SetChallengeTimer(nextCheck);
                },30000);
            }
        },300000);
    }

    function SetChallengeTimer(challengeTimer){
        console.log(Game.challenge.isClaimed());
        if (Game.challenge.isClaimed()) {
            console.log('Next Challenge Timer: ', Math.floor(challengeTimer/1000/60/60));
            setTimeout(CheckChallenge, challengeTimer);
        } else {
            CheckChallenge();
        }
    }

    async function ActivateAutoSell() {
        let autoSellStatus = document.createElement('div');
        autoSellStatus.id = 'autosell-status';
        autoSellStatus.style.cssText = 'pointer-events: all; position: absolute; left: 50%; transform: translate(-50%, 0);';
        autoSellStatus.addEventListener( 'click', function(){this.children[0].textContent = 'Auto-Sell Active';})
        let autoSellContent = document.createElement('div');
        autoSellContent.classList.add('bank');
        autoSellContent.style.cssText = 'background-color: #fde7e3; padding-left: 10px; padding-right: 10px';
        autoSellContent.textContent = 'Auto-Sell Active';
        autoSellStatus.appendChild(autoSellContent);
        await WaitForElement('.hud');
        document.querySelector('.hud').prepend(autoSellStatus);
        CheckCrafts();
        let nextCheck = Game.challenge.endTime - new Date().getTime() + 3600000;
        SetChallengeTimer(nextCheck);
        let tempskins = INVENTORY.skins
        tempskins.forEach((n=>{
            n.skin === "Mirandus" && n.active != true && (
                n.active = true,
                Game.town.setSkin(n.object.Name, true ? n.skin : null, !1))
        })), true ? API.setUserData("skinSettings", SKINS) : API.setUserData("skinSettings", {})
    }

})();
