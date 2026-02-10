export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const rating = Number(body.rating || 0);
    const improve = String(body.improve || "");
    const comment = String(body.comment || "");

    if (!(rating >= 1 && rating <= 3)) {
      return json({ error: "rating must be 1-3 for feedback" }, 400);
    }

    // DBが未設定でも落ちないようにする（最初はログだけでも運用可）
    if (context.env.DB) {
      await context.env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS feedback (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          created_at TEXT NOT NULL,
          rating INTEGER NOT NULL,
          improve TEXT,
          comment TEXT
        )`
      ).run();

      await context.env.DB.prepare(
        `INSERT INTO feedback (created_at, rating, improve, comment)
         VALUES (?1, ?2, ?3, ?4)`
      )
        .bind(new Date().toISOString(), rating, improve, comment)
        .run();
    } else {
      console.log("feedback(no-db):", { rating, improve, comment });
    }

    return json({ ok: true }, 200);
  } catch (e) {
    return json({ error: e?.message || "unknown error" }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
