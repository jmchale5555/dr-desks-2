# Room Builder V1 Plan

## Goal

Deliver an admin-only Room Builder that supports 2D room layout editing and saves layouts as versioned JSON.

## Recommended stack

- Canvas/editor: `react-konva` (Konva.js)
- App state: React state initially, with option to move to Zustand for undo/redo
- Persistence: Django REST API + PostgreSQL JSONField

## V1 scope

- Select a room
- Load room layout
- Add and edit shape objects (starting with desk rectangles)
- Move and rotate objects
- Update basic properties (x, y, width, height, rotation, label)
- Save layout JSON

## Backend contract

### Model

- `RoomLayout` (`OneToOne` with `Room`)
- Fields: `version`, `canvas_width`, `canvas_height`, `layout_json`, `updated_by`, timestamps
- `layout_json` uses a versioned schema:

```json
{
  "schemaVersion": 1,
  "grid": { "enabled": true, "size": 20, "snap": true },
  "objects": []
}
```

### Endpoints (admin only)

- `GET /api/room-layouts/{room_id}/`
  - Returns existing layout or creates a default layout for the room
- `PUT /api/room-layouts/{room_id}/`
  - Full save/update of layout
- `POST /api/room-layouts/{room_id}/autosave/`
  - Partial update for frequent saves
- `POST /api/room-layouts/{room_id}/generate-from-desks/`
  - Regenerates desk objects from active desks in the room

## Frontend structure

- `frontend/src/apps/roomBuilder/RoomBuilderApp.jsx`
- `frontend/src/apps/roomBuilder/components/ToolPanel.jsx`
- `frontend/src/apps/roomBuilder/components/CanvasStage.jsx`
- `frontend/src/apps/roomBuilder/components/PropertiesPanel.jsx`
- `frontend/src/services/roomLayoutService.js`

## Delivery phases

1. Route + page scaffold + room selector + load/save wiring
2. Canvas object list and selection model
3. Property editor and shape creation tools
4. Grid/snapping and keyboard shortcuts
5. Undo/redo and autosave debounce

## Notes

- Current implementation is a minimal starting scaffold.
- Full drag/rotate canvas interactions are intended to be implemented next with `react-konva`.
