/**
 * Config & State Module
 */

export const PROVIDER_MODELS = {
    google: [
        { value: "gemini-2.5-flash", label: "gemini-2.5-flash (Fast & Recommended)" },
        { value: "gemini-2.5-pro", label: "gemini-2.5-pro (High intelligence)" }
    ],
    openai: [
        { value: "gpt-4o-mini", label: "gpt-4o-mini (Cost-effective & Fast)" },
        { value: "gpt-4o", label: "gpt-4o (Advanced Reasoning)" }
    ],
    groq: [
        { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (State-of-the-Art)" },
        { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B (High Context)" }
    ],
    ollama: [
        { value: "llama3", label: "Llama 3 (Local LLM)" },
        { value: "mistral", label: "Mistral (Local LLM)" },
        { value: "phi3", label: "Phi-3 (Local LLM)" },
        { value: "gemma2", label: "Gemma 2 (Local LLM)" }
    ]
};

// Global App State
export const state = {
    activeTab: "chat-tab",
    chatHistory: [],
    ragHistory: [],
    activeProvider: "google",
    activeModel: "gemini-2.5-flash",
    activeTemperature: 0.7,
    apiKeyGoogle: "",
    apiKeyOpenAI: "",
    apiKeyGroq: ""
};

// Helper: Package headers
export function getHeaders() {
    const headers = {
        "Content-Type": "application/json"
    };
    if (state.apiKeyGoogle) headers["X-Google-Key"] = state.apiKeyGoogle;
    if (state.apiKeyOpenAI) headers["X-OpenAI-Key"] = state.apiKeyOpenAI;
    if (state.apiKeyGroq) headers["X-Groq-Key"] = state.apiKeyGroq;
    return headers;
}
