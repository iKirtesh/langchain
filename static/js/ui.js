/**
 * UI Utilities Module
 */

// Throw custom warning popup if backend reports failure
export function showAlert(message) {
    // Clear existing alert
    const existing = document.querySelector(".modal-alert");
    if (existing) existing.remove();

    const div = document.createElement("div");
    div.className = "modal-alert";
    div.textContent = message;
    document.body.appendChild(div);

    setTimeout(() => {
        div.style.opacity = "0";
        setTimeout(() => div.remove(), 500);
    }, 4500);
}

// Bubble generators
let msgCounter = 0;
export function appendMessage(role, content, containerId, isRawHtml = false) {
    const container = document.getElementById(containerId);
    const msgId = `msg-${msgCounter++}`;
    
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${role}-msg`;
    messageDiv.id = msgId;

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = role === "user" ? "ME" : role === "system" ? "SYS" : role.toUpperCase().substring(0, 3);

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    if (isRawHtml) {
        bubble.innerHTML = content;
    } else {
        // Basic markup parser for spacing
        bubble.textContent = content;
        bubble.innerHTML = bubble.innerHTML.replace(/\n/g, "<br>");
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(bubble);
    container.appendChild(messageDiv);
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
    
    return msgId;
}

export function updateMessage(msgId, content, isRawHtml = false) {
    const bubble = document.querySelector(`#${msgId} .msg-bubble`);
    if (bubble) {
        if (isRawHtml) {
            bubble.innerHTML = content;
        } else {
            bubble.textContent = content;
            bubble.innerHTML = bubble.innerHTML.replace(/\n/g, "<br>");
        }
        
        // Scroll target container to bottom
        const container = bubble.closest(".chat-messages") || bubble.closest(".rag-chat-messages");
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
}
