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

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.flushHeaders();

    //do web search
    const webSearchResponse = await client.search(userQuery, {
      searchDepth: "advanced",
    });

    const webSearchResults = webSearchResponse.results;

    const sources = webSearchResults.map((item) => ({
      title: item.title,
      url: item.url,
    }));

    res.write(
      `data:${JSON.stringify({
        type: "SOURCES",
        content: sources,
      })}\n\n`
    );

    //context engineering (web search + some context)
    // const PROMPT = PROMPT_TEMPLATE.replace(
    //   "{{WEB_SEARCH_RESULTS}}",
    //   JSON.stringify(webSearchResults)
    // ).replace("{{USER_QUERY}}", userQuery);

    const prompt = `
    Web Search Results

    ${JSON.stringify(webSearchResults)}

    Question

    ${userQuery}
    `;

    //hit the LLM api and stream the response
    const stream = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "openai/gpt-oss-20b",
      stream: true,
    });

    let fullAnswer = "";

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || "";

      if (!token) continue;

      fullAnswer += token;

      res.write(
        `data:${JSON.stringify({
          type: "TEXT_DELTA",
          content: token,
        })}\n\n`
      );
    }

    const followUpPrompt = `
    User Question:
    ${userQuery}
    Assistant Answer:
    ${fullAnswer}
    Generate exactly 3 follow up questions.
    Return JSON only.
    {
      "follow_ups":[
        "...",
        "...",
        "..."
      ]
    }
`;

    //second groq llm api call
    const followUps = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: followUpPrompt,
        },
      ],
      model: "openai/gpt-oss-20b",
    });

    const followUpsText = followUps.choices[0]?.message.content;

    let parsed = {
      follow_ups: [],
    };

    try {
      parsed = JSON.parse(followUpsText ?? "");
    } catch (error) {
      console.log("JSON parsing failed");
    }

    // Send follow-ups
    res.write(
      `data:${JSON.stringify({
        type: "FOLLOW_UPS",
        content: parsed.follow_ups,
      })}\n\n`
    );

    res.write(
      `data:${JSON.stringify({
        type: "DONE",
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
