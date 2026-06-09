import express from "express";
import { tavily } from "@tavily/core";
import { PROMPT_TEMPLATE, SYSTEM_PROMPT } from "./prompt";
import Groq from "groq-sdk";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
    const stream = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: PROMPT,
        },
      ],
      model: "openai/gpt-oss-20b",
      stream: true,
    });

    //required headers
    res.header("Content-Type", "text/event-stream");
    res.header("Cache-Control", "no-cache");
    res.header("Connection", "keep-alive");
    res.flushHeaders();

    let fullResponse = "";
    // Stream raw chunks in real-time
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      fullResponse += content;
      // Send raw content immediately
      res.write(`data: ${JSON.stringify({ type: "RAW_CHUNK", content })}\n\n`);
    }

    // Parse the complete JSON response
    let parsedResponse = { answer: "", follow_ups: [] };
    try {
      parsedResponse = JSON.parse(fullResponse);
    } catch (e) {
      console.error("Failed to parse LLM response as JSON:", e);
      parsedResponse = { answer: fullResponse, follow_ups: [] };
    }

    // Send follow-ups
    res.write(`data: ${JSON.stringify({ type: "FOLLOW_UPS", content: parsedResponse.follow_ups })}\n\n`);

    // Send sources
    res.write(
      `data: ${JSON.stringify({
        type: "SOURCES",
        content: webSearchResults.map((result) => ({ url: result.url })),
      })}\n\n`
    );

    //end the stream
    res.end();
  } catch (error: any) {
    console.error("API Request Failed:", error);
    if (!res.headersSent) {
      res.status(503).json({
        error:
          "Groq API is currently overloaded. Please try again in a few minutes.",
      });
    } else {
      res.write(
        `data: ${JSON.stringify(
          "\n\n[ERROR: Groq API is overloaded. Please try again.]"
        )}\n\n`
      );
      res.end();
    }
  }
});

app.listen(3000, () => console.log("server is running"));
