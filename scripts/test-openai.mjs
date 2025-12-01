import { config } from "dotenv";
import OpenAI from "openai";

config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set. Add it to your .env first.");
    process.exit(1);
  }

  const res = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a diagnostic bot. Reply with 'pong: <short reply>'." },
      { role: "user", content: "ping" },
    ],
    max_tokens: 50,
  });

  const text = res.choices?.[0]?.message?.content;
  console.log("OpenAI chat reply:", text);
}

main().catch((err) => {
  console.error("OpenAI call failed:", err);
  process.exit(1);
});
