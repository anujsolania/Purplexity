import express from "express";
import { tavily } from "@tavily/core";
import { SYSTEM_PROMPT, getPrompt, getFollowUpPrompt } from "./prompt";
import Groq from "groq-sdk";
import middleware from "./middleware";
import cors from "cors"
import { prisma } from "./db";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const app = express();

app.use(express.json());
app.use(cors());

app.get("/conversations",middleware, async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        userId: (req as any).userId
      }
    })
    res.json(conversations)
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong /coversations" });
  }
})

app.get("/conversation/:id", async(req,res) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: req.params.id
      },
      include: {
        messages: true
      }
    })
    res.json(conversation)
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong /coversations/:id" });
  }
})


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

    const PROMPT = getPrompt(webSearchResults, userQuery);

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

    const followUpPrompt = getFollowUpPrompt(userQuery, fullAnswer);

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
  } catch (error) {
    console.error(error);
    res.write(`data:${JSON.stringify({ type: "ERROR", content: "Something went wrong" })}\n\n`);
    res.end();
  }
});

app.post("/purpexility_ask/follow_ups", async (req, res) => {

})

app.listen(3000, () => console.log("server is running"));
