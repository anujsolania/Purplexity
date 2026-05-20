import express from "express";
import { tavily } from "@tavily/core";
import { PROMPT_TEMPLATE, SYSTEM_PROMPT } from "./prompt";
import { streamText } from "ai";
import { groq } from "@ai-sdk/groq";
const client = tavily({ apiKey: process.env.TAVILY_API_KEY });

const app = express();

app.use(express.json());

app.post("/purpexility_ask", async (req, res) => {
  try {
    //get the user query
    if (!req.body || !req.body.query) {
      res.status(400).json({ error: "Missing query in body" });
      return;
    }
    const userQuery = req.body.query;

    //do web search
    const webSearchResponse = await client.search(userQuery, {
      searchDepth: "advanced",
    });

    const webSearchResults = webSearchResponse.results;

    //context engineering (web search + some context)
    const PROMPT = PROMPT_TEMPLATE.replace(
      "{{WEB_SEARCH_RESULTS}}",
      JSON.stringify(webSearchResults)
    ).replace("{{USER_QUERY}}", userQuery);

    //hit the LLM api and stream the response
    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: PROMPT,
      system: SYSTEM_PROMPT,
    });

    //required headers
    res.header("Cache-Control", "no-cache");
    res.header("Content-Type", "text/event-stream");
    res.header("Connection", "keep-alive");

    for await (const textPart of result.textStream) {
      // SSE requires each message to start with "data: " and end with two newlines
      // We stringify the chunk to handle any inner newlines safely
      res.write(`data: ${JSON.stringify(textPart)}\n\n`);
    }

    //stream back the responses
    res.write(`data: ${JSON.stringify("<SOURCES>")}\n\n`);

    res.write(
      `data: ${JSON.stringify(webSearchResults.map((result) => ({ url: result.url })))}\n\n`
    );

    res.write(`data: ${JSON.stringify("</SOURCES>")}\n\n`);

    //end the stream
    res.end();
  } catch (error: any) {
    console.error("API Request Failed:", error);
    if (!res.headersSent) {
      res.status(503).json({ error: "Groq API is currently overloaded. Please try again in a few minutes." });
    } else {
      res.write(`data: ${JSON.stringify("\n\n[ERROR: Groq API is overloaded. Please try again.]")}\n\n`);
      res.end();
    }
  }
});

app.listen(3000, () => console.log("server is running"));
