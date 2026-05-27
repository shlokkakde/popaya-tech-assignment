# Core Bug-Squashing Notes

The original Express file had several runtime and logic bugs. The fixed version keeps the same small in-memory API, but makes each route safe and predictable.

## Fixes made

- Returned the actual `users` array instead of an undefined `userList`.
- Converted route params to numbers before comparing ids.
- Made `getUserById` return the found user.
- Fixed `notes.lenght` to `notes.length`.
- Added a mocked `fetchExternalData` function and awaited it.
- Replaced accidental assignments in conditions and filters with comparisons.
- Generated note ids at creation time instead of storing the function as the id.
- Added validation and proper `400`, `401`, and `404` responses.
- Prevented deleting from index `-1` when a note is missing.
- Fixed the user update route to use the submitted `name` and `email`.
- Required both email and password for login.
- Returned a single user object from the profile route.
- Converted sum inputs to numbers before adding.
- Made the startup port and log message consistent.
- Exported the Express app for testing or reuse.
