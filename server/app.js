import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { logger } from "@hono/hono/logger";
import postgres from "postgres";
import { cache } from "@hono/hono/cache"
import { Redis } from "ioredis"
import { auth } from "./auth.js";

const app = new Hono();
const sql = postgres();

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

let redis;
if (Deno.env.get("REDIS_HOST")) {
  redis = new Redis(
    Number.parseInt(Deno.env.get("REDIS_PORT")),
    Deno.env.get("REDIS_HOST"),
  );
} else {
  redis = new Redis(6379, "redis");
}

const QUEUE_NAME = "submissions";

app.use("/*", cors());
app.use("/*", logger());

app.use("*", async (context, next) => {
  const session = await auth.api.getSession({ headers: context.req.raw.headers });
  if (!session) {
    return next();
  }

  context.set("user", session.user);
  return next();
});

app.use("/api/exercises/:id/submissions", async (context, next) => {
  const user = context.get("user");
  if (!user) {
    context.status(401);
    return context.json({ message: "Unauthorized" });
  }
  return next();
});

app.use("/api/submissions/:id/status", async (context, next) => {
  const user = context.get("user");
  if (!user) {
    context.status(401);
    return context.json({ message: "Unauthorized" });
  };
  return next();
});

app.get(
    "/api/languages/*",
    cache({
        cacheName: "language-cache",
        wait: true,
    }),
);

app.get("/api/lgtm-test", (c) => {
  console.log("Hello log collection :)");
  return c.json({ message: "Hello, world!" });
});

app.get("/api/languages", async (context) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const result = await sql`SELECT * FROM languages ORDER BY id`;
    return context.json(result);
});

app.get("/api/languages/:id/exercises", async (context) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const languageID = context.req.param().id
    const result = await sql`SELECT id, title, description FROM exercises WHERE language_id=${languageID}`
    return context.json(result);
});

app.get("/api/exercises/:id", async (context) => {
  const exerciseId = context.req.param().id;
  const exercise = await sql`SELECT id, title, description FROM exercises WHERE id=${exerciseId}`;
  console.log("exer", exercise);
  if (exercise.length > 0) {
    return context.json(exercise[0]);
  };
  context.status(404);
  return context.body();
});

app.get("/api/submissions/:id/status", async (context) => {
    const userId = context.get("user").id;
    const submissionID = context.req.param().id;
    const submission = await sql`SELECT grading_status, grade, user_id FROM exercise_submissions WHERE id=${submissionID}`;
    if (submission && submission.length > 0 && userId === submission[0].user_id) {
      const result = { grading_status: submission[0].grading_status, grade: submission[0].grade }
      return context.json(result);
    }
    context.status(404);
    return context.body();
});


app.post("/api/exercises/:id/submissions", async (context) => {
    const userId = context.get("user").id;
    const id = context.req.param().id;
    const submission = await context.req.json();
    const result = await sql`INSERT INTO exercise_submissions (exercise_id, source_code, user_id) VALUES (${id}, ${submission["source_code"]}, ${userId}) RETURNING id`;
    const newId = result[0].id;
    console.log(newId)
    await redis.lpush(QUEUE_NAME, newId);
    context.status(202);
    const response = { id: newId}
    console.log(response)
    return context.json(response)
})

export default app;