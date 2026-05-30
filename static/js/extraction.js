/**
 * Structured Data Extraction Module
 * Showcases LangChain Pydantic Parser integrations
 */
import { state, getHeaders } from "./config.js";
import { showAlert } from "./ui.js";

// Sample Presets
const PRESETS = {
    receipt: `Target Store #1402. Date: 2026-05-12.
1x Wireless Bluetooth Speaker: $45.99
2x Organic Coffee Beans 12oz: $12.50 each ($25.00 total)
3x AA Duracell Batteries pack: $8.99 each ($26.97 total)
Total Tax: $5.23
Overall Total Charged to Visa ending in 4021: $103.19`,

    contact: `Hey Arthur! Here is my info: My full name is Ford Prefect. I am currently working as a Senior Travel Writer at Megadodo Publications. You can email me at ford@megadodo.galactic or ring my mobile at +44-7911-123456. Let's grab a cup of tea sometime!`,

    calendar: `Meeting Schedule for next Monday:
1. Project Kickoff: From 09:00 AM to 10:30 AM at Main Boardroom. Agenda: Align with stakeholders.
2. Engineering Alignment: From 11:30 AM to 01:00 PM over Zoom link: https://zoom.us/j/9991. Review frontend PR and refactorings.
3. Lunch and Networking: From 01:00 PM to 02:30 PM at the Cafeteria.`
};

let lastExtractedData = null;
let lastExtractedSchema = "";

export function initExtractionModule() {
    // 1. Preset buttons
    const btnReceipt = document.getElementById("preset-extract-receipt");
    const btnContact = document.getElementById("preset-extract-contact");
    const btnCalendar = document.getElementById("preset-extract-calendar");
    const inputArea = document.getElementById("extract-input");
    const schemaSelector = document.getElementById("extract-schema");

    if (btnReceipt && inputArea && schemaSelector) {
        btnReceipt.addEventListener("click", () => {
            inputArea.value = PRESETS.receipt;
            schemaSelector.value = "receipt";
        });
    }
    if (btnContact && inputArea && schemaSelector) {
        btnContact.addEventListener("click", () => {
            inputArea.value = PRESETS.contact;
            schemaSelector.value = "contact";
        });
    }
    if (btnCalendar && inputArea && schemaSelector) {
        btnCalendar.addEventListener("click", () => {
            inputArea.value = PRESETS.calendar;
            schemaSelector.value = "calendar";
        });
    }

    // 2. Submit Button
    const runBtn = document.getElementById("run-extract-btn");
    if (runBtn) {
        runBtn.addEventListener("click", handleExtraction);
    }

    // 3. Download Buttons
    const downloadJsonBtn = document.getElementById("btn-download-json");
    const downloadCsvBtn = document.getElementById("btn-download-csv");

    if (downloadJsonBtn) downloadJsonBtn.addEventListener("click", downloadJSON);
    if (downloadCsvBtn) downloadCsvBtn.addEventListener("click", downloadCSV);
}

async function handleExtraction() {
    const input = document.getElementById("extract-input");
    const schemaType = document.getElementById("extract-schema").value;
    const resultsView = document.getElementById("extraction-results-view");
    const actionContainer = document.getElementById("extract-actions");
    const runBtn = document.getElementById("run-extract-btn");

    const text = input.value.trim();
    if (!text) {
        showAlert("Please paste some text to extract.");
        return;
    }

    // Load indicators
    const originalText = runBtn.textContent;
    runBtn.textContent = "Extracting Structuring...";
    runBtn.disabled = true;
    actionContainer.style.display = "none";

    resultsView.innerHTML = `
        <div class="loading-state" style="text-align: center; padding: 4rem 1rem;">
            <div class="loading-spinner" style="width: 32px; height: 32px; margin-bottom: 1rem;"></div>
            <p>Running LangChain with_structured_output()...</p>
            <span>Analyzing text and compiling Pydantic model schemas</span>
        </div>
    `;

    try {
        const response = await fetch("/api/extraction/run", {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                text: text,
                schema_type: schemaType,
                provider: state.activeProvider,
                model: state.activeModel,
                temperature: state.activeTemperature
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || "Structured extraction failed.");
        }

        lastExtractedData = data.data;
        lastExtractedSchema = schemaType;

        // Render elegant custom table outputs
        renderExtraction(lastExtractedSchema, lastExtractedData, resultsView);
        actionContainer.style.display = "flex";

    } catch (err) {
        resultsView.innerHTML = `
            <div class="error-state" style="color: var(--accent-coral); padding: 3rem 1rem; text-align: center;">
                <h4>⚠️ Extraction Process Terminated</h4>
                <p style="margin-top: 0.5rem; font-size: 0.85rem;">${err.message}</p>
            </div>
        `;
    } finally {
        runBtn.textContent = originalText;
        runBtn.disabled = false;
    }
}

function renderExtraction(schemaType, data, container) {
    container.innerHTML = "";
    
    let html = "";
    
    if (schemaType === "receipt") {
        html += `
            <div class="extract-table-wrapper">
                <table class="extract-table">
                    <thead>
                        <tr>
                            <th>Merchant</th>
                            <th>Date</th>
                            <th>Total Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>${data.merchant || "Unknown"}</strong></td>
                            <td>${data.date || "Unknown"}</td>
                            <td><strong style="color: var(--accent-green)">$${(data.total_amount || 0.00).toFixed(2)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

        if (data.items && data.items.length > 0) {
            html += `
                <h4 style="margin-top: 1.5rem; margin-bottom: 0.5rem; color: #a5b4fc;">Line Items</h4>
                <div class="extract-table-wrapper">
                    <table class="extract-table">
                        <thead>
                            <tr>
                                <th>Item Description</th>
                                <th style="text-align: right;">Unit Price</th>
                                <th style="text-align: center;">Qty</th>
                                <th style="text-align: right;">Total Price</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            data.items.forEach(item => {
                const total = (item.price || 0) * (item.quantity || 0);
                html += `
                    <tr>
                        <td>${item.item_name}</td>
                        <td style="text-align: right;">$${(item.price || 0).toFixed(2)}</td>
                        <td style="text-align: center;">${item.quantity || 1}</td>
                        <td style="text-align: right; color: var(--accent-cyan); font-weight: 600;">$${total.toFixed(2)}</td>
                    </tr>
                `;
            });
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }
    } else if (schemaType === "contact") {
        html += `
            <div class="extract-table-wrapper">
                <table class="extract-table">
                    <thead>
                        <tr>
                            <th>Attribute</th>
                            <th>Extracted Contact Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Full Name</strong></td>
                            <td><strong style="color: #fff">${data.full_name || "Unknown"}</strong></td>
                        </tr>
                        <tr>
                            <td><strong>Email Address</strong></td>
                            <td>${data.email ? `<a href="mailto:${data.email}" style="color: var(--accent-cyan)">${data.email}</a>` : "Not specified"}</td>
                        </tr>
                        <tr>
                            <td><strong>Phone Number</strong></td>
                            <td>${data.phone || "Not specified"}</td>
                        </tr>
                        <tr>
                            <td><strong>Company / Organisation</strong></td>
                            <td>${data.company || "Not specified"}</td>
                        </tr>
                        <tr>
                            <td><strong>Job Position</strong></td>
                            <td><span class="file-chunks-badge" style="background: rgba(168, 85, 247, 0.15); border-color: rgba(168, 85, 247, 0.3); color: #d8b4fe;">${data.job_title || "Not specified"}</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    } else if (schemaType === "calendar") {
        if (data.events && data.events.length > 0) {
            html += `
                <div class="extract-table-wrapper">
                    <table class="extract-table">
                        <thead>
                            <tr>
                                <th>Schedule Topic</th>
                                <th>Date</th>
                                <th>Time Window</th>
                                <th>Location</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            data.events.forEach(evt => {
                html += `
                    <tr>
                        <td><strong>${evt.title}</strong></td>
                        <td>${evt.date || "Unknown"}</td>
                        <td><span style="color: var(--secondary-color)">${evt.start_time} - ${evt.end_time}</span></td>
                        <td><span style="color: var(--accent-cyan)">📍 ${evt.location || "N/A"}</span></td>
                        <td style="font-size: 0.8rem; color: var(--text-muted); max-width: 250px;">${evt.description || "-"}</td>
                    </tr>
                `;
            });
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            html += `<div class="empty-list-state">No structured calendar events could be parsed.</div>`;
        }
    }

    // Add raw code block inspector
    html += `
        <div class="raw-json-card">
            <h4>Raw Pydantic JSON Output</h4>
            <pre><code>${JSON.stringify(data, null, 4)}</code></pre>
        </div>
    `;

    container.innerHTML = html;
}

// ---------------------------------------------------------------------------
// 3. Dynamic Export Functions
// ---------------------------------------------------------------------------
function downloadJSON() {
    if (!lastExtractedData) return;
    const blob = new Blob([JSON.stringify(lastExtractedData, null, 4)], { type: "application/json" });
    triggerDownload(blob, `extracted_${lastExtractedSchema}_dataset.json`);
}

function downloadCSV() {
    if (!lastExtractedData) return;
    
    let csv = "";
    
    if (lastExtractedSchema === "receipt") {
        csv += "Merchant,Date,Total Amount\n";
        csv += `"${lastExtractedData.merchant || ""}","${lastExtractedData.date || ""}",${lastExtractedData.total_amount || 0}\n\n`;
        
        if (lastExtractedData.items && lastExtractedData.items.length > 0) {
            csv += "Item Name,Unit Price,Quantity,Total Price\n";
            lastExtractedData.items.forEach(item => {
                const total = (item.price || 0) * (item.quantity || 0);
                csv += `"${item.item_name || ""}",${item.price || 0},${item.quantity || 1},${total}\n`;
            });
        }
    } else if (lastExtractedSchema === "contact") {
        csv += "Attribute,Value\n";
        csv += `Full Name,"${lastExtractedData.full_name || ""}"\n`;
        csv += `Email,"${lastExtractedData.email || ""}"\n`;
        csv += `Phone,"${lastExtractedData.phone || ""}"\n`;
        csv += `Company,"${lastExtractedData.company || ""}"\n`;
        csv += `Job Title,"${lastExtractedData.job_title || ""}"\n`;
    } else if (lastExtractedSchema === "calendar") {
        csv += "Event Title,Date,Start Time,End Time,Location,Description\n";
        if (lastExtractedData.events && lastExtractedData.events.length > 0) {
            lastExtractedData.events.forEach(evt => {
                csv += `"${evt.title || ""}","${evt.date || ""}","${evt.start_time || ""}","${evt.end_time || ""}","${evt.location || ""}","${evt.description || ""}"\n`;
            });
        }
    }

    const blob = new Blob([csv], { type: "text/csv" });
    triggerDownload(blob, `extracted_${lastExtractedSchema}_dataset.csv`);
}

function triggerDownload(blob, filename) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    }, 100);
}
