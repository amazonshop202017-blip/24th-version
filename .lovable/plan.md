

## Fix Desktop Date Range Picker Layout

**Goal**: Match the reference design — remove the separate header section with border, and place the date range display inline above the two calendars (no divider line, no extra header area).

### Changes in `src/components/layout/GlobalHeader.tsx`

**Desktop popover (lines ~1200-1252)**:
1. Remove the separate `border-b` header div that shows the date range (lines 1201-1210)
2. Move the date range display inside the calendar area, above the Calendar component but below the flex container that holds calendar + presets
3. Structure: single flex container with calendar section (range text on top + calendar below) and presets sidebar

The new layout:
```
┌─────────────────────────────────────────────┐
│  [Calendar area]                  │ Presets  │
│  Feb 01, 2026  →  Mar 31, 2026   │ Today    │
│  ┌──────────┐  ┌──────────┐      │ This wk  │
│  │  Feb     │  │  Mar     │      │ This mo  │
│  │  ...     │  │  ...     │      │ ...      │
│  └──────────┘  └──────────┘      │          │
└─────────────────────────────────────────────┘
```

- Remove `border-b border-border` wrapper div for range display
- Place range display inside the calendar `div` (before `<Calendar>`) with `text-center` and appropriate padding
- No horizontal divider between range and calendar

