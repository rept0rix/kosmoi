from src.main import get_video_agent
import asyncio

async def main():
    print("Initializing Agent...")
    try:
        agent = get_video_agent()
        print(f"Agent '{agent.name}' initialized with model '{agent.model}'.")
        
        print(f"Agent attributes: {dir(agent)}")
        # Using invoke_async based on Inspection
        response = await agent.invoke_async("Hello from the verification script! Who are you?")
        print(f"Response: {response}")
        print("VERIFICATION SUCCESSFUL")
    except Exception as e:
        print(f"VERIFICATION FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(main())
