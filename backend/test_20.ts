import { google } from "@ai-sdk/google";
import { generateText } from "ai";

async function main() {
  try {
    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      prompt: "Hello",
    });
    console.log("gemini-2.0-flash OK:", text);
  } catch(e) {
    console.error("gemini-2.0-flash Error:", e.message);
  }
}
main();
