const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { randomUUID } = require("crypto");

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
  }
}

function getDefaultDataFile() {
  if (process.env.NOTES_DATA_FILE) {
    return path.resolve(process.env.NOTES_DATA_FILE);
  }

  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), "popaya-notes.json");
  }

  return path.resolve(__dirname, "../data/notes.json");
}

class NotesStore {
  constructor(dataFile) {
    this.dataFile = dataFile || getDefaultDataFile();
  }

  async ensureDatabase() {
    await fs.mkdir(path.dirname(this.dataFile), { recursive: true });

    try {
      await fs.access(this.dataFile);
    } catch (error) {
      await fs.writeFile(this.dataFile, "[]\n", "utf8");
    }
  }

  async readNotes() {
    await this.ensureDatabase();
    const raw = await fs.readFile(this.dataFile, "utf8");

    if (!raw.trim()) {
      return [];
    }

    const notes = JSON.parse(raw);
    return Array.isArray(notes) ? notes : [];
  }

  async writeNotes(notes) {
    await this.ensureDatabase();
    await fs.writeFile(this.dataFile, `${JSON.stringify(notes, null, 2)}\n`, "utf8");
  }

  validateInput(input, partial = false) {
    const titleProvided = Object.prototype.hasOwnProperty.call(input, "title");
    const contentProvided = Object.prototype.hasOwnProperty.call(input, "content");

    if (!partial || titleProvided) {
      if (typeof input.title !== "string" || !input.title.trim()) {
        throw new ValidationError("Title must not be empty");
      }
    }

    if (contentProvided && typeof input.content !== "string") {
      throw new ValidationError("Content must be text");
    }
  }

  sortByRecentlyUpdated(notes) {
    return [...notes].sort(
      (left, right) => new Date(right.updatedAt) - new Date(left.updatedAt)
    );
  }

  async list(search) {
    const notes = await this.readNotes();
    const query = typeof search === "string" ? search.trim().toLowerCase() : "";
    const filtered = query
      ? notes.filter((note) => {
          const searchable = `${note.title} ${note.content}`.toLowerCase();
          return searchable.includes(query);
        })
      : notes;

    return this.sortByRecentlyUpdated(filtered);
  }

  async get(id) {
    const notes = await this.readNotes();
    return notes.find((note) => note.id === id) || null;
  }

  async create(input) {
    this.validateInput(input);

    const notes = await this.readNotes();
    const now = new Date().toISOString();
    const note = {
      id: randomUUID(),
      title: input.title.trim(),
      content: typeof input.content === "string" ? input.content.trim() : "",
      createdAt: now,
      updatedAt: now
    };

    notes.push(note);
    await this.writeNotes(notes);

    return note;
  }

  async update(id, input) {
    this.validateInput(input, true);

    const notes = await this.readNotes();
    const noteIndex = notes.findIndex((note) => note.id === id);

    if (noteIndex === -1) {
      return null;
    }

    const current = notes[noteIndex];
    const updated = {
      ...current,
      title:
        typeof input.title === "string" ? input.title.trim() : current.title,
      content:
        typeof input.content === "string" ? input.content.trim() : current.content,
      updatedAt: new Date().toISOString()
    };

    notes[noteIndex] = updated;
    await this.writeNotes(notes);

    return updated;
  }

  async delete(id) {
    const notes = await this.readNotes();
    const noteIndex = notes.findIndex((note) => note.id === id);

    if (noteIndex === -1) {
      return false;
    }

    notes.splice(noteIndex, 1);
    await this.writeNotes(notes);

    return true;
  }
}

module.exports = { NotesStore, ValidationError, getDefaultDataFile };
