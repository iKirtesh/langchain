/**
 * Memory Module
 */
import { state, getHeaders } from "./config.js";

export async function handleMemoryRun() {
    const runBtn = document.getElementById("run-memory-btn");
    const originalText = runBtn.textContent;
    runBtn.textContent = "Simulating turns...";
    runBtn.disabled = true;
    
    const turn1 = document.getElementById("turn-1").value.trim();
    const turn2 = document.getElementById("turn-2").value.trim();
    const turn3 = document.getElementById("turn-3").value.trim();
    
    const bufferView = document.getElementById("buffer-memory-view");
    const summaryView = document.getElementById("summary-memory-view");
    
    bufferView.innerHTML = `<div class="loading-spinner"></div> compounding chat records...`;
    summaryView.innerHTML = `<div class="loading-spinner"></div> running background summarizer...`;
    
    try {
        const response = await fetch("/api/memory/run", {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                provider: state.activeProvider,
                model: state.activeModel,
                temperature: state.activeTemperature,
                turns: [
                    { user: turn1 },
                    { user: turn2 },
                    { user: turn3 }
                ]
            })
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || "Error simulating conversational memories.");
        }
        
        // Render Buffer Memory turns (Final state)
        const finalTurn = data.turns[2]; // Inspect final state at third turn
        
        let bufferHTML = `<div class="memory-history-block">`;
        finalTurn.buffer_memory_context.forEach(msg => {
            const roleName = msg.role === "user" ? "Human" : "AI";
            bufferHTML += `
                <div class="history-turn">
                    <div class="history-turn-header">${roleName}:</div>
                    <div class="history-turn-body">${msg.content}</div>
                </div>
            `;
        });
        bufferHTML += `</div>`;
        bufferView.innerHTML = bufferHTML;
        
        // Render Summary Memory turns (Final state)
        let summaryHTML = `<div class="memory-history-block">`;
        const lines = finalTurn.summary_memory_context.split("\n");
        lines.forEach(line => {
            if (line.startsWith("System Summary:")) {
                summaryHTML += `
                    <div class="summary-text-block">
                        <strong>📌 running LLM summary digests:</strong><br>
                        ${line.replace("System Summary:", "").trim()}
                    </div>
                `;
            } else {
                const parts = line.split(":");
                const speaker = parts[0];
                const content = parts.slice(1).join(":");
                summaryHTML += `
                    <div class="history-turn">
                        <div class="history-turn-header" style="color: var(--secondary-color)">${speaker}:</div>
                        <div class="history-turn-body">${content}</div>
                    </div>
                `;
            }
        });
        summaryHTML += `</div>`;
        summaryView.innerHTML = summaryHTML;
        
    } catch (err) {
        bufferView.innerHTML = `<span style="color: var(--accent-coral)">Simulation failed: ${err.message}</span>`;
        summaryView.innerHTML = `<span style="color: var(--accent-coral)">Simulation failed.</span>`;
    } finally {
        runBtn.textContent = originalText;
        runBtn.disabled = false;
    }
}
