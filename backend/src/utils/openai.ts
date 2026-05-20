import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { env } from "./env";

export const chatModel = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  temperature: 0.2, // 0
  apiKey: env.GEMINI_API_KEY,
});

export const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "text-embedding-004",
  apiKey: env.GEMINI_API_KEY,
});
