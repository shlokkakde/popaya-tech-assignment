const express = require("express");

const app = express();
const PORT = process.env.CORE_PORT || 3000;

app.use(express.json());

const users = [
  { id: 1, name: "Amit", email: "amit@test.com" },
  { id: 2, name: "Riya", email: "riya@test.com" }
];

const notes = [
  { id: 1, title: "Note 1", content: "Content 1", userId: 1 },
  { id: 2, title: "Note 2", content: "Content 2", userId: 2 }
];

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function getUserById(id) {
  return users.find((user) => user.id === Number(id));
}

function getNextNoteId() {
  const highestId = notes.reduce((max, note) => Math.max(max, note.id), 0);
  return highestId + 1;
}

async function fetchExternalData() {
  return {
    source: "local mock",
    items: ["alpha", "beta", "gamma"]
  };
}

app.get("/users", (req, res) => {
  res.json(users);
});

app.get("/users/:id", (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "User id must be a positive number" });
  }

  const user = getUserById(id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(user);
});

app.get("/notes/count", (req, res) => {
  res.json({ total: notes.length });
});

app.get("/external-data", async (req, res, next) => {
  try {
    const data = await fetchExternalData();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

app.get("/notes", (req, res) => {
  if (notes.length === 0) {
    console.log("No notes found");
  }

  res.json(notes);
});

app.post("/notes", (req, res) => {
  const { title, content, userId } = req.body;
  const ownerId = parseId(userId);

  if (!title || !content || !ownerId) {
    return res.status(400).json({
      error: "Title, content, and a valid userId are required"
    });
  }

  if (!getUserById(ownerId)) {
    return res.status(404).json({ error: "User not found" });
  }

  const newNote = {
    id: getNextNoteId(),
    title,
    content,
    userId: ownerId
  };

  notes.push(newNote);
  res.status(201).json(newNote);
});

app.delete("/notes/:id", (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "Note id must be a positive number" });
  }

  const noteIndex = notes.findIndex((note) => note.id === id);

  if (noteIndex === -1) {
    return res.status(404).json({ error: "Note not found" });
  }

  notes.splice(noteIndex, 1);
  res.json({ message: "Note deleted" });
});

app.put("/users/:id", (req, res) => {
  const id = parseId(req.params.id);
  const { name, email } = req.body;

  if (!id) {
    return res.status(400).json({ error: "User id must be a positive number" });
  }

  const user = getUserById(id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (typeof name === "string" && name.trim()) {
    user.name = name.trim();
  }

  if (typeof email === "string" && email.trim()) {
    user.email = email.trim();
  }

  res.json(user);
});

app.get("/user-notes/:userId", (req, res) => {
  const userId = parseId(req.params.userId);

  if (!userId) {
    return res.status(400).json({ error: "User id must be a positive number" });
  }

  const userNotes = notes.filter((note) => note.userId === userId);
  res.json(userNotes);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email === "admin@test.com" && password === "123456") {
    return res.json({ message: "Login successful" });
  }

  res.status(401).json({ message: "Invalid credentials" });
});

app.get("/profile/:id", (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "User id must be a positive number" });
  }

  const user = getUserById(id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(user);
});

app.post("/sum", (req, res) => {
  const a = Number(req.body.a);
  const b = Number(req.body.b);

  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return res.status(400).json({ error: "Both a and b must be numbers" });
  }

  res.json({ total: a + b });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { app, getUserById, fetchExternalData };
