/**
 * Prompt Chains Module
 */
import { state, getHeaders } from "./config.js";

export async function handleChainRun() {
    const runBtn = document.getElementById("run-chain-btn");
    const originalText = runBtn.textContent;
    runBtn.textContent = "Processing Chain Nodes...";
    runBtn.disabled = true;
    
    const genre = document.getElementById("prompt-var-genre").value;
    const template1 = document.getElementById("prompt-template-1").value;
    const template2 = document.getElementById("prompt-template-2").value;
    
    // Set loading indicator in Visual Nodes
    document.getElementById("node-1-rendered").textContent = template1.replace("{genre}", genre);
    document.getElementById("node-1-output").innerHTML = `<div class="loading-spinner"></div> Generating character name...`;
    
    document.getElementById("node-2-rendered").textContent = template2.replace("{character_name}", "[Generating Protagonist...]");
    document.getElementById("node-2-output").innerHTML = `<div class="loading-spinner"></div> Waiting for Node 1 to resolve...`;
    
    try {
        const response = await fetch("/api/prompt/run", {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                provider: state.activeProvider,
                model: state.activeModel,
                temperature: state.activeTemperature,
                template1: template1,
                template2: template2,
                variables: { genre: genre }
            })
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || "Error running Prompt sequential chain.");
        }
        
        // Update Node 1 Output
        document.getElementById("node-1-output").textContent = data.chain1.output.trim();
        
        // Update Node 2 Rendered Prompt with the actual protagonist name
        document.getElementById("node-2-rendered").textContent = data.chain2.prompt_rendered;
        
        // Update Node 2 final story summary
        document.getElementById("node-2-output").textContent = data.chain2.output;
        
    } catch (err) {
        document.getElementById("node-1-output").innerHTML = `<span style="color: var(--accent-coral)">Chain Failed: ${err.message}</span>`;
        document.getElementById("node-2-output").innerHTML = `<span style="color: var(--accent-coral)">Chain terminated prematurely.</span>`;
    } finally {
        runBtn.textContent = originalText;
        runBtn.disabled = false;
    }
}
