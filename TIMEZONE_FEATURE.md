# Timezone Conversion Feature

## How to Use

### Option 1: Current Time Across Timezones

1. Click anywhere on the infinite canvas
2. Type the keyword: **Time** (case-insensitive)
3. Automatically displays current time in 6 timezones:
   - Your local timezone (highlighted with blue border)
   - 5 other major timezones (PST, MST, CST, EST, UTC, IST)

### Option 2: Convert Specific Time 🌍

Convert any specific time from one timezone to all others!

**Format**: `HH:MM AM/PM TIMEZONE`

- **Examples**:
  - `10:30 PM MST` → Shows what 10:30 PM Mountain Time is in all other zones
  - `9:00 AM EST` → Shows what 9:00 AM Eastern Time is everywhere
  - `2:15 PM UTC` → Shows what 2:15 PM UTC is in all zones
  - `11:45 PM IST` → Shows what 11:45 PM India Time is globally

**With Time Offset**: Add/subtract hours from the specific time

- `10:30 PM MST + 2` → Shows 12:30 AM MST (2 hours later) in all zones
- `9:00 AM EST - 3` → Shows 6:00 AM EST (3 hours earlier) in all zones

Perfect for:

- "When is the 2pm EST meeting in my timezone?"
- "If I call at 10:30 PM MST, what time will it be for them?"
- Planning international calls and meetings

### Option 3: Time Offset Feature ⏰

Want to see what time it will be in 2 hours? Or what time it was 3 hours ago?

- **Add hours**: Type `time + 2` (shows time 2 hours ahead)
- **Subtract hours**: Type `time - 3` (shows time 3 hours ago)
- **Examples**:
  - `time + 1` → 1 hour ahead
  - `time + 5` → 5 hours ahead
  - `time - 2` → 2 hours ago
  - `time - 12` → 12 hours ago

Perfect for:

- Planning meetings across timezones
- Visualizing future/past times
- Quick mental timezone math

## Features

### Smart Timezone Detection

- Automatically detects your local timezone
- Shows your local time first (highlighted)
- Displays 5 other relevant timezones

### Specific Time Conversion

- Input any time with timezone abbreviation
- Source timezone is highlighted with blue border "(Source)"
- All other timezones update accordingly
- Works with optional hour offsets

### Live Time Updates ⏱️

- **Real-time ticking**: Times update every minute automatically
- **No refresh needed**: Watch the minutes change in real-time
- **Visual indicator**: Pulsing green dot shows live status
- **Day/Night transitions**: Background automatically darkens/lightens when crossing 6 PM/6 AM
- **Clean display**: Shows hours and minutes only (HH:MM AM/PM format)

### Visual Indicators

1. **Source/Local Timezone**: Blue border with bold text
2. **Night Time**: Darker background (6 PM - 6 AM local time)
3. **Day Time**: Normal brightness
4. **Live Indicator**: Subtle pulsing green dot next to each timezone

### Supported Timezones

- **PST** - Pacific Standard Time (UTC-8)
- **MST** - Mountain Standard Time (UTC-7)
- **CST** - Central Standard Time (UTC-6)
- **EST** - Eastern Standard Time (UTC-5)
- **UTC** - Coordinated Universal Time (UTC+0)
- **IST** - India Standard Time (UTC+5:30)

## Display Format

**Basic "time" command:**

```
India (IST) (Local): 10:29 AM
Pacific (PST): 10:59 PM
Mountain (MST): 11:59 PM
Central (CST): 12:59 AM
Eastern (EST): 01:59 AM
UTC: 04:59 AM
```

**Specific time "10:30 PM MST":**

```
Mountain (MST) (Source): 10:30 PM
Pacific (PST): 09:30 PM
Central (CST): 11:30 PM
Eastern (EST): 12:30 AM
UTC: 05:30 AM
India (IST): 11:00 AM
```

**With offset "10:30 PM MST + 2" (2 hours ahead):**

```
+2 hours ahead

Mountain (MST) (Source): 12:30 AM
Pacific (PST): 11:30 PM
Central (CST): 01:30 AM
Eastern (EST): 02:30 AM
UTC: 07:30 AM
India (IST): 01:00 PM
```

**With offset "time + 2" (2 hours ahead):**

```
+2 hours ahead

India (IST) (Local): 12:29 PM
UTC: 04:59 AM
```

**With offset "time + 2" (2 hours ahead):**

```
+2 hours ahead

India (IST) (Local): 12:29 PM
Pacific (PST): 12:59 AM
Mountain (MST): 01:59 AM
Central (CST): 02:59 AM
Eastern (EST): 03:59 AM
UTC: 06:59 AM
```

Mountain (MST): 01:59:45 AM
Central (CST): 02:59:45 AM
Eastern (EST): 03:59:45 AM
UTC: 06:59:45 AM

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
```
