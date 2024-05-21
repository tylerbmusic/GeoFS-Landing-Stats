// ==UserScript==
// @name         GeoFS Landing Stats
// @version      0.3
// @description  Adds some landing statistics
// @author       GGamerGGuy
// @match        https://www.geo-fs.com/geofs.php?v=*
// @match        https://*.geo-fs.com/geofs.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geo-fs.com
// @grant        none
// ==/UserScript==
//**NOTE: TDZ means Touchdown Zone, Deviation from center is probably **
setTimeout((function() {
    'use strict';
    window.refreshRate = 20;
    window.counter = 0;

    window.justLanded = false;
    window.vertSpeed = 0;
    window.oldAGL = 0;
    window.newAGL = 0;
    window.calVertS = 0;
    window.groundSpeed = 0;
    window.ktias = 0;
    window.kTrue = 0;
    window.bounces = 0;
    window.statsOpen = false;
    window.isGrounded = true;
    window.isInTDZ = false; //0.0613682505348497385 - 0.052902913939976676 * ruwnay length = TDZ

    window.softLanding = new Audio('https://tylerbmusic.github.io/GPWS-files_geofs/soft_landing.wav');
    window.hardLanding = new Audio('https://tylerbmusic.github.io/GPWS-files_geofs/hard_landing.wav');
    window.crashLanding = new Audio('https://tylerbmusic.github.io/GPWS-files_geofs/crash_landing.wav');

    window.statsDiv = document.createElement('div');
    window.statsDiv.style.width = 'fit-content';
    window.statsDiv.style.height = 'fit-content';
    window.statsDiv.style.background = 'rgb(48 146 255)';
    window.statsDiv.style.zIndex = '10000';
    window.statsDiv.style.margin = '30px';
    window.statsDiv.style.paddingLeft = '10px';
    window.statsDiv.style.paddingRight = '10px';
    window.statsDiv.style.fontFamily = 'system-ui';
    window.statsDiv.style.boxShadow = '0px 0px 20px 0px black';
    window.statsDiv.style.color = 'black';
    window.statsDiv.style.position = 'fixed';
    window.statsDiv.style.borderRadius = '10px';
    document.body.appendChild(window.statsDiv);

    window.testValues = document.createElement('div');
    window.testValues.style.position = 'fixed';
    document.body.appendChild(window.testValues);

    function updateLndgStats() {
        // Check if geofs.animation.values is available
        if (typeof geofs.animation.values != 'undefined' && !geofs.isPaused()) {
            window.justLanded = (geofs.animation.values.groundContact && !window.isGrounded);
            if (window.justLanded && !window.statsOpen) {
                window.statsOpen = true;
                window.statsDiv.innerHTML = `
                <p>Vertical speed: ${window.vertSpeed} fpm</p>
                <p>Terrain-calibrated V/S: ${window.calVertS.toFixed(1)}</p>
                <p>True airspeed: ${window.kTrue} kts</p>
                <p>Ground speed: ${window.groundSpeed} kts</p>
                <p>Indicated speed: ${window.ktias} kts</p>
                <p>Roll: ${geofs.animation.values.aroll.toFixed(1)} degrees</p>
                <p>Tilt: ${geofs.animation.values.atilt.toFixed(1)} degrees</p>
                <p id="bounces">Bounces: 0</p>
                `;
                if (geofs.nav.units.NAV1.inRange) {
                    window.statsDiv.innerHTML += `
                    <p>Landed in TDZ? ${window.isInTDZ}</p>
                    <p>Deviation from center: ${geofs.nav.units.NAV1.courseDeviation.toFixed(1)}</p>
                    `;
                }
                if (window.vertSpeed < window.calVertS+50 && window.vertSpeed > window.calVertS-50) { //If the AGL V/S is similar to the MSL V/S, base it off of the MSL V/S
                    if (Number(window.vertSpeed) < 0) {
                        if (Number(window.vertSpeed) > -60) {
                            window.statsDiv.innerHTML += `
                            <p style="font-weight: bold; color: green;">BUTTER!</p>
                            `;
                            window.softLanding.play();
                        } else if (Number(window.vertSpeed) > -1000 && Number(window.vertSpeed) < -450) {
                            window.hardLanding.play();
                            window.statsDiv.innerHTML += `
                            <p style="font-weight: bold; color: orange;">HARD LANDING</p>
                            `;
                        }
                    }
                    if (Number(window.vertSpeed) <= -1000 || Number(window.vertSpeed > 200)) {
                        window.crashLanding.play();
                        window.statsDiv.innerHTML += `
                            <p style="font-weight: bold; color: red; font-family: cursive;">u ded</p>
                        `;
                        window.crashDiv = document.createElement('div');
                        window.crashI = document.body.appendChild(window.crashDiv);
                        window.crashI.innerHTML = `
                        <div id="deathfade" style="
                        position: fixed;
                        width: 100%;
                        height: 100%;
                        background: transparent;
                        z-index: 99999;
                        transition: background 1s linear;
                        left: 0px;
                        ">
                        <h1 style="
                        text-align: center;
                        vertical-align: middle;
                        margin: 20%;
                        color: darkred;
                        font-family: cursive;
                        ">u ded</h1>
                        </div>`;
                        var dth = document.getElementById("deathfade");
                        dth.style.background = "white";
                    }
                } else {
                    if ((window.calVertS) < 0) {
                        if ((window.calVertS) > -60) {
                            window.statsDiv.innerHTML += `
                            <p style="font-weight: bold; color: green;">BUTTER!</p>
                            `;
                            window.softLanding.play();
                        } else if ((window.calVertS) > -1000 && (window.calVertS) < -450) {
                            window.hardLanding.play();
                            window.statsDiv.innerHTML += `
                            <p style="font-weight: bold; color: orange;">HARD LANDING</p>
                            `;
                        }
                    }
                    if ((window.calVertS) <= -1000 || (window.calVertS > 200)) {
                        window.crashLanding.play();
                        window.statsDiv.innerHTML += `
                            <p style="font-weight: bold; color: red; font-family: cursive;">u ded</p>
                        `;
                        window.crashDiv = document.createElement('div');
                        window.crashI = document.body.appendChild(window.crashDiv);
                        window.crashI.innerHTML = `
                        <div id="deathfade" style="
                        position: fixed;
                        width: 100%;
                        height: 100%;
                        background: transparent;
                        z-index: 99999;
                        transition: background 1s linear;
                        left: 0px;
                        ">
                        <h1 style="
                        text-align: center;
                        vertical-align: middle;
                        margin: 20%;
                        color: darkred;
                        font-family: cursive;
                        ">u ded</h1>
                        </div>`;
                        var deth = document.getElementById("deathfade");
                        deth.style.background = "white";
                    }
                }
                setTimeout((function() {
                    window.statsDiv.innerHTML = ``;
                    window.statsOpen = false;
                    window.bounces = 0;
                    if (document.getElementById("deathfade")) {
                        document.getElementById("deathfade").remove();
                    }
                }), 10000); //Delay to close stats window
            } else if (window.justLanded && window.statsOpen) {
                window.bounces++;
                var bounceP = document.getElementById("bounces");
                bounceP.innerHTML = `Bounces: ${window.bounces}`;
                window.softLanding.pause();
            }
            if (geofs.nav.units.NAV1.inRange) {
                window.isInTDZ = ((geofs.nav.units.NAV1.distance * FEET_TO_METERS) > (0.052902913939976676 * geofs.runways.getNearestRunway([geofs.nav.units.NAV1.navaid.lat,geofs.nav.units.NAV1.navaid.lon,0]).lengthMeters)) && ((geofs.nav.units.NAV1.distance * FEET_TO_METERS) < (0.0613682505348497385 * geofs.runways.getNearestRunway([geofs.nav.units.NAV1.navaid.lat,geofs.nav.units.NAV1.navaid.lon,0]).lengthMeters)) ? "Yes" : "No";
            }
            window.groundSpeed = geofs.animation.values.groundSpeedKnt.toFixed(1);
            window.ktias = geofs.animation.values.kias.toFixed(1);
            window.kTrue = geofs.aircraft.instance.trueAirSpeed.toFixed(1);
            window.vertSpeed = geofs.animation.values.verticalSpeed.toFixed(1);
            window.isGrounded = geofs.animation.values.groundContact;
            }
    }
    setInterval(updateLndgStats, window.refreshRate);

    function updateCalVertS() {
        if ((typeof geofs.animation.values != 'undefined' && !geofs.isPaused()) && !geofs.animation.values.groundContact) {
            window.newAGL = (geofs.animation.values.altitude !== undefined && geofs.animation.values.groundElevationFeet !== undefined) ? ((geofs.animation.values.altitude - geofs.animation.values.groundElevationFeet) + (geofs.aircraft.instance.collisionPoints[geofs.aircraft.instance.collisionPoints.length - 2].worldPosition[2]*3.2808399)) : 'N/A';
            window.newTime = Date.now();
            if ((window.newAGL - window.oldAGL) !== 0.0) {
                window.calVertS = (window.newAGL - window.oldAGL) * (60000/(window.newTime - window.oldTime)); //Calculate the V/S in fpm based on the time between readings.
            }
            window.oldAGL = (geofs.animation.values.altitude !== undefined && geofs.animation.values.groundElevationFeet !== undefined) ? ((geofs.animation.values.altitude - geofs.animation.values.groundElevationFeet) + (geofs.aircraft.instance.collisionPoints[geofs.aircraft.instance.collisionPoints.length - 2].worldPosition[2]*3.2808399)) : 'N/A';
            window.oldTime = Date.now();
        }
    }
    setInterval(updateCalVertS, 25);
}), 5000);
