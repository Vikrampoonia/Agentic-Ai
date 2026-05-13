import { Router } from "express";
import { runProductAgent, routeQuery, runGeneralAgent, } from "../agent/03_agent";
import {
  appendToHistory,
  ensureThreadId,
  getHistory,
} from "../agent/04_memory";

export const agentRouter = Router();

agentRouter.post("/chat", async (req, res) => {
  try {
    const { message, threadId: incomingThreadId } = req.body as {
      message?: string;
      threadId?: string;
    };

    if (!message || !message.trim()) {
      return res.status(400).json({
        ok: false,
        message: "Message is required",
      });
    }

    let result;

    const threadId = await ensureThreadId(incomingThreadId);

    const history = await getHistory(threadId);

    const usermsg = {
      role: "user" as const,
      content: message.trim(),
    };

    await appendToHistory(threadId, usermsg);

    const messagesForAgent = [...history, usermsg];

    const recentContext = messagesForAgent
    .slice(-4)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

    const route = await routeQuery(recentContext);

    if (route === "RAG") {
      result = await runProductAgent(messagesForAgent);
    } else {
      result = await runGeneralAgent(messagesForAgent);
    }

    const assistantmsg = {
      role: "assistant" as const,
      content: result.answer,
    };

    await appendToHistory(threadId, assistantmsg);

    const { answer, citations } = result;


    return res.json({
      ok: true,
      threadId,
      answer,
      citations,
    });
  } catch (e: any) {
    console.log(e);
    return res.status(500).json({
      ok: false,
      message: "Some error occured",
    });
  }
});
