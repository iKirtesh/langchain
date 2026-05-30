/**
 * Chat Module
 */
import { state, getHeaders } from "./config.js";
import { appendMessage, updateMessage } from "./ui.js";

export async function handleChatSend() {
    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    
    // Add user bubble
    appendMessage("user", text, "chat-messages-container");
    state.chatHistory.push({ role: "user", content: text });

    // Add assistant placeholder spinner
    const assistantMsgId = appendMessage("assistant", `<div class="loading-spinner"></div> Thinking...`, "chat-messages-container", true);

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                provider: state.activeProvider,
                model: state.activeModel,
                temperature: state.activeTemperature,
                system_prompt: document.getElementById("chat-system-prompt").value.trim(),
                messages: state.chatHistory
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || "Unable to retrieve chat response.");
        }

        // Update placeholder with actual content
        updateMessage(assistantMsgId, data.content);
        state.chatHistory.push({ role: "assistant", content: data.content });
        
    } catch (err) {
        updateMessage(assistantMsgId, `<span style="color: var(--accent-coral)">Error: ${err.message}</span>`);
    }
}
