export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const rating = Number(body.rating || 0);
    const goodPoints = Array.isArray(body.goodPoints) ? body.goodPoints : [];
    const visitType = String(body.visitType || "");
    const companion = String(body.companion || "");
    const freeComment = String(body.freeComment || "");

    if (!(rating >= 4 && rating <= 5)) {
      return json({ error: "rating must be 4-5 for generate" }, 400);
    }

    const labelMap = {
      clean: "施設がきれい・清潔",
      routes: "壁・課題の種類が豊富",
      staff: "スタッフが親切・丁寧",
      beginner: "初心者にやさしい",
      setting: "課題のセットが面白い",
      price: "料金がリーズナブル",
      access: "アクセスが良い",
      atmosphere: "雰囲気・居心地が良い",
      kids: "キッズにも対応している",
      training: "トレーニング設備が充実",
    };

    const picked = goodPoints
      .map((id) => labelMap[id])
      .filter(Boolean)
      .slice(0, 6);

    // 低コスト寄りのモデル（必要なら変えてOK）
    // 価格・無料枠の考え方はWorkers AIのPricing参照 :contentReference[oaicite:5]{index=5}
    const MODEL = "@cf/meta/llama-3.2-3b-instruct";

    const prompt = [
      "あなたはボルダリングジム「エナジークライミングジム柏」に来店したお客様です。",
      "Googleマップに投稿する文章の“下書き”を1つ作ってください。",
      "",
      "条件:",
      `- 良かった点（参考）: ${picked.length ? picked.join("、") : "（未選択）"}`,
      visitType ? `- 来店回数: ${visitType}` : "",
      companion ? `- 誰と来たか: ${companion}` : "",
      freeComment ? `- ひとこと: ${freeComment}` : "",
      "",
      "ルール:",
      "- 100〜200文字くらい",
      "- 自然で人間味のある文体（です・ます/口語どちらでもOK）",
      "- 良かった点を2〜3個だけ自然に触れる（全部盛りにしない）",
      "- 星の数は書かない",
      "- 「口コミ」「レビュー」という単語は使わない",
      "- 定型文っぽさを避ける（毎回変える）",
      "- 絵文字は入れても1〜2個まで（無理に入れない）",
      "",
      "文章だけを出力してください。",
    ].filter(Boolean).join("\n");

    // Pages FunctionsのAI bindingは context.env.AI で使う :contentReference[oaicite:6]{index=6}
    const result = await context.env.AI.run(MODEL, {
      prompt,
      temperature: 0.9,
      max_tokens: 260,
    });

    const text =
      typeof result === "string"
        ? result
        : (result?.response ?? "").toString();

    const review = (text || "").trim();
    if (!review) return json({ error: "empty generation" }, 500);

    return json({ review }, 200);
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
