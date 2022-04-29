// ==UserScript==
// @name         Enhanced Leaderboard
// @namespace    http://tampermonkey.net/
// @version      2
// @description  Click a row on the Leaderboard to jump directly to that town on the map.
// @author       Groove
// @match        https://townstar.sandbox-games.com/launch/
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    let loaded = 0;
    let leaderTracker = [];
    new MutationObserver(function(mutations) {
        if (document.querySelector('.leaderboard') && loaded == 0) {
            loaded = 1;
            LoadEnhancedLeaderboard();
            ActivateLeaderTracker();
        }
    }).observe(document, {childList: true, subtree: true});

    function LoadEnhancedLeaderboard() {
        document.querySelector('.leaderboard').addEventListener('click', e => {
            if (e.target.closest('.player')) {
                let targetTownName = e.target.closest('.player').querySelector('.name').innerHTML;
                let targetTown = Object.values(Game.world.towns).filter(function(el){return el.name == targetTownName})[0];
                let worldPos = Game.world.GetWorldPositionFromMapIndex(targetTown.x, targetTown.y);
                Game.app.root.findByName('CameraWorld').script.cameraController.SetPosition(worldPos.x, worldPos.z);
                document.querySelector('.leaderboard .close-button').click();
                if (HUD.instance && HUD.instance.activeView == 'Town') {Game.app.fire('SetWorldView')};
                Game.app.root.findByName('CameraWorld').script.cameraController.Tap({x: (window.innerWidth/2), y: (window.innerHeight/2)});
            }
        });
    }

    async function CheckLeaderboard() {
        API.scoreLeaderboard(0, 19).then(leaders=>{
            for (let i=0, n=leaders.length; i < n; i++) {
                let tracker = leaderTracker.find(leader => leader.userId == leaders[i].userId)
                if (tracker) {
                    let timeDiff = Date.now() - tracker.startTime;
                    tracker.pph = (leaders[i].score - tracker.startScore) / (timeDiff / 3600000);
                    tracker.rank = leaders[i].rank;
                    let lastHrDiff = Date.now() - tracker.lastHrTime;
                    if (lastHrDiff > 3600000) {
                        tracker.lastHrpph = (leaders[i].score - tracker.lastHrScore) / (lastHrDiff / 3600000);
                        tracker.lastHrTime = Date.now();
                        tracker.lastHrScore = leaders[i].score;
                    }
                } else {
                    leaderTracker.push({userId: leaders[i].userId, name: leaders[i].name, rank: leaders[i].rank, startTime: Date.now(), startScore: leaders[i].score, pph: 0, lastHrTime: Date.now(), lastHrScore: leaders[i].score, lastHrpph: 0});
                }
            }
            InsertTrackedLeaders()
            setTimeout(CheckLeaderboard, 60000);
        });
    }

    function InsertTrackedLeaders() {
        for (let i=0, n=leaderTracker.length; i < n; i++) {
            if (document.querySelector('.leaderboard-portrait-' + leaderTracker[i].userId)) {
                let trackedLeaderElem = document.querySelector('#tracked-leader-' + leaderTracker[i].userId);
                let trackedLeaderText;
                if (!trackedLeaderElem) {
                    trackedLeaderElem = document.createElement('div');
                    trackedLeaderElem.id = 'tracked-leader-' + leaderTracker[i].userId;
                    trackedLeaderText = document.createElement('div');
                    trackedLeaderText.classList.add('bank');
                    trackedLeaderText.style.fontSize = '18px';
                    trackedLeaderText.style.padding = '4px 8px';
                    trackedLeaderElem.appendChild(trackedLeaderText);
                    let targetLeader = document.querySelector('.leaderboard-portrait-' + leaderTracker[i].userId)
                    targetLeader.insertBefore(trackedLeaderElem, targetLeader.querySelector('.score'));
                } else {
                    trackedLeaderText = trackedLeaderElem.querySelector('div');
                }
                let timeDiff = Date.now() - leaderTracker[i].startTime;
                trackedLeaderText.innerHTML = leaderTracker[i].pph.toLocaleString(undefined, {maximumFractionDigits: 0}) + ' /Hour [' + (timeDiff / 3600000).toFixed(2) + 'hrs]<br>' + leaderTracker[i].lastHrpph.toLocaleString(undefined, {maximumFractionDigits: 0}) + ' /Hour [last hr]';
            }
        }
    }

    async function ActivateLeaderTracker() {
        CheckLeaderboard();
        Game.app.on("LeaderboardUI-Loaded", t=>{InsertTrackedLeaders()});
    }
})();