// ==UserScript==
// @name         GeoFS Landing Stats
// @version      0.2.1
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

    window.justLanded = false;
    window.vertSpeed = 0;
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
    function updateGPWS() {
        // Check if geofs.animation.values is available
        if (typeof geofs.animation.values != 'undefined' && !geofs.isPaused()) {
            window.justLanded = (geofs.animation.values.groundContact && !window.isGrounded);
            if (window.justLanded && !window.statsOpen) {
                window.statsOpen = true;
                window.statsDiv.innerHTML = `
                <p>Vertical speed: ${window.vertSpeed} fpm</p>
                <p>True airspeed: ${window.kTrue} kts</p>
                <p>Ground speed: ${window.groundSpeed} kts</p>
                <p>Indicated speed: ${window.ktias} kts</p>
                <p>Roll: ${geofs.animation.values.aroll.toFixed(1)} degrees</p>
                <p>Tilt: ${geofs.animation.values.atilt.toFixed(1)} degrees</p>
                <p id="bounces">Bounces: 0</p>
                `;
                if (Number(window.vertSpeed) <= 0) {
                    if (Number(window.vertSpeed) > -60) {
                        window.statsDiv.innerHTML += `
                    <p style="font-weight: bold; color: green;">BUTTER!</p>
                    `;
                        window.softLanding.play();
                    } else if (Number(window.vertSpeed) > -1000 && Number(window.vertSpeed) < -450) {
                        window.hardLanding.play();
                    }
                }
                if (Number(window.vertSpeed) <= -1000 || Number(window.vertSpeed > 200)) {
                    window.crashLanding.play();
                }
                if (geofs.nav.units.NAV1.inRange) {
                    window.statsDiv.innerHTML += `
                    <p>Landed in TDZ? ${window.isInTDZ}</p>
                    <p>Deviation from center: ${geofs.nav.units.NAV1.courseDeviation.toFixed(1)}</p>
                    `;
                }
                setTimeout((function() {
                    window.statsDiv.innerHTML = ``;
                    window.statsOpen = false;
                    window.bounces = 0;
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

    // Update flight data display every 100ms
    setInterval(updateGPWS, window.refreshRate);
}), 5000);
