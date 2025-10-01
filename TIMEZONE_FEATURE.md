# Timezone Conversion Feature

## How to Use

1. Click anywhere on the infinite canvas
2. Type the keyword: **Time** (case-insensitive)
3. Automatically displays current time in 6 timezones:
   - Your local timezone (highlighted with blue border)
   - 5 other major timezones (PST, MST, CST, EST, UTC, IST)

## Features

### Smart Timezone Detection

- Automatically detects your local timezone
- Shows your local time first (highlighted)
- Displays 5 other relevant timezones

### Visual Indicators

1. **Local Timezone**: Blue border with bold text
2. **Night Time**: Darker background (6 PM - 6 AM local time)
3. **Day Time**: Normal brightness

### Supported Timezones

- **PST** - Pacific Standard Time (UTC-8)
- **MST** - Mountain Standard Time (UTC-7)
- **CST** - Central Standard Time (UTC-6)
- **EST** - Eastern Standard Time (UTC-5)
- **UTC** - Coordinated Universal Time (UTC+0)
- **IST** - India Standard Time (UTC+5:30)

## Display Format

```
India (IST) (Local): 10:29:45 AM
Pacific (PST): 10:59:45 PM
Mountain (MST): 11:59:45 PM
Central (CST): 12:59:45 AM
Eastern (EST): 01:59:45 AM
UTC: 04:59:45 AM
```

## Technical Implementation

### Files Modified

1. **calculator.js**

   - Added `convertTimezones()` method
   - Added `formatTimeForZone()` helper
   - Integrated timezone detection in main `calculate()` flow

2. **textManager.js**

   - Added `displayTimezoneResults()` method
   - Added `clearTimezoneResults()` method
   - Added `updateTimezoneResultPositions()` for pan/zoom
   - Updated `removeElement()` to clean up timezone results

3. **canvas.css**
   - Added `.timezone-result` base styles
   - Added `.timezone-night` for night-time darkening
   - Added `.timezone-local` for local timezone highlighting

## Design Principles

- Simple and minimal - just type "Time"
- Human-readable format (HH:MM:SS)
- Visual feedback for night/day and local timezone
- Reuses existing result display patterns
- No additional dependencies
- Performance-optimized with proper cleanup
