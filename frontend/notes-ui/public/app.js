const apiBase = "/api/notes";

const state = {
  notes: [],
  selectedId: "",
  loading: false,
  search: "",
  error: ""
};

const elements = {
  searchInput: document.querySelector("#searchInput"),
  notesCount: document.querySelector("#notesCount"),
  listStatus: document.querySelector("#listStatus"),
  notesList: document.querySelector("#notesList"),
  refreshButton: document.querySelector("#refreshButton"),
  newNoteButton: document.querySelector("#newNoteButton"),
  noteForm: document.querySelector("#noteForm"),
  noteId: document.querySelector("#noteId"),
  titleInput: document.querySelector("#titleInput"),
  contentInput: document.querySelector("#contentInput"),
  noteMeta: document.querySelector("#noteMeta"),
  formError: document.querySelector("#formError"),
  saveButton: document.querySelector("#saveButton"),
  clearButton: document.querySelector("#clearButton"),
  deleteButton: document.querySelector("#deleteButton"),
  editorMode: document.querySelector("#editorMode"),
  editorTitle: document.querySelector("#editorTitle")
};

const trashIcon = `
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 11v5M14 11v5"></path>
  </svg>
`;

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function previewText(content) {
  const normalized = (content || "").replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "No content";
  }

  return normalized.length > 130
    ? `${normalized.slice(0, 127)}...`
    : normalized;
}

function setFormError(message = "") {
  elements.formError.textContent = message;
}

function setListStatus(message = "") {
  elements.listStatus.textContent = message;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload;
}

function updateEditor(note) {
  const hasNote = Boolean(note);

  elements.noteId.value = hasNote ? note.id : "";
  elements.titleInput.value = hasNote ? note.title : "";
  elements.contentInput.value = hasNote ? note.content : "";
  elements.deleteButton.disabled = !hasNote;
  elements.editorMode.textContent = hasNote ? "Editing note" : "New note";
  elements.editorTitle.textContent = hasNote ? note.title : "Create a note";
  elements.noteMeta.hidden = !hasNote;
  elements.noteMeta.innerHTML = hasNote
    ? `<span>Created ${formatDate(note.createdAt)}</span><span>Updated ${formatDate(note.updatedAt)}</span>`
    : "";

  setFormError();
}

function resetEditor() {
  state.selectedId = "";
  updateEditor(null);
  renderNotes();
  elements.titleInput.focus();
}

function selectNote(id) {
  const note = state.notes.find((item) => item.id === id);

  if (!note) {
    resetEditor();
    return;
  }

  state.selectedId = id;
  updateEditor(note);
  renderNotes();
}

function createNoteItem(note) {
  const item = document.createElement("li");
  item.className = `note-item${note.id === state.selectedId ? " is-active" : ""}`;

  const selectButton = document.createElement("button");
  selectButton.className = "note-select";
  selectButton.type = "button";
  selectButton.setAttribute("aria-label", `Open ${note.title}`);
  selectButton.addEventListener("click", () => selectNote(note.id));

  const title = document.createElement("h3");
  title.textContent = note.title;

  const preview = document.createElement("p");
  preview.textContent = previewText(note.content);

  const dates = document.createElement("div");
  dates.className = "note-dates";

  const created = document.createElement("span");
  created.textContent = `Created ${formatDate(note.createdAt)}`;

  const updated = document.createElement("span");
  updated.textContent = `Updated ${formatDate(note.updatedAt)}`;

  dates.append(created, updated);
  selectButton.append(title, preview, dates);

  const deleteButton = document.createElement("button");
  deleteButton.className = "icon-button danger";
  deleteButton.type = "button";
  deleteButton.title = "Delete note";
  deleteButton.setAttribute("aria-label", `Delete ${note.title}`);
  deleteButton.innerHTML = trashIcon;
  deleteButton.addEventListener("click", (event) => {
    event.stopPropagation();
    deleteNote(note.id);
  });

  item.append(selectButton, deleteButton);
  return item;
}

function renderNotes() {
  elements.notesList.innerHTML = "";
  elements.notesCount.textContent = `${state.notes.length} ${
    state.notes.length === 1 ? "note" : "notes"
  }`;

  if (state.loading) {
    setListStatus("Loading notes...");
    return;
  }

  setListStatus(state.error);

  if (state.notes.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = state.error
      ? "Notes could not be loaded."
      : state.search
        ? "No matching notes found."
        : "No notes yet.";
    elements.notesList.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  state.notes.forEach((note) => fragment.append(createNoteItem(note)));
  elements.notesList.append(fragment);
}

async function loadNotes() {
  state.loading = true;
  state.error = "";
  renderNotes();

  try {
    const query = state.search ? `?search=${encodeURIComponent(state.search)}` : "";
    const payload = await apiRequest(query);
    state.notes = payload.data;

    if (state.selectedId) {
      const selected = state.notes.find((note) => note.id === state.selectedId);
      if (selected) {
        updateEditor(selected);
      } else {
        state.selectedId = "";
        updateEditor(null);
      }
    }
  } catch (error) {
    state.error = error.message;
  } finally {
    state.loading = false;
    renderNotes();
  }
}

async function saveNote(event) {
  event.preventDefault();
  setFormError();

  const title = elements.titleInput.value.trim();
  const content = elements.contentInput.value;

  if (!title) {
    setFormError("Title must not be empty");
    elements.titleInput.focus();
    return;
  }

  elements.saveButton.disabled = true;

  try {
    const id = elements.noteId.value;
    const payload = await apiRequest(id ? `/${id}` : "", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify({ title, content })
    });

    state.search = "";
    elements.searchInput.value = "";
    state.selectedId = payload.data.id;
    await loadNotes();
    selectNote(payload.data.id);
  } catch (error) {
    setFormError(error.message);
  } finally {
    elements.saveButton.disabled = false;
  }
}

async function deleteNote(id = elements.noteId.value) {
  if (!id) {
    return;
  }

  const note = state.notes.find((item) => item.id === id);
  const label = note ? `"${note.title}"` : "this note";

  if (!window.confirm(`Delete ${label}?`)) {
    return;
  }

  try {
    await apiRequest(`/${id}`, { method: "DELETE" });

    if (state.selectedId === id) {
      state.selectedId = "";
      updateEditor(null);
    }

    await loadNotes();
  } catch (error) {
    setFormError(error.message);
  }
}

let searchTimer;
elements.searchInput.addEventListener("input", (event) => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    state.search = event.target.value.trim();
    loadNotes();
  }, 250);
});

elements.noteForm.addEventListener("submit", saveNote);
elements.refreshButton.addEventListener("click", loadNotes);
elements.newNoteButton.addEventListener("click", resetEditor);
elements.clearButton.addEventListener("click", resetEditor);
elements.deleteButton.addEventListener("click", () => deleteNote());

loadNotes();
