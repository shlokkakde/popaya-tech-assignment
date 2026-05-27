const assert = require("assert/strict");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const test = require("node:test");
const { createApp } = require("../src/server");

async function startTestServer() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "notes-api-"));
  const dataFile = path.join(tempDir, "notes.json");
  const app = createApp({ dataFile, staticDir: null });
  const server = app.listen(0);

  await new Promise((resolve) => server.once("listening", resolve));

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  return {
    baseUrl,
    close: () => new Promise((resolve) => server.close(resolve))
  };
}

async function request(baseUrl, pathName, options = {}) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  const body = await response.json();
  return { response, body };
}

test("creates, lists, searches, updates, fetches, and deletes notes", async () => {
  const server = await startTestServer();

  try {
    const createFirst = await request(server.baseUrl, "/notes", {
      method: "POST",
      body: JSON.stringify({
        title: "Project Plan",
        content: "Break the work into backend and frontend tasks."
      })
    });

    assert.equal(createFirst.response.status, 201);
    assert.equal(createFirst.body.data.title, "Project Plan");

    const createSecond = await request(server.baseUrl, "/notes", {
      method: "POST",
      body: JSON.stringify({
        title: "Shopping",
        content: "Buy notebooks"
      })
    });

    assert.equal(createSecond.response.status, 201);

    const list = await request(server.baseUrl, "/notes");
    assert.equal(list.response.status, 200);
    assert.equal(list.body.data.length, 2);

    const search = await request(server.baseUrl, "/notes?search=frontend");
    assert.equal(search.response.status, 200);
    assert.equal(search.body.data.length, 1);
    assert.equal(search.body.data[0].title, "Project Plan");

    const updated = await request(
      server.baseUrl,
      `/notes/${createFirst.body.data.id}`,
      {
        method: "PUT",
        body: JSON.stringify({
          title: "Updated Project Plan",
          content: "Ship the notes assignment."
        })
      }
    );

    assert.equal(updated.response.status, 200);
    assert.equal(updated.body.data.title, "Updated Project Plan");
    assert.notEqual(updated.body.data.updatedAt, createFirst.body.data.updatedAt);

    const single = await request(server.baseUrl, `/notes/${createFirst.body.data.id}`);
    assert.equal(single.response.status, 200);
    assert.equal(single.body.data.content, "Ship the notes assignment.");

    const deleted = await request(server.baseUrl, `/notes/${createSecond.body.data.id}`, {
      method: "DELETE"
    });
    assert.equal(deleted.response.status, 200);

    const afterDelete = await request(server.baseUrl, "/notes");
    assert.equal(afterDelete.body.data.length, 1);
  } finally {
    await server.close();
  }
});

test("rejects notes without a title", async () => {
  const server = await startTestServer();

  try {
    const result = await request(server.baseUrl, "/notes", {
      method: "POST",
      body: JSON.stringify({
        title: "   ",
        content: "Missing title"
      })
    });

    assert.equal(result.response.status, 400);
    assert.equal(result.body.error, "Title must not be empty");
  } finally {
    await server.close();
  }
});
