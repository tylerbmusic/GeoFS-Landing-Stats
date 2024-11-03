# GeoFS Landing Stats

This is a JavaScript plugin for GeoFS that shows your landing statistics after you landed. This plugin shows data like vertical speed, G-forces, airspeed, roll, tilt, and more.

## Features

- **Landing Statistics**: Displays data like vertical speed, G-forces, ground speed, and airspeed.
- **Landing Feedback**:
  - "SUPER BUTTER" (Smooth landing)
  - "ACCEPTABLE" (Moderate landing)
  - "HARD LANDING" (Rough landing)
  - "u ded" (Crash)
- **Touchdown Zone Indicator**: Shows whether you landed in the touch down zone.
- **Bounce Counter**: Shows the amount of bounces when landing.

## Usage Instructions

1. **Installation**:
   - Use a userscript extension like Tampermoney or Violentmoney to manage and run userscripts.
   - Once the extension is installed, create a new script, paste in the code from userscript.js, and save it.

2. **Viewing the Stats**:
   - Stats appear on the top left of screen upon landing.
   - You can close the stats manually by clicking the "X" button or set a timer (see below).

3. **Configuration** (optional):
   - **Automatic Close**: By default, the panel will not automatically close. You can change this by changing the `window.closeTimer` and `window.closeSeconds` variables on line 15 and 16.

## Additional Notes

- **TDZ** (Touchdown Zone): This indicates if the aircraft touched down in the ideal area of the runway.
- **Deviation from Center**: Measures the distance from the runway centerline.
