// ==UserScript==
// @name         GeoFS Landing Stats
// @version      0.4.5.2
// @description  Adds some landing statistics
// @author       GGamerGGuy (UI improvements by Radioactive Potato (krunchiekrunch))
// @match        https://geo-fs.com/geofs.php*
// @match        https://*.geo-fs.com/geofs.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geo-fs.com
// @grant        none
// ==/UserScript==
setTimeout((function() {
    'use strict';

    // Configuration variables
    window.closeTimer = false;
    window.closeSeconds = 10;
    window.refreshRate = 20;
    window.counter = 0;
    window.isLoaded = false;
    window.justLanded = false;
    window.vertSpeed = 0;
    window.groundSpeed = 0;
    window.kTrue = 0;
    window.bounces = 0;
    window.statsOpen = false;
    window.isGrounded = false;

    // Audio alerts
    window.softLanding = new Audio('https://tylerbmusic.github.io/GPWS-files_geofs/soft_landing.wav');
    window.hardLanding = new Audio('https://tylerbmusic.github.io/GPWS-files_geofs/hard_landing.wav');
    window.crashLanding = new Audio('https://tylerbmusic.github.io/GPWS-files_geofs/crash_landing.wav');

    // Main stats panel styling (small window with all stats shown)
    window.statsDiv = document.createElement('div');
    Object.assign(window.statsDiv.style, {
        width: '220px',
        background: 'rgba(40, 50, 65, 0.8)',
        zIndex: '100000',
        padding: '10px',
        fontFamily: 'Arial, sans-serif',
        boxShadow: '0 6px 15px rgba(0, 0, 0, 0.5)',
        color: '#ffffff',
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        borderRadius: '8px',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
        cursor: 'move',
        fontSize: '14px'
    });
    document.body.appendChild(window.statsDiv);

    // Close button styling
    const closeButton = document.createElement('button');
    closeButton.innerText = '✖';
    Object.assign(closeButton.style, {
        position: 'absolute',
        top: '2px',
        right: '2px',
        background: 'none',
        border: 'none',
        color: '#ffffff',
        cursor: 'pointer',
        fontSize: '14px'
    });
    closeButton.onclick = window.closeLndgStats;
    window.statsDiv.appendChild(closeButton);

    // Function to update landing stats (display all information)
    function updateLndgStats() {
        if (!window.statsOpen) return;

        if (window.isGrounded) {
            window.statsDiv.innerHTML = `
                <button onclick="window.closeLndgStats()" style="position: absolute; top: 2px; right: 2px; background: none; border: none; color: #ffffff; cursor: pointer; font-size: 14px;">✖</button>
                <div style="font-weight: bold; margin-bottom: 5px;">Landing Stats</div>
                <div style="font-size: 12px;">⬇️ Vertical Speed: <span style="color: ${getFeedbackColor(window.vertSpeed)}">${window.vertSpeed} fpm</span></div>
                <div>💬 Feedback: <span style="color: ${getFeedbackColor(window.vertSpeed)}">${getFeedbackText(window.vertSpeed)}</span></div>
                <div>💨 Ground Speed: ${window.groundSpeed} kts</div>
                <div>🚀 True Airspeed: ${window.kTrue} kts</div>
                <div>📏 Bounces: <span id="bounces">${window.bounces}</span></div>
            `;
        } else {
            window.statsDiv.innerHTML = `
                <button onclick="window.closeLndgStats()" style="position: absolute; top: 2px; right: 2px; background: none; border: none; color: #ffffff; cursor: pointer; font-size: 14px;">✖</button>
                <div style="font-weight: bold; margin-bottom: 5px;">Landing Stats</div>
                <div>🛫 In the air... Waiting for landing!</div>
            `;
        }
    }

    function getFeedbackText(vertSpeed) {
        if (vertSpeed >= -200) {
            window.softLanding.play();
            return "SUPER BUTTER!"; // Very gentle landing
        } else if (vertSpeed >= -500) {
            window.hardLanding.play();
            return "ACCEPTABLE"; // Firm but safe
        } else if (vertSpeed >= -1000) {
            window.hardLanding.play();
            return "HARD LANDING"; // Uncomfortably firm
        } else {
            window.crashLanding.play();
            return "CRASH LANDING!"; // Dangerous and could cause damage
        }
    }

    // Function to get feedback color based on vertical speed
    function getFeedbackColor(vertSpeed) {
        return vertSpeed >= -200 ? 'green' : vertSpeed >= -500 ? 'yellow' : 'red';
    }

    // Monitor the aircraft's position and check for landing
    setInterval(() => {
        // Check if the aircraft has just landed
        if (geofs.animation.values.groundContact && !window.isGrounded) {
            window.isGrounded = true;
            window.statsOpen = true;
            window.statsDiv.style.display = 'block';  // Show stats panel only after touchdown
            updateLndgStats();
        }

        // Update other relevant stats
        window.vertSpeed = geofs.animation.values.verticalSpeed.toFixed(1);
        window.groundSpeed = geofs.animation.values.groundSpeedKnt;
        window.kTrue = geofs.aircraft.instance.trueAirSpeed.toFixed(1);
        window.isGrounded = geofs.animation.values.groundContact;
    }, window.refreshRate);

    // Close the stats panel function
    window.closeLndgStats = function() {
        window.statsDiv.style.display = 'none';
        setTimeout(() => {
            window.statsOpen = false;
            window.bounces = 0;
        }, 400);
    }

    // Function to allow dragging of the stats window
    let isDragging = false;
    let offsetX, offsetY;

    window.statsDiv.addEventListener('mousedown', function(e) {
        isDragging = true;
        offsetX = e.clientX - window.statsDiv.getBoundingClientRect().left;
        offsetY = e.clientY - window.statsDiv.getBoundingClientRect().top;
        window.statsDiv.style.cursor = 'grabbing'; // Change cursor to indicate dragging
    });

    window.addEventListener('mousemove', function(e) {
        if (isDragging) {
            window.statsDiv.style.left = (e.clientX - offsetX) + 'px';
            window.statsDiv.style.top = (e.clientY - offsetY) + 'px';
        }
    });

    window.addEventListener('mouseup', function() {
        isDragging = false;
        window.statsDiv.style.cursor = 'move'; // Change cursor back to move
    });

}), 1000);
