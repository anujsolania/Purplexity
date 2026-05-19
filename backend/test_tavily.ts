import { tavily } from "@tavily/core";
const client = tavily({ apiKey: process.env.TAVILY_API_KEY });
console.log("Searching...");
client.search("what is typescript", { searchDepth: "advanced" })
  .then(res => console.log("Success:", res.results.length))
  .catch(err => console.error("Error:", err))
  .finally(() => console.log("Done."));
