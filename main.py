import os
import uvicorn
from fastapi.staticfiles import StaticFiles
from app.main import app

# Get the path to static directory
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir, exist_ok=True)

# Mount the static directory to serve index.html, styles.css, app.js
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

def main():
    print("Launching LangChain Complete Showcase Application...")
    print("URL: http://127.0.0.1:8000")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

if __name__ == "__main__":
    main()
