import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { logger } from "@hono/hono/logger";
import { Redis } from "ioredis";
import postgres from "postgres";
import { levenshteinDistance } from "./grader-utils.js";

const app = new Hono();
const sql = postgres();

app.use("/*", cors());
app.use("/*", logger());

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
let consume_enabled = false;

const consume = async () => {
  while (consume_enabled) {
    console.log("starting")
    const start = await redis.llen(QUEUE_NAME)
    if (start > 0) {
      const id = await redis.rpop(QUEUE_NAME);
      console.log(id)
      const exercise = await sql`SELECT exercise_id, source_code FROM exercise_submissions WHERE id=${id}`;
      console.log(exercise[0]);
      const solution_obj = await sql`SELECT solution_code FROM exercises WHERE id=${exercise[0].exercise_id}`
      const solution = solution_obj[0].solution_code;
      const submission = exercise[0].source_code;
      console.log(submission)
      console.log(solution)
      await sql`UPDATE exercise_submissions SET grading_status = 'processing' WHERE id=${id}`;
      let timeOutTime; do { timeOutTime = Math.floor(Math.random() * 4) } while (timeOutTime === 0);
      const grade = await Math.ceil(100 * (1 - (levenshteinDistance(submission, solution) / Math.max(submission.length, solution.length))));
      console.log(grade);
      setTimeout(async () => {
        await sql`UPDATE exercise_submissions SET grading_status = 'graded', grade = ${grade} WHERE id=${id}`  
      }, timeOutTime*1000);
    
      console.log("graded", id)
    } else {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
};

consume();

app.get("/api/status", async (context) => {
  const queueLength = await redis.llen(QUEUE_NAME);
  console.log(queueLength)
  return context.json({queue_size: queueLength, consume_enabled: consume_enabled});
});

app.post("/api/consume/enable", (context) => {
  consume_enabled = true;
  console.log("enabling")
  consume();
  return context.json({ consume_enabled: consume_enabled});
});

app.post("/api/consume/disable", (context) => {
  consume_enabled = false;
  console.log("disabling")
  return context.json({ consume_enabled: consume_enabled});
});

export default app;