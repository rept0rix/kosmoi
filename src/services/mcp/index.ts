import { mcpServer } from "./MCPServer";
import { WebsiteHealthTool } from "./tools/WebsiteHealthTool";
import { SocialPulseTool } from "./tools/SocialPulseTool";
import { KnowledgeBaseTool } from "./tools/KnowledgeBaseTool";

// Initialize and Register Tools
mcpServer.registerTool(new WebsiteHealthTool());
mcpServer.registerTool(new SocialPulseTool());
mcpServer.registerTool(new KnowledgeBaseTool());

export { mcpServer };
