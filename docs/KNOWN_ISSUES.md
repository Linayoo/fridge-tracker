# Known Issues

Tracked limitations from week 2 smoke testing. None of these are blockers for the meetup demo.

---

## Double-fetch on cold start (home and shelf screens)

`useShelves` and `useItems` each trigger a `refresh()` on mount via an internal `useEffect`. Both `HomeScreen` and `ShelfScreen` also call `refresh()` immediately on first focus via `useFocusEffect`. This means two identical API requests fire in quick succession on cold start. The result is correct (second response overwrites the first with identical data), but the extra round trip is wasteful. Fix: remove the `useEffect` from both hooks and rely solely on `useFocusEffect` in the screens — but that couples hook behaviour to navigation lifecycle. Defer until the pattern is clear.

## Title flicker after shelf rename (ShelfScreen)

`ShelfScreen` initialises its navigation title from `route.params.shelfName` (the name at the time of navigation), then corrects it once the shelf fetch resolves. After renaming a shelf in `ShelfFormScreen` and navigating back, the old name is briefly visible in the header before the refresh completes. The fix (always derive title from the fetch, never from route params) trades the flicker for a brief blank title on first load. Neither is ideal; defer until a proper loading skeleton is added.

## No visual feedback after moving an item between shelves

When a user moves an item from Shelf A to Shelf B using the shelf picker in `ItemFormScreen`, `goBack()` returns them to `ShelfScreen` for Shelf A. The item silently disappears from the list (correct behaviour), but there is no confirmation that the move succeeded. Users may believe the edit failed. Fix: a brief toast or `Alert` after a successful move naming the destination shelf. Defer to a UX polish pass.
