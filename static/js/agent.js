/**
 * Agent Module
 */
import { state, getHeaders } from "./config.js";

export async function handleAgentRun() {
    const input = document.getElementById("agent-query-input");
    const text = input.value.trim();
    if (!text) return;
    
    const terminal = document.getElementById("agent-terminal-logs");
    terminal.innerHTML = `
        <div class="terminal-line system-line">> Launching Agent execution...</div>
        <div class="terminal-line system-line">> Provider: ${state.activeProvider.toUpperCase()} | Model: ${state.activeModel}</div>
        <div class="terminal-line system-line">> Evaluating input: "${text}"</div>
        <div class="terminal-line system-line">> Initializing reasoning chains and bindings...</div>
        <div class="terminal-line thought-line">> THOUGHT: User has requested complex computation or multi-source retrieval. I should audit my tool suite (Math calculator, Science lookup, Web search) to construct a strategic execution path...</div>
        <div class="terminal-line system-line"><div class="loading-spinner"></div> running agent thought patterns...</div>
    `;
    terminal.scrollTop = terminal.scrollHeight;
    
    try {
        const response = await fetch("/api/agent/run", {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                query: text,
                provider: state.activeProvider,
                model: state.activeModel,
                temperature: state.activeTemperature
            })
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || "Unable to solve query with Agent.");
        }
        
        // Render step by step
        terminal.innerHTML = `<div class="terminal-line system-line">> Launching Agent execution...</div>`;
        
        if (data.steps && data.steps.length > 0) {
            data.steps.forEach((step, idx) => {
                terminal.innerHTML += `
                    <div class="terminal-line system-line" style="margin-top: 1rem;">[Step ${idx + 1}] Analyzing parameters...</div>
                    <div class="terminal-line thought-line">Thought Action: Calling tool "${step.tool}" with arguments: ${JSON.stringify(step.tool_input)}</div>
                    <div class="terminal-line tool-line">⚡ Tool [${step.tool}] Response: ${step.output}</div>
                `;
            });
        } else {
            terminal.innerHTML += `
                <div class="terminal-line thought-line">Thought: No active tools are necessary to answer this query. I will formulate a direct synthesis from my neural parameters.</div>
            `;
        }
        
        terminal.innerHTML += `
            <div class="terminal-line system-line" style="margin-top: 1rem;">> Final response compiled. Outputting result:</div>
            <div class="terminal-line answer-line">🏆 AGENT ANSWER:\n${data.output}</div>
        `;
        
    } catch (err) {
        terminal.innerHTML += `
            <div class="terminal-line system-line" style="margin-top: 1rem; color: var(--accent-coral)">> CRITICAL EXECUTION FAILED: ${err.message}</div>
        `;
    } finally {
        terminal.scrollTop = terminal.scrollHeight;
    }
}
