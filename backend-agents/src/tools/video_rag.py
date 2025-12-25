import os
import httpx
from typing import Optional, List, Dict, Any

class VideoRAGTool:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("RAGIE_API_KEY")
        self.base_url = "https://api.ragie.ai" # Hypothetical URL, need to confirm
        if not self.api_key:
            print("Warning: RAGIE_API_KEY not set")

    async def ingest_file(self, file_path: str, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """Ingests a file into Ragie."""
        if not self.api_key:
            return {"error": "RAGIE_API_KEY not configured"}
            
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                # Content-Type is auto-set by httpx for multipart
            }
            
            with open(file_path, "rb") as f:
                files = {"file": (os.path.basename(file_path), f)}
                data = {"mode": "fast"}
                if metadata:
                    import json
                    data["metadata"] = json.dumps(metadata)
                
                response = await client.post(
                    f"{self.base_url}/documents",
                    headers=headers,
                    data=data,
                    files=files
                )
                
            if response.status_code >= 400:
                print(f"Ingest Error: {response.text}")
                return {"error": response.text}
            return response.json()

    async def retrieve(self, query: str) -> str:
        """Retrieves relevant segments."""
        if not self.api_key:
            return "Error: RAGIE_API_KEY not configured"

        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            # Updated based on user guide
            response = await client.post(
                f"{self.base_url}/retrievals",
                headers=headers,
                json={
                    "query": query,
                    "rerank": True,
                    # "filter": {"scope": "tutorial"} # Optional
                }
            )
            if response.status_code >= 400:
                return f"Error retrieving data: {response.text}"
            
            data = response.json()
            results = data.get("scored_chunks", []) or data.get("results", [])
            
            segments = []
            for item in results:
                content = item.get("data", {}).get("chunk", "") or item.get("content", "")
                score = item.get("score", 0)
                segments.append(f"- (Score: {score:.2f}) {content}")
            
            return "\n".join(segments) if segments else "No relevant information found."


from strands import tool

# Standalone function for Strands/MCP to call
@tool
async def video_query(query: str) -> str:
    """Queries the video knowledge base."""
    tool = VideoRAGTool()
    return await tool.retrieve(query)
