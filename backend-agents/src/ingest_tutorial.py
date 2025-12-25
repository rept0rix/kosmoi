
import asyncio
from tools.video_rag import VideoRAGTool
import os
from dotenv import load_dotenv

load_dotenv()

async def main():
    print("Initializing VideoRAGTool...")
    tool = VideoRAGTool()
    
    # URL from user request
    url = "https://raw.githubusercontent.com/ragieai/ragie-examples/main/data/podcasts/E162-Live-from-Davos-Milei-goes-viral-Adam-Neumanns-headwinds-streamings-broken-model-more.txt"
    filename = "transcript.txt"
    
    # Download file locally
    print(f"Downloading {url}...")
    import httpx
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        with open(filename, "wb") as f:
            f.write(resp.content)
            
    print(f"Ingesting {filename}...")
    result = await tool.ingest_file(filename, metadata={"scope": "tutorial"})
    print("Ingest Result:", result)
    
    # Retrieve check
    print("Testing retrieval...")
    await asyncio.sleep(2) # Give it a moment? Fast mode is usually instant-ish
    answer = await tool.retrieve("what does chamath think about davos?")
    print("Retrieval Answer:", answer)

    # Cleanup
    if os.path.exists(filename):
        os.remove(filename)

if __name__ == "__main__":
    asyncio.run(main())
