import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Strands Imports
from strands import Agent
from strands.models.gemini import GeminiModel
# from strands_agents_tools.tools import CalculatorTool # Example built-in
from strands import tool
import shutil
from fastapi import UploadFile, File
from src.tools.video_rag import video_query, VideoRAGTool # Our custom tool

# Load environment variables
load_dotenv()

app = FastAPI(title="AWS Strands Agent Service")

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Agent (Lazy loading or global)
# Note: In a real app, you might want per-request agents or a pool
def get_video_agent():
    # Configure the agent
    # We need to make sure our tool function is properly typed and documented for the LLM
    
    # The `video_query` tool needs to be wrapped for the Agent if it's not already a Tool instance
    # Assuming video_query is a function, we need to make it a Tool.
    # For simplicity, let's assume `video_rag_tool` is a pre-defined Tool instance or `video_query` itself is a Tool.
    # If `video_query` is a function, it should be passed as `tools=[video_query]` and Strands will wrap it.
    # The instruction uses `video_rag_tool`, which implies a specific Tool instance.
    # Let's assume `video_rag_tool` is meant to be `video_query` from the import.
    video_rag_tool = video_query # Aligning with the instruction's variable name
    
    model = GeminiModel(
        model_id="gemini-2.0-flash",
        # api_key is read from GOOGLE_API_KEY env var
    )
    
    agent = Agent(
        name="video-knowledge-agent",
        model=model,  # Using Google Gemini Object
        system_prompt="You are a helpful video assistant. You can answer questions about videos using the Video RAG tool.",
        tools=[video_rag_tool],
    )
    return agent

agent = get_video_agent()

class ChatRequest(BaseModel):
    message: str

@app.get("/")
async def root():
    return {
        "service": "backend-agents",
        "status": "running",
        "framework": "AWS Strands",
        "agent": "VideoKnowledgeAgent"
    }

@app.post("/ingest")
async def ingest_endpoint(file: UploadFile = File(...)):
    try:
        # Save uploaded file temporarily
        temp_file_path = f"temp_{file.filename}"
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Ingest using VideoRAGTool
        tool = VideoRAGTool()
        result = await tool.ingest_file(temp_file_path, metadata={"filename": file.filename})
        
        # Cleanup
        os.remove(temp_file_path)
        
        if "error" in result:
             raise HTTPException(status_code=500, detail=result["error"])
             
        return {"status": "success", "data": result}
    except Exception as e:
        print(f"Ingest Error: {e}")
        # Cleanup if error occurs during processing
        if os.path.exists(f"temp_{file.filename}"):
             os.remove(f"temp_{file.filename}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        # Strands agent execution
        # Using invoke_async() as verified
        response = await agent.invoke_async(request.message) 
        return {"response": str(response)}
    except Exception as e:
        # Log error in production
        print(f"Agent Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok", "agent": agent.name}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    # Reload=True is good for dev, but might restart on agent init if not careful
    uvicorn.run("src.main:app", host="0.0.0.0", port=port, reload=True)

