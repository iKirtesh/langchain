/**
 * RAG Module
 */
import { state, getHeaders } from "./config.js";
import { appendMessage, updateMessage, showAlert } from "./ui.js";

export async function handleFileUpload(file) {
    if (!file) return;
    
    // Show spinner in dropzone
    const dropzone = document.getElementById("file-dropzone");
    const originalHTML = dropzone.innerHTML;
    dropzone.innerHTML = `<div class="loading-spinner" style="width: 32px; height: 32px; margin-bottom: 0.5rem;"></div><p>Parsing & Vectorizing...</p><span>Adding chunks to InMemoryVectorStore</span>`;
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("chunk_size", document.getElementById("rag-chunk-size").value);
    formData.append("chunk_overlap", document.getElementById("rag-chunk-overlap").value);
    
    const headers = {};
    if (state.apiKeyGoogle) headers["X-Google-Key"] = state.apiKeyGoogle;
    if (state.apiKeyOpenAI) headers["X-OpenAI-Key"] = state.apiKeyOpenAI;

    try {
        const response = await fetch("/api/rag/upload", {
            method: "POST",
            headers: headers,
            body: formData
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || "Unable to index document.");
        }
        
        showAlert(`Successfully vectorized: ${file.name}`);
        await refreshIndexedDocuments();
        
    } catch (err) {
        showAlert(`RAG Index Error: ${err.message}`);
    } finally {
        dropzone.innerHTML = originalHTML;
    }
}

export async function refreshIndexedDocuments() {
    try {
        const res = await fetch("/api/rag/documents");
        const list = await res.json();
        
        const container = document.getElementById("indexed-files-list");
        const gridContainer = document.getElementById("rag-chunk-grid");

        if (!list || list.length === 0) {
            if (container) container.innerHTML = `<div class="empty-list-state">No documents indexed yet.</div>`;
            if (gridContainer) gridContainer.innerHTML = `<div class="empty-grid-state">No active document vectors.</div>`;
            return;
        }
        
        // 1. Render files list
        if (container) {
            container.innerHTML = "";
            list.forEach(doc => {
                const kbSize = (doc.size_bytes / 1024).toFixed(1);
                const item = document.createElement("div");
                item.className = "file-item";
                item.innerHTML = `
                    <div class="file-name-meta">
                        <h5>${doc.filename}</h5>
                        <span>Size: ${kbSize} KB • ${doc.store_type}</span>
                    </div>
                    <div class="file-chunks-badge">${doc.chunks_count} chunks</div>
                `;
                container.appendChild(item);
            });
        }

        // 2. Render visual Chunk Grid Map
        if (gridContainer) {
            gridContainer.innerHTML = "";
            let totalChunks = 0;
            list.forEach(doc => {
                totalChunks += doc.chunks_count;
            });

            for (let i = 0; i < totalChunks; i++) {
                const block = document.createElement("div");
                block.className = "chunk-block";
                block.textContent = i + 1;
                block.setAttribute("data-chunk-idx", i);
                block.title = `Document Chunk #${i} - Status: Stored in InMemoryVectorStore`;
                block.addEventListener("click", () => {
                    showAlert(`Document Chunk #${i} selected. Ask a search query to trace its relevance.`);
                });
                gridContainer.appendChild(block);
            }
        }
    } catch (err) {
        console.error("Unable to pull loaded docs", err);
    }
}

export async function handleRAGSend() {
    const input = document.getElementById("rag-input");
    const text = input.value.trim();
    if (!text) return;
    
    input.value = "";
    appendMessage("user", text, "rag-messages-container");
    
    const botId = appendMessage("rag", `<div class="loading-spinner"></div> Searching store and answering...`, "rag-messages-container", true);
    
    // Clear previous matched states
    document.querySelectorAll(".chunk-block").forEach(block => {
        block.classList.remove("matched");
        block.title = `Document Chunk #${block.getAttribute("data-chunk-idx")}`;
    });

    try {
        const response = await fetch("/api/rag/query", {
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
            throw new Error(data.detail || "Error querying RAG context.");
        }
        
        // Assemble final output formatting source document tags
        let fullAnswer = data.answer;
        
        if (data.sources && data.sources.length > 0) {
            fullAnswer += `\n\n<div class="source-container"><div class="source-title">Retrieved Reference Chunks:</div><div class="source-badges">`;
            data.sources.forEach(src => {
                const escapedContent = src.content.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                fullAnswer += `<span class="source-badge" title="${escapedContent}" onclick="alert('----- Chunk Content (Source: ${src.source}, Chunk #${src.chunk}, Match: ${src.score}%) -----\\n\\n${escapedContent}')">📄 ${src.source} [C#${src.chunk}] (${src.score}%)</span>`;
                
                // Highlight corresponding block in visual grid
                const block = document.querySelector(`.chunk-block[data-chunk-idx="${src.chunk}"]`);
                if (block) {
                    block.classList.add("matched");
                    block.title = `Retrieval Match! Relevance Score: ${src.score}%`;
                }
            });
            fullAnswer += `</div></div>`;
        }
        
        updateMessage(botId, fullAnswer, true);
        
    } catch (err) {
        updateMessage(botId, `<span style="color: var(--accent-coral)">Error: ${err.message}</span>`);
    }
}
