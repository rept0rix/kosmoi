import { mcpServer } from "./MCPServer";
import { WebsiteHealthTool } from "./tools/WebsiteHealthTool";
import { SocialPulseTool } from "./tools/SocialPulseTool";

// Initialize and Register Tools
mcpServer.registerTool(new WebsiteHealthTool());
mcpServer.registerTool(new SocialPulseTool());

export { mcpServer };
