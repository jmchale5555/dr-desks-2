# Booking Map State Contract

## UI states

- `noRoomSelected`
  - Condition: no room selected
  - UI: placeholder message
  - Interaction: disabled

- `layoutLoading`
  - Condition: room selected and layout request in progress
  - UI: loading state in map card
  - Interaction: disabled

- `layoutMissing`
  - Condition: layout not available or contains no desk objects
  - UI: fallback message to use desk dropdown
  - Interaction: disabled

- `dateNotSelected`
  - Condition: layout loaded, but availability date/period not selected
  - UI: gray desks + helper text
  - Interaction: disabled

- `availabilityLoading`
  - Condition: date+period selected and availability fetch in progress
  - UI: loading indicator, neutral desk states
  - Interaction: disabled

- `availabilityReady`
  - Condition: date+period selected and availability fetch successful
  - UI: desk statuses by availability
  - Interaction: enabled for available desks

- `availabilityError`
  - Condition: availability fetch failed
  - UI: non-blocking error text and neutral map
  - Interaction: disabled

- `selectionInvalidated`
  - Condition: selected desk becomes unavailable after date/period change
  - UI: info message, selected desk cleared
  - Interaction: enabled for re-selection

## Desk color semantics

- `unknown`: no date selected yet (neutral gray)
- `available`: desk can be booked for selected date/period (green)
- `unavailable`: desk occupied for selected date/period (red)
- `inactive`: desk disabled in admin (striped/low contrast)
- `selected`: currently selected desk (accent outline)

## Data mapping

- Layout source: `GET /api/room-layouts/{room_id}/`
- Availability source: `GET /api/bookings/availability/?room={id}&date={YYYY-MM-DD}&period={am|pm|full}`
- Desk identity mapping for layout objects:
  1. `object.meta.deskId`
  2. fallback `object.meta.deskNumber`

## Small implementation checklist

- [x] Add `RoomLayoutViewer` component in Booking app
- [x] Add map state machine logic in booking flow
- [x] Fetch room layout on room selection
- [x] Add date/period controls for map availability preview
- [x] Fetch availability and compute per-desk status map
- [x] Enable click-to-select desk only when availability is ready
- [x] Invalidate selected desk if it becomes unavailable
- [x] Keep desk dropdown as fallback path
