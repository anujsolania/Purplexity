import express from "express";
import { tavily } from "@tavily/core";
import { PROMPT_TEMPLATE, SYSTEM_PROMPT } from "./prompt";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY });

const app = express();

app.use(express.json());

app.post("/purpexility_ask", async (req, res) => {
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
    model: google("gemini-flash-latest"),
    prompt: PROMPT,
    system: SYSTEM_PROMPT,
  });

  //required headers
  res.header("Cache-Control", "no-cache");
  res.header("Content-Type", "text/plain");

  for await (const textPart of result.textStream) {
    res.write(textPart);
  }

  //stream back the responses
  res.write("<SOURCES>");

  res.write(
    JSON.stringify(webSearchResults.map((result) => ({ url: result.url })))
  );

  res.write("</SOURCES>");

  //end the stream
  res.end();
});

app.listen(3000, () => console.log("server is running"));
