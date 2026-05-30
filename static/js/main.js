/**
 * LangChain Showcase Frontend Application
 * ES6 Module Entry Point
 */

import { state, PROVIDER_MODELS } from "./config.js";
import { handleChatSend } from "./chat.js";
import { handleFileUpload, refreshIndexedDocuments, handleRAGSend } from "./rag.js";
import { handleAgentRun } from "./agent.js";
import { handleChainRun } from "./prompt.js";
import { handleMemoryRun } from "./memory.js";
import { initExtractionModule } from "./extraction.js";

// ==========================================================================
// Initialization
// ==========================================================================
function startApp() {
    try {
        console.log("Initializing LangChain Complete Showcase...");
        initUI();
        setupEventListeners();
        updateModelDropdown();
        loadKeysFromStorage();
        refreshIndexedDocuments();
        initExtractionModule();
        console.log("Initialization complete!");
    } catch (e) {
        console.error("Initialization failed:", e);
        if (typeof window.onerror === "function") {
            window.onerror(e.message, "js/main.js", 0, 0, e);
        }
    }
}

if (document.readyState === "complete") {
    startApp();
} else {
    window.addEventListener("load", startApp);
}

// Initialize UI elements
function initUI() {
    // Collapsible keys
    const toggle = document.getElementById("keys-toggle");
    const content = document.getElementById("keys-content");
    if (toggle && content) {
        toggle.addEventListener("click", () => {
            content.classList.toggle("collapsed");
            toggle.classList.toggle("collapsed");
        });
    }
}

// Storing keys in LocalStorage safely for convenient local refresh
function loadKeysFromStorage() {
    const keys = ["key-google", "key-openai", "key-groq"];
    keys.forEach(id => {
        const saved = localStorage.getItem(id);
        if (saved) {
            const input = document.getElementById(id);
            if (input) input.value = saved;
            // Map to state
            if (id === "key-google") state.apiKeyGoogle = saved;
            if (id === "key-openai") state.apiKeyOpenAI = saved;
            if (id === "key-groq") state.apiKeyGroq = saved;
        }
    });
}

// ==========================================================================
// Event Listeners
// ==========================================================================
function setupEventListeners() {
    // 1. Sidebar Tab switching
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const tabId = item.getAttribute("data-tab");
            switchTab(tabId);
            
            // Highlight active navigation item
            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");
        });
    });

    // 2. Provider changes
    const providerSelect = document.getElementById("global-provider");
    if (providerSelect) {
        providerSelect.addEventListener("change", (e) => {
            state.activeProvider = e.target.value;
            updateModelDropdown();
        });
    }

    // 3. Model selector changes
    const modelSelect = document.getElementById("global-model");
    if (modelSelect) {
        modelSelect.addEventListener("change", (e) => {
            state.activeModel = e.target.value;
        });
    }

    // 4. Temperature Slider
    const tempSlider = document.getElementById("global-temp");
    const tempVal = document.getElementById("temp-val");
    if (tempSlider && tempVal) {
        tempSlider.addEventListener("input", (e) => {
            state.activeTemperature = parseFloat(e.target.value);
            tempVal.textContent = state.activeTemperature;
        });
    }

    // 5. API Key Inputs
    ["key-google", "key-openai", "key-groq"].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            // Save on input change
            input.addEventListener("input", (e) => {
                const value = e.target.value.trim();
                localStorage.setItem(id, value);
                if (id === "key-google") state.apiKeyGoogle = value;
                if (id === "key-openai") state.apiKeyOpenAI = value;
                if (id === "key-groq") state.apiKeyGroq = value;
            });

            // Submit on Enter keypress (collapse and blur)
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    collapseApiKeys();
                    input.blur();
                }
            });

            // Submit/Close when focus is lost after typing (change event)
            input.addEventListener("change", () => {
                if (input.value.trim()) {
                    setTimeout(collapseApiKeys, 300);
                }
            });
        }
    });

    // --- Tab 1: Chat Playground ---
    const chatInput = document.getElementById("chat-input");
    const chatSendBtn = document.getElementById("send-chat-btn");
    const clearChatBtn = document.getElementById("clear-chat-btn");

    if (chatSendBtn) chatSendBtn.addEventListener("click", handleChatSend);
    if (chatInput) {
        chatInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleChatSend();
            }
        });
    }

    if (clearChatBtn) {
        clearChatBtn.addEventListener("click", () => {
            state.chatHistory = [];
            const container = document.getElementById("chat-messages-container");
            if (container) {
                container.innerHTML = `
                    <div class="message system-msg">
                        <div class="avatar">SYS</div>
                        <div class="msg-bubble">Chat history cleared. System prompt and model contexts reset.</div>
                    </div>
                `;
            }
        });
    }

    // --- Tab 2: RAG Doc indexer ---
    const dropzone = document.getElementById("file-dropzone");
    const fileInput = document.getElementById("file-input");
    const ragInput = document.getElementById("rag-input");
    const ragSendBtn = document.getElementById("send-rag-btn");

    if (dropzone && fileInput) {
        dropzone.addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", () => handleFileUpload(fileInput.files[0]));

        // Drag-and-drop mechanics
        ["dragenter", "dragover"].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzone.classList.add("dragover");
            }, false);
        });
        ["dragleave", "drop"].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzone.classList.remove("dragover");
            }, false);
        });
        dropzone.addEventListener("drop", (e) => {
            const dt = e.dataTransfer;
            const file = dt.files[0];
            handleFileUpload(file);
        });
    }

    if (ragSendBtn) ragSendBtn.addEventListener("click", handleRAGSend);
    if (ragInput) {
        ragInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleRAGSend();
            }
        });
    }

    // --- Tab 3: Agent Core Console ---
    const runAgentBtn = document.getElementById("run-agent-btn");
    const agentInput = document.getElementById("agent-query-input");
    
    if (runAgentBtn) runAgentBtn.addEventListener("click", handleAgentRun);
    
    // Wire presets
    const presets = document.querySelectorAll(".presets-container .preset-btn");
    presets.forEach(p => {
        p.addEventListener("click", () => {
            const query = p.getAttribute("data-query");
            if (agentInput) {
                agentInput.value = query;
                handleAgentRun();
            }
        });
    });

    // --- Tab 4: Prompt Playground Chains ---
    const runChainBtn = document.getElementById("run-chain-btn");
    if (runChainBtn) runChainBtn.addEventListener("click", handleChainRun);

    // --- Tab 5: Memory Module Simulation ---
    const runMemoryBtn = document.getElementById("run-memory-btn");
    if (runMemoryBtn) runMemoryBtn.addEventListener("click", handleMemoryRun);
}

// Helper to collapse the API keys section
function collapseApiKeys() {
    const toggle = document.getElementById("keys-toggle");
    const content = document.getElementById("keys-content");
    if (toggle && content) {
        toggle.classList.add("collapsed");
        content.classList.add("collapsed");
    }
}

// Dynamic tab switching logic
function switchTab(tabId) {
    const panels = document.querySelectorAll(".tab-panel");
    panels.forEach(panel => {
        if (panel.id !== tabId) {
            panel.classList.remove("active");
            setTimeout(() => {
                if (!panel.classList.contains("active")) {
                    panel.style.display = "none";
                }
            }, 150);
        }
    });
    
    const targetPanel = document.getElementById(tabId);
    if (targetPanel) {
        targetPanel.style.display = "block";
        setTimeout(() => {
            targetPanel.classList.add("active");
        }, 20);
    }
}

// Populating models based on current active API provider
function updateModelDropdown() {
    const modelSelect = document.getElementById("global-model");
    if (modelSelect) {
        modelSelect.innerHTML = "";
        
        const models = PROVIDER_MODELS[state.activeProvider] || [];
        models.forEach((model, index) => {
            const opt = document.createElement("option");
            opt.value = model.value;
            opt.textContent = model.label;
            if (model.value === state.activeModel || (index === 0 && !state.activeModel)) {
                opt.selected = true;
            }
            modelSelect.appendChild(opt);
        });
        
        if (models.length > 0) {
            const hasActiveModel = models.some(m => m.value === state.activeModel);
            if (!hasActiveModel) {
                state.activeModel = models[0].value;
            }
            modelSelect.value = state.activeModel;
        } else {
            state.activeModel = "";
        }
    }
}
