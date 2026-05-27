# Notes API

Express API for the Notes Management System. Data is stored in `backend/notes-api/data/notes.json`, so notes remain available after restarting the server.

## Endpoints

- `POST /notes` and `POST /api/notes`
- `GET /notes` and `GET /api/notes`
- `GET /notes/:id` and `GET /api/notes/:id`
- `PUT /notes/:id` and `PUT /api/notes/:id`
- `DELETE /notes/:id` and `DELETE /api/notes/:id`

`GET /notes?search=query` searches note titles and content.

## Note shape

```json
{
  "id": "uuid",
  "title": "Meeting notes",
  "content": "Decisions and next steps",
  "createdAt": "2026-05-27T10:00:00.000Z",
  "updatedAt": "2026-05-27T10:00:00.000Z"
}
```

## Validation

The API rejects empty titles with `400 Bad Request`. Missing note ids return `404 Not Found`.
