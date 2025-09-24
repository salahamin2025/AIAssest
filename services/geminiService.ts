import { GoogleGenAI, Content } from "@google/genai";
import { Message, MessageRole, Source, Citation } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelName = 'gemini-2.5-flash';

const systemInstruction: Content = {
    role: "system",
    parts: [{ text: "You are an expert AI legal assistant specializing in Egyptian administrative law, university regulations, student affairs bylaws, and the credit hour system (لوائح الساعات المعتمدة). Your primary goal is to provide accurate, well-supported, and clearly formatted answers based on reliable sources. You must adhere to the following guidelines:\n1.  **Cite Sources:** Back up every key piece of information with a citation. Use the format `[Source X]` at the end of the sentence.\n2.  **Format Responses:** Use Markdown for clarity (e.g., headings, lists, bold text) to structure your answers logically.\n3.  **Synthesize, Don't Copy:** Integrate information from multiple sources to provide comprehensive answers. Avoid direct copy-pasting.\n4.  **Language:** Respond exclusively in Arabic.\n5.  **Clarity and Conciseness:** Write clearly and directly, making complex legal topics understandable to a non-expert audience.\n6.  **Grounding is Key:** Base your answers ONLY on the information found in the provided search results. Do not use any prior knowledge." }],
};

const buildHistory = (messages: Message[]): Content[] => {
    return messages.map(msg => {
        if (msg.role === MessageRole.USER && msg.imageUrl) {
            const [mimePart, base64Data] = msg.imageUrl.split(';base64,');
            const mimeType = mimePart.replace('data:', '');
            return {
                role: 'user',
                parts: [
                    { text: msg.text },
                    { inlineData: { mimeType, data: base64Data } }
                ]
            };
        }
        return {
            role: msg.role === MessageRole.USER ? 'user' : 'model',
            parts: [{ text: msg.text }],
        };
    });
};

export const sendMessageStream = async function* (
    history: Message[],
    signal: AbortSignal
): AsyncGenerator<Partial<Message>> {
    
    const contents = buildHistory(history);

    try {
        const responseStream = await ai.models.generateContentStream({
            model: modelName,
            contents,
            systemInstruction,
            tools: [{ googleSearch: {} }],
            thinkingConfig: { thinkingBudget: 0 }
        }, { signal });

        let fullText = "";
        let sources: Source[] = [];
        let citations: Citation[] = [];

        for await (const chunk of responseStream) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullText += chunkText;
            }

            const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
            if (groundingMetadata?.groundingChunks) {
                 const newSources = groundingMetadata.groundingChunks
                    .map((c: any) => c.web)
                    .filter((s: any) => s && s.uri && s.title)
                    .map((s: any) => ({ uri: s.uri, title: s.title }))
                    .filter((s: Source) => !sources.some(existing => existing.uri === s.uri));
                
                if (newSources.length > 0) {
                    sources = [...sources, ...newSources];
                }
            }

            const citationMetadata = chunk.candidates?.[0]?.citationMetadata;
            if (citationMetadata?.citationSources) {
                citations = citationMetadata.citationSources.map((c: any, index: number) => ({
                    startIndex: c.startIndex,
                    endIndex: c.endIndex,
                    sourceIndex: sources.findIndex(s => s.uri === c.uri) ?? index,
                }));
            }
            
            yield { 
                role: MessageRole.MODEL, 
                text: chunk.text, // Yield only the new chunk for typewriter effect
                sources: sources.length > 0 ? [...sources] : undefined, 
                citations: citations.length > 0 ? [...citations] : undefined
            };
        }

    } catch (error) {
        if ((error as Error).name !== 'AbortError') {
            console.error("Error sending message to Gemini:", error);
            yield { 
                role: MessageRole.MODEL, 
                text: "عذراً، حدث خطأ أثناء الاتصال. يرجى المحاولة مرة أخرى." 
            };
        }
    }
};

export const getChatTitle = async (history: Message[]): Promise<string> => {
    if (history.length === 0) return "محادثة جديدة";

    const userPrompt = history.find(m => m.role === MessageRole.USER)?.text || '';
    const modelResponse = history.find(m => m.role === MessageRole.MODEL)?.text || '';

    const titlePrompt = `Generate a very short, concise title in Arabic for the following conversation. The title should be no more than 5 words.\n\nUser: ${userPrompt}\nModel: ${modelResponse.slice(0, 200)}...`;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: titlePrompt,
        });
        const title = response.text.trim().replace(/"/g, '');
        return title || "محادثة غير معنونة";
    } catch (error) {
        console.error("Error generating title:", error);
        return "محادثة غير معنونة";
    }
}