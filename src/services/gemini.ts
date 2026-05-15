import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize Gemini with the API key from environment
// In the AI Studio env, process.env.GEMINI_API_KEY is preferred
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const geminiService = {
  async summarizeDocument(text: string): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert academic summarizer. Summarize the following document text, highlighting the most important themes and insights. Keep it concise but thorough. Use Markdown.

Text: ${text.substring(0, 500000)}`, // Respect 1.5 Flash limits roughly or use Pro if needed
    });
    return response.text || 'Failed to generate summary.';
  },

  async chatWithDocument(text: string, history: { role: 'user' | 'model', text: string }[], query: string): Promise<string> {
    const contextLimit = 500000;
    const truncatedText = text.substring(0, contextLimit);
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [{ text: `You are an AI assistant helping a user understand a PDF document. Use the following document context to answer the user's questions accurately. If the answer is not in the text, say you don't know based on the document.

Document Context:
${truncatedText}` }]
        },
        ...history.map(h => ({
          role: h.role,
          parts: [{ text: h.text }]
        })),
        {
          role: 'user',
          parts: [{ text: query }]
        }
      ]
    });
    
    return response.text || "I'm sorry, I couldn't process that request.";
  },

  async extractKeyInsights(text: string): Promise<string[]> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract exactly 3-5 high-impact "Key Insights" from the following text. Return them as a simple list where each line starts with "- ".

Text: ${text.substring(0, 100000)}`,
    });
    
    const textResult = response.text || '';
    return textResult.split('\n').filter(line => line.trim().startsWith('-')).map(line => line.replace('- ', '').trim());
  },

  async generateResearchAssistantSuggestions(text: string): Promise<{
    topics: string[];
    connections: string[];
    questions: string[];
  }> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an AI Research Assistant. Analyze the following document and suggest:
1. Three "Related Research Topics" (specific areas for further study).
2. Three "Academic Connections" (how this relates to broader fields like sociology, quantum physics, etc.).
3. Three "Deep-Dive Questions" (provocative questions to stimulate further analysis).

Return the response as a JSON object with this exact structure:
{
  "topics": ["topic1", "topic2", "topic3"],
  "connections": ["conn1", "conn2", "conn3"],
  "questions": ["q1", "q2", "q3"]
}

Document Context:
${text.substring(0, 500000)}`,
    });

    try {
      const cleanedText = response.text?.replace(/```json|```/g, '').trim() || '{}';
      return JSON.parse(cleanedText);
    } catch (e) {
      console.error('Failed to parse research suggestions:', e);
      return { topics: [], connections: [], questions: [] };
    }
  },

  async generateTutoringQuestion(text: string, history: Message[], difficulty: string = 'intermediate'): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an AI Tutor. Based on the document below, ask the user a question to test their understanding at a ${difficulty} level. 
      - Beginner: Focus on basic facts and definitions.
      - Intermediate: Focus on relationships between concepts and main arguments.
      - Advanced: Focus on critical analysis, hidden implications, and complex syntheses.

      Avoid questions you've already asked in the history.
      
Document Context:
${text.substring(0, 500000)}

Chat History:
${history.map(h => `${h.role}: ${h.text}`).join('\n')}

Ask only the question. Be encouraging but rigorous.`,
    });
    return response.text || "What is the main argument of this document?";
  },

  async evaluateTutoringAnswer(text: string, question: string, answer: string): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an AI Tutor. The user is answering a question about the document below. 
      Evaluate their answer for accuracy. Provide a clear explanation of the correct concept if they are wrong or partially correct. Use a supportive, educational tone.

Document Context:
${text.substring(0, 500000)}

Question asked: ${question}
User's Answer: ${answer}

Provide the evaluation and a brief follow-up explanation.`,
    });
    return response.text || "Good attempt. Let's look closer at the document's main points.";
  }
};

export interface Message {
  role: 'user' | 'model';
  text: string;
}
