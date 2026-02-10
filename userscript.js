// ==UserScript==
// @name         GeoFS Landing Stats
// @namespace    https://github.com/tylerbmusic/GeoFS-Landing-Stats
// @version      0.4.6
// @description  Adds some landing statistics to GeoFS
// @author       GGamerGGuy, Radioactive Potato, AbnormalHuman, mostypc123, and Ariakim Taiyo
// @match        https://geo-fs.com/geofs.php*
// @match        https://*.geo-fs.com/geofs.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geo-fs.com
// @grant        none
// @downloadURL  https://github.com/tylerbmusic/GeoFS-Landing-Stats/raw/refs/heads/main/userscript.js
// @updateURL    https://github.com/tylerbmusic/GeoFS-Landing-Stats/raw/refs/heads/main/userscript.js
// ==/UserScript==

setTimeout((function() {
    'use strict';
    window.MS_TO_KNOTS = window.MS_TO_KNOTS || 1.94384449;
    window.DEGREES_TO_RAD = window.DEGREES_TO_RAD || 0.017453292519943295769236907684886127134428718885417254560971914401710091146034494436822415696345094822123044925073790592483854692275281012398474218934047117319168245015010769561697553581238605305168789;
    window.RAD_TO_DEGREES = window.RAD_TO_DEGREES || 57.295779513082320876798154814105170332405472466564321549160243861202847148321552632440968995851110944186223381632864893281448264601248315036068267863411942122526388097467267926307988702893110767938261;
    window.closeTimer = false; // Set to true if you want a timer to close the landing stats. Set to false if you want to manually close the landing stats.
    window.closeSeconds = 10; // Number of seconds to wait before closing the landing stats.

    window.refreshRate = 20;
    window.counter = 0;
    window.isLoaded = false;

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
    window.isInTDZ = false;

    window.softLanding = new Audio('https://tylerbmusic.github.io/GPWS-files_geofs/soft_landing.wav');
    window.hardLanding = new Audio('https://tylerbmusic.github.io/GPWS-files_geofs/hard_landing.wav');
    window.crashLanding = new Audio('https://tylerbmusic.github.io/GPWS-files_geofs/crash_landing.wav');

    //ANONYMOUS TRACKING VIA CLOUDFLARE (I will never sell your data.)
    //What's being tracked: For each script, how many hits (page loads) it's had in the last 24 hours, how many total hits in the last 30 days, and how many unique users there are.
    //Why it's being tracked: I am curious to know how many people are using my addons.
    //To see the data, go to https://track.tylerbialowas-bard.workers.dev in a web browser.

    async function track() {
        if (true) { //To opt out of anonymous tracking, change the word "true" in this line to "false".
            const SCRIPT_NAME = "Landing_Stats";

            // Generate persistent ID
            let userId = localStorage.getItem("myScriptUserId");

            if (!userId) {
                userId = crypto.randomUUID();
                localStorage.setItem("myScriptUserId", userId);
            }
            try {
                const response = await fetch("https://track.tylerbialowas-bard.workers.dev", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        script: SCRIPT_NAME,
                        userId: userId
                    }),
                });

                if (response.ok) {
                    console.log("Analytics event sent successfully");
                }
            } catch (error) {
                console.error("Failed to track event:", error);
            }
        }
    }
    track();

    window.statsDiv = document.createElement('div');
    window.statsDiv.style.width = 'fit-content';
    window.statsDiv.style.height = 'fit-content';
    window.statsDiv.style.background = 'linear-gradient(to bottom right, rgb(29, 52, 87), rgb(20, 40, 70))';
    window.statsDiv.style.zIndex = '100000';
    window.statsDiv.style.margin = '30px';
    window.statsDiv.style.padding = '15px';
    window.statsDiv.style.fontFamily = 'Arial, sans-serif';
    window.statsDiv.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)';
    window.statsDiv.style.color = 'white';
    window.statsDiv.style.position = 'fixed';
    window.statsDiv.style.borderRadius = '12px';
    window.statsDiv.style.left = '-50%';
    window.statsDiv.style.transition = '0.4s ease';
    window.statsDiv.style.border = '1px solid rgba(255,255,255,0.1)';
    document.body.appendChild(window.statsDiv);

    function updateLndgStats() {
        if (window.geofs.cautiousWithTerrain == false && !window.geofs.isPaused() && !(window.sd && window.sd.cam.data)) {
            var ldgAGL = (window.geofs.animation.values.altitude !== undefined && window.geofs.animation.values.groundElevationFeet !== undefined) ? ((window.geofs.animation.values.altitude - window.geofs.animation.values.groundElevationFeet) + (window.geofs.aircraft.instance.collisionPoints[window.geofs.aircraft.instance.collisionPoints.length - 2].worldPosition[2]*3.2808399)) : 'N/A';
            if (ldgAGL < 500) {
                window.justLanded = (window.geofs.animation.values.groundContact && !window.isGrounded);
                if (window.justLanded && !window.statsOpen) {
                    if (window.closeTimer) {
                        setTimeout(window.closeLndgStats, 1000*window.closeSeconds);
                    }
                    let p_vs = window.clamp((window.lVS - 50) / 70, 0, 5); // 50 fpm or less = no penalty, 400+ fpm = max penalty
                    let p_g = window.clamp(Math.abs(window.geofs.animation.values.accZ/9.80665 - 1.0) * 2, 0, 2.0) // 1.0g ideal, 2.0g = 2 point penalty
                    let p_b = Math.min(window.bounces * 2.0, 6.0); // 2 points per bounce, up to 6
                    let p_r = window.clamp(window.lRoll / 10, 0, 1.5); // 0° = 0, 15°+ = max penalty
                    let p_tdz = (window.isInTDZ == true) ? 0 : 1.0; // 1 point penalty for landing outside TDZ
                    window.landingScore = window.clamp((10-p_vs-p_g-p_b-p_r-p_tdz), 0, 10);
                    console.log("Landing score: " + window.landingScore);
                    window.statsOpen = true;
                    window.statsDiv.innerHTML = `
                <button style="
                    right: 10px;
                    top: 10px;
                    position: absolute;
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    cursor: pointer;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    font-weight: bold;"
                    onclick="window.closeLndgStats()">✕</button>
                    <style>
                        .info-block {
                            display: grid;
                            grid-template-columns: repeat(2, 1fr);
                            gap: 10px;
                            font-size: 14px;
                        }
                        .landing-quality {
                            grid-column: 1 / -1;
                            text-align: center;
                            font-weight: bold;
                            margin-top: 10px;
                            padding: 5px;
                            border-radius: 5px;
                        }
                    </style>
                    <div class="info-block">
                        <span>Landing Score: ${window.landingScore.toFixed(1)}/10</span>
                        <span>Vertical speed: ${window.vertSpeed} fpm</span>
                        <span>G-Forces: ${(window.geofs.animation.values.accZ/9.80665).toFixed(2)}G</span>
                        <span>Terrain-calibrated V/S: ${window.calVertS.toFixed(1)}</span>
                        <span>True airspeed: ${window.kTrue} kts</span>
                        <span>Ground speed: ${window.groundSpeed.toFixed(1)} kts</span>
                        <span>Indicated speed: ${window.ktias} kts</span>
                        <span>Roll: ${window.geofs.animation.values.aroll.toFixed(1)} degrees</span>
                        <span>Tilt: ${window.geofs.animation.values.atilt.toFixed(1)} degrees</span>
                        <span id="bounces">Bounces: 0</span>
                    </div>
                `;
                    window.statsDiv.style.left = '0px';
                    window.statsDiv.innerHTML += `
                        <div style="margin-top: 10px; font-size: 14px;">
                            <span>Landed in TDZ? ${window.isInTDZ}</span><br>
                            ${(window.geofs.nav.units.NAV1.inRange) ? `<span>Deviation from center: ${window.geofs.nav.units.NAV1.courseDeviation.toFixed(1)}</span>` : ""}
                        </div>`;
                    if (Number(window.vertSpeed) < 0) {
                        let qualityClass = '';
                        let qualityText = '';
                        if (Number(window.vertSpeed) >= -50) {
                            qualityClass = 'landing-quality';
                            qualityText = 'BUTTER';
                            window.statsDiv.innerHTML += `
                                <div class="${qualityClass}" style="background-color: green; color: white;">
                                    ${qualityText}
                                </div>`;
                            window.softLanding.play();
                        } else if (Number(window.vertSpeed) >= -200) {
                            qualityClass = 'landing-quality';
                            qualityText = 'GREAT';
                            window.statsDiv.innerHTML += `
                                <div class="${qualityClass}" style="background-color: green; color: white;">
                                    ${qualityText}
                                </div>`;
                            window.softLanding.play();
                        } else if (Number(window.vertSpeed) >= -500 && Number(window.vertSpeed) < -200) {
                            window.hardLanding.play();
                            window.statsDiv.innerHTML += `
                                <div class="${qualityClass}" style="background-color: yellow; color: black;">
                                    ACCEPTABLE
                                </div>`;
                        } else if (Number(window.vertSpeed) >= -1000 && Number(window.vertSpeed) < -500) {
                            window.hardLanding.play();
                            window.statsDiv.innerHTML += `
                                <div class="${qualityClass}" style="background-color: red; color: white;">
                                    HARD LANDING
                                </div>`;
                        }
                    }
                    if (Number(window.vertSpeed) <= -1000 || Number(window.vertSpeed > 200)) {
                        window.crashLanding.play();
                        window.statsDiv.innerHTML += `
                            <div class="landing-quality" style="background-color: crimson; color: white;">
                                CRASH
                            </div>`;
                    }
                } else if (window.justLanded && window.statsOpen) {
                    window.bounces++;
                    var bounceP = document.getElementById("bounces");
                    bounceP.innerHTML = `Bounces: ${window.bounces}`;
                    window.softLanding.pause();
                    let p_vs = window.clamp((window.lVS - 50) / 70, 0, 5); // 50 fpm or less = no penalty, 400+ fpm = max penalty
                    let p_g = window.clamp(Math.abs(window.geofs.animation.values.accZ/9.80665 - 1.0) * 2, 0, 2.0) // 1.0g ideal, 2.0g = 2 point penalty
                    let p_b = Math.min(window.bounces * 2.0, 6.0); // 2 points per bounce, up to 6
                    let p_r = window.clamp(window.lRoll / 10, 0, 1.5); // 0° = 0, 15°+ = max penalty
                    let p_tdz = (window.isInTDZ == true) ? 0 : 1.0; // 1 point penalty for landing outside TDZ
                    window.landingScore = window.clamp((10-p_vs-p_g-p_b-p_r-p_tdz), 0, 10);
                    console.log("Landing score: " + window.landingScore);
                }
                /*if (geofs.nav.units.NAV1.inRange) {
                    window.isInTDZ = ((geofs.nav.units.NAV1.distance * FEET_TO_METERS) > (0.052902913939976676 * geofs.runways.getNearestRunway([geofs.nav.units.NAV1.navaid.lat,geofs.nav.units.NAV1.navaid.lon,0]).lengthMeters)) && ((geofs.nav.units.NAV1.distance * FEET_TO_METERS) < (0.0613682505348497385 * geofs.runways.getNearestRunway([geofs.nav.units.NAV1.navaid.lat,geofs.nav.units.NAV1.navaid.lon,0]).lengthMeters)) ? "Yes" : "No";
                }*/
                if (!window.geofs.animation.values.groundContact) {
                    window.lVS = Math.abs(window.geofs.animation.values.verticalSpeed);
                    window.lRoll = Math.abs(window.geofs.animation.values.aroll);
                }
                window.isInTDZ = window.getTDZStatus();
                window.groundSpeed = window.geofs.animation.values.groundSpeedKnt;
                window.ktias = window.geofs.animation.values.kias.toFixed(1);
                window.kTrue = (window.geofs.aircraft.instance.trueAirSpeed * window.MS_TO_KNOTS).toFixed(1);
                window.vertSpeed = window.geofs.animation.values.verticalSpeed.toFixed(1);
                window.gForces = window.geofs.animation.values.accZ/9.80665;
                window.isGrounded = window.geofs.animation.values.groundContact;
                window.refreshRate = 12;
            } else {
                window.refreshRate = 60;
            }
        }
    }
    setInterval(updateLndgStats, window.refreshRate);

    function updateCalVertS() {
        if ((typeof window.geofs.animation.values != 'undefined' &&
             !window.geofs.isPaused()) &&
            ((window.geofs.animation.values.altitude !== undefined && window.geofs.animation.values.groundElevationFeet !== undefined) ? ((window.geofs.animation.values.altitude - window.geofs.animation.values.groundElevationFeet) + (window.geofs.aircraft.instance.collisionPoints[window.geofs.aircraft.instance.collisionPoints.length - 2].worldPosition[2]*3.2808399)) : 'N/A') !== window.oldAGL) {
            window.newAGL = (window.geofs.animation.values.altitude !== undefined && window.geofs.animation.values.groundElevationFeet !== undefined) ? ((window.geofs.animation.values.altitude - window.geofs.animation.values.groundElevationFeet) + (window.geofs.aircraft.instance.collisionPoints[window.geofs.aircraft.instance.collisionPoints.length - 2].worldPosition[2]*3.2808399)) : 'N/A';
            window.newTime = Date.now();
            window.calVertS = (window.newAGL - window.oldAGL) * (60000/(window.newTime - window.oldTime));
            window.oldAGL = (window.geofs.animation.values.altitude !== undefined && window.geofs.animation.values.groundElevationFeet !== undefined) ? ((window.geofs.animation.values.altitude - window.geofs.animation.values.groundElevationFeet) + (window.geofs.aircraft.instance.collisionPoints[window.geofs.aircraft.instance.collisionPoints.length - 2].worldPosition[2]*3.2808399)) : 'N/A';
            window.oldTime = Date.now();
        }
    }
    window.getTDZStatus = function() {
        var nearestRwDist = window.geofs.utils.distanceBetweenLocations(window.geofs.aircraft.instance.llaLocation, window.geofs.runways.getNearestRunway(window.geofs.aircraft.instance.llaLocation).aimingPointLla1);
        var testDist = window.geofs.utils.distanceBetweenLocations(window.geofs.aircraft.instance.llaLocation, window.geofs.runways.getNearestRunway(window.geofs.aircraft.instance.llaLocation).aimingPointLla2)
        if (nearestRwDist > testDist) nearestRwDist = testDist;
        if (nearestRwDist < 600) { //high tolerance since TDZ will often differ from the terrain display.
            return true
        } else {
            return false;
        }
    }
    setInterval(updateCalVertS, 25);

    window.closeLndgStats = function() {
        window.statsDiv.style.left = '-50%';
        setTimeout((function() {
            window.statsDiv.innerHTML = ``;
            window.statsOpen = false;
            window.bounces = 0;
        }), 400);
    }
}), 1000);
