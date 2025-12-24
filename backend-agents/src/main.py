import os
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

# Strands Imports
from strands_agents import Agent
from strands_agents_tools.tools import CalculatorTool # Example built-in
from src.tools.video_rag import video_query # Our custom tool

# Load environment variables
load_dotenv()

app = FastAPI(title="AWS Strands Agent Service")

# Initialize Agent (Lazy loading or global)
# Note: In a real app, you might want per-request agents or a pool
def get_video_agent():
    # Configure the agent
    # We need to make sure our tool function is properly typed and documented for the LLM
    tools = [video_query, CalculatorTool()]
    
    agent = Agent(
        name="VideoKnowledgeAgent",
        model="anthropic.claude-3-sonnet-20240229-v1:0", # Example Bedrock model ID
        instructions="""
        You are a helpful video assistant. 
        You can search video content using the `video_query` tool. 
        Always cite the timestamp when answering questions about a video.
        """,
        tools=tools
    )
    return agent

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

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        agent = get_video_agent()
        # Strands agent execution - checking API signature
        # Assuming agent.run() or similar. 
        # API docs suggested "agent.run(input_text)"
        response = await agent.run(request.message) 
        return {"response": response}
    except Exception as e:
        # Log error in production
        print(f"Agent Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    # Reload=True is good for dev, but might restart on agent init if not careful
    uvicorn.run("src.main:app", host="0.0.0.0", port=port, reload=True)

