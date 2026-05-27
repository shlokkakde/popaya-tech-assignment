const express = require("express");
const path = require("path");
const { NotesStore, ValidationError } = require("./store");

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function createNotesRouter(store) {
  const router = express.Router();

  router.get(
    "/",
    asyncRoute(async (req, res) => {
      const notes = await store.list(req.query.search);
      res.json({ data: notes });
    })
  );

  router.get(
    "/:id",
    asyncRoute(async (req, res) => {
      const note = await store.get(req.params.id);

      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      res.json({ data: note });
    })
  );

  router.post(
    "/",
    asyncRoute(async (req, res) => {
      const note = await store.create(req.body);
      res.status(201).json({ data: note });
    })
  );

  router.put(
    "/:id",
    asyncRoute(async (req, res) => {
      const note = await store.update(req.params.id, req.body);

      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }

      res.json({ data: note });
    })
  );

  router.delete(
    "/:id",
    asyncRoute(async (req, res) => {
      const deleted = await store.delete(req.params.id);

      if (!deleted) {
        return res.status(404).json({ error: "Note not found" });
      }

      res.json({ message: "Note deleted" });
    })
  );

  return router;
}

function createApp(options = {}) {
  const app = express();
  const store = options.store || new NotesStore(options.dataFile);
  const staticDir = Object.prototype.hasOwnProperty.call(options, "staticDir")
    ? options.staticDir
    : path.resolve(__dirname, "../../../frontend/notes-ui/public");

  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  const notesRouter = createNotesRouter(store);
  app.use("/api/notes", notesRouter);
  app.use("/notes", notesRouter);

  if (staticDir) {
    app.use(express.static(staticDir));
    app.get("/", (req, res) => {
      res.sendFile(path.join(staticDir, "index.html"));
    });
  }

  app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
  });

  app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && "body" in error) {
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

if (require.main === module) {
  const port = process.env.PORT || 5000;
  const app = createApp();

  app.listen(port, () => {
    console.log(`Notes app running at http://localhost:${port}`);
  });
}

module.exports = { createApp, createNotesRouter };
