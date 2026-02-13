
# Focus Stats Sidebar Widget

This plan adds a compact Focus Stats widget to the sidebar showing today's focus time, current streak, and a quick-start button.

## Overview

The widget will integrate seamlessly with the existing sidebar section system, supporting:
- Drag-to-reorder with other widgets
- Show/hide toggle
- Collapsed (icon-only) view
- Full expanded view with stats and quick actions

---

## What You'll See

**Expanded View:**
```text
+----------------------------------+
| [grip] [focus icon] Focus Stats  |
|----------------------------------|
| Today:  45m focused              |
| Streak: 5 days                   |
|                                  |
| [  Start Focus Session  ]        |
+----------------------------------+
```

**Collapsed View:**
- Focus icon with tooltip showing quick stats

---

## Implementation Steps

### 1. Update Settings Types
Add `"focus"` as a new sidebar section ID in `useCloudSettings.ts`:
- Extend `SidebarSectionId` type to include `"focus"`
- Update `SidebarSectionsVisible` interface
- Update default settings to include focus section

### 2. Database Migration
Update the default values for existing users:
- Add `focus: true` to `sidebar_sections_visible` default
- Add `"focus"` to `sidebar_sections_order` default array

### 3. Extend SidebarSection Component
Add focus section rendering in `SidebarSection.tsx`:
- Import `useFocusSessions` hook and `useProductivityAnalytics` hook
- Add `renderFocusSection()` function
- Show today's focus time, streak count
- Quick-start button that triggers focus timer

### 4. Update Sidebar Component
Modify `Sidebar.tsx`:
- Add focus visibility toggle in settings popover
- Pass callback to open focus timer from sidebar widget

### 5. Connect to Dashboard
Update `Dashboard.tsx`:
- Pass `onStartFocusSession` callback to Sidebar
- Allow widget to trigger the floating focus timer

---

## Technical Details

**Files to modify:**
- `src/hooks/useCloudSettings.ts` - Add "focus" section type
- `src/components/SidebarSection.tsx` - Add focus section rendering
- `src/components/Sidebar.tsx` - Add focus toggle and callback prop
- `src/components/Dashboard.tsx` - Wire up focus timer trigger
- New migration for database defaults

**Data flow:**
1. `useFocusSessions` provides `todayTotalMinutes`, `todayCompletedSessions`
2. `useProductivityAnalytics` provides `summary.currentStreak`
3. Quick-start button calls `onStartFocusSession()` passed from Dashboard
4. Dashboard opens the floating FocusTimer component

---

## UI Behavior

| State | Expanded View | Collapsed View |
|-------|--------------|----------------|
| Normal | Card with stats + button | Icon with tooltip |
| Hidden | Grayed "Focus (hidden)" row | Not shown |
| Dragging | Semi-transparent | N/A |

The quick-start button will open the focus timer with a default 25-minute session, allowing users to immediately start focusing.
