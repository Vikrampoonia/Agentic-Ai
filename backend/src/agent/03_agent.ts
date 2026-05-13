import { createAgent, providerStrategy } from "langchain";
import { z } from "zod";
import { chatModel } from "../utils/openai";
import { agentTools } from "./02_tools";
import { AGENT_SYSTEM_PROMPT, AGENT_ROUTER_SYSTEM_PROPMPT } from "./01_policy";
// define the exact response shape we want from the agent

const AgentResponseSchema = z.object({
  answer: z.string(),
  citations: z.array(
    z.object({
      source: z.string(),
      chunkId: z.number(),
      preview: z.string(),
    })
  ),
});

export const ProductAgent = createAgent({
  model: chatModel,
  tools: agentTools,
  systemPrompt: AGENT_SYSTEM_PROMPT,
  responseFormat: providerStrategy(AgentResponseSchema),
});

export async function runProductAgent(
  messages: { role: string; content: string }[]
): Promise<{ answer: string; citations: any[] }> {
  const result: any = await ProductAgent.invoke({ messages });

  if (result?.structuredResponse) {
    return {
      answer: result?.structuredResponse?.answer,
      citations: result?.structuredResponse?.citations ?? [],
    };
  }

  // fallback in case structuredResponse is not present

  return {
    answer: "",
    citations: [],
  };
}

export type QueryRoute = "RAG" | "GENERAL";

export async function routeQuery(
  question: string
): Promise<QueryRoute> {
   const response = await chatModel.invoke([
    {
      role: "system",
      content: AGENT_ROUTER_SYSTEM_PROPMPT,
    },
    {
      role: "user",
      content: question,
    },
  ]);

  const text = response.content.toString().trim();

  if (text.includes("RAG")) {
    return "RAG";
  }

  return "GENERAL";
}

export async function runGeneralAgent(
  messages: { role: string; content: string }[]
) {
  const response = await chatModel.invoke(messages);

  return {
    answer: response.content.toString(),
    citations: [],
  };
}