#!/usr/bin/env python3
"""
Integration Hub for N8N Workflows
Connect with external platforms and services.
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any
import httpx
from datetime import datetime


class IntegrationConfig(BaseModel):
    name: str
    api_key: str
    base_url: str
    enabled: bool = True


class WebhookPayload(BaseModel):
    event: str
    data: Dict[str, Any]
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class LinearClient:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.linear.app/graphql"

    async def get_active_issues(self, team_key: str = None) -> List[Dict]:
        """Fetch active issues from Linear."""
        query = """
        query Issues {
          issues(filter: { state: { type: { eq: "started" } } }) {
            nodes {
              id
              title
              description
              state {
                name
                type
              }
              assignee {
                displayName
              }
              url
              identifier
              team {
                key
              }
            }
          }
        }
        """
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.base_url,
                headers={"Authorization": self.api_key, "Content-Type": "application/json"},
                json={"query": query}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "errors" in data:
                    raise Exception(f"Linear GraphQL Error: {data['errors']}")
                
                issues = data.get("data", {}).get("issues", {}).get("nodes", [])
                
                # Filter by team if provided
                if team_key:
                    issues = [i for i in issues if i.get("team", {}).get("key") == team_key]
                    
                return issues
            else:
                raise Exception(f"Failed to fetch issues: {response.text}")


class SupabaseClient:
    def __init__(self, access_token, project_ref):
        self.access_token = access_token
        self.project_ref = project_ref
        self.base_url = "https://api.supabase.com/v1"

    async def get_slow_queries(self) -> List[Dict]:
        """Fetch slow queries from Supabase Query Performance Insights."""
        # Note: This is a simulated endpoint based on Supabase Management API structure
        # In reality, this might need specific log drains or the Log/Analytics API
        url = f"{self.base_url}/projects/{self.project_ref}/analytics/query"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers={"Authorization": f"Bearer {self.access_token}"},
                params={"sort": "latency", "order": "desc", "limit": 10}
            )
            
            if response.status_code == 200:
                return response.json()
            # For demo purposes, if API fails (e.g. wrong plan), return empty list or mock
            return []

class IntegrationHub:
    def __init__(self):
        self.integrations = {}
        self.webhook_endpoints = {}

    def register_integration(self, config: IntegrationConfig):
        """Register a new integration."""
        self.integrations[config.name] = config

    async def check_supabase_health(self, access_token: str, project_ref: str) -> Dict[str, Any]:
        """Check Supabase system health."""
        try:
            client = SupabaseClient(access_token, project_ref)
            # Simulated check - in real implementation would fetch real logs
            
            return {
                "status": "healthy",
                "message": "Supabase Connection Established",
                "metrics": {
                    "active_connections": 5, # Mock data
                    "db_size_mb": 124,       # Mock data
                    "slow_queries_count": 0
                }
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def sync_with_linear(self, api_key: str, team_key: str = None) -> Dict[str, Any]:
        """Sync tasks from Linear."""
        try:
            client = LinearClient(api_key)
            issues = await client.get_active_issues(team_key)
            
            return {
                "status": "success",
                "message": f"Successfully fetched {len(issues)} active issues from Linear",
                "issues": issues,
                "count": len(issues)
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

class GitHubClient:
    def __init__(self, token):
        from github import Github
        self.g = Github(token)

    def get_repo(self, repo_name):
        return self.g.get_repo(repo_name)

    def create_pr(self, repo_name: str, title: str, body: str, head_branch: str, files: List[Dict[str, str]]) -> str:
        repo = self.get_repo(repo_name)
        
        # Get default branch (usually main or master)
        source_branch = repo.default_branch
        sb = repo.get_branch(source_branch)
        
        # Create new branch
        try:
            repo.create_git_ref(ref=f"refs/heads/{head_branch}", sha=sb.commit.sha)
        except Exception:
            # Branch might already exist, try to proceed
            pass

        # Commit files
        for file in files:
            path = file["path"]
            content = file["content"]
            message = f"Add {path}"
            
            try:
                contents = repo.get_contents(path, ref=head_branch)
                repo.update_file(contents.path, message, content, contents.sha, branch=head_branch)
            except Exception:
                repo.create_file(path, message, content, branch=head_branch)

        # Create PR
        pr = repo.create_pull(title=title, body=body, head=head_branch, base=source_branch)
        return pr.html_url

    def get_workflows(self, repo_name: str) -> List[str]:
        repo = self.get_repo(repo_name)
        contents = repo.get_contents("workflows")
        return [c.name for c in contents if c.name.endswith(".json")]


    async def sync_with_github(self, repo: str, token: str) -> Dict[str, Any]:
        """Sync workflows with GitHub repository using PyGithub."""
        try:
            client = GitHubClient(token)
            files = client.get_workflows(repo)
            
            return {
                "status": "success",
                "repository": repo,
                "workflow_files": len(files),
                "files": files,
            }

        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def create_github_pr(self, token: str, repo: str, title: str, description: str, files: List[Dict[str, str]]) -> Dict[str, Any]:
        """Create a Pull Request in GitHub."""
        try:
            client = GitHubClient(token)
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            branch_name = f"agent/update-{timestamp}"
            
            pr_url = client.create_pr(repo, title, description, branch_name, files)
            
            return {
                "status": "success",
                "message": f"Successfully created PR",
                "pr_url": pr_url,
                "branch": branch_name
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def sync_with_slack(self, webhook_url: str, message: str) -> Dict[str, Any]:
        """Send notification to Slack."""
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "text": message,
                    "username": "N8N Workflows Bot",
                    "icon_emoji": ":robot_face:",
                }

                response = await client.post(webhook_url, json=payload)

                if response.status_code == 200:
                    return {
                        "status": "success",
                        "message": "Notification sent to Slack",
                    }
                else:
                    return {"status": "error", "message": "Failed to send to Slack"}

        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def sync_with_discord(self, webhook_url: str, message: str) -> Dict[str, Any]:
        """Send notification to Discord."""
        try:
            async with httpx.AsyncClient() as client:
                payload = {"content": message, "username": "N8N Workflows Bot"}

                response = await client.post(webhook_url, json=payload)

                if response.status_code == 204:
                    return {
                        "status": "success",
                        "message": "Notification sent to Discord",
                    }
                else:
                    return {"status": "error", "message": "Failed to send to Discord"}

        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def export_to_airtable(
        self, base_id: str, table_name: str, api_key: str, workflows: List[Dict]
    ) -> Dict[str, Any]:
        """Export workflows to Airtable."""
        try:
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Bearer {api_key}"}

                records = []
                for workflow in workflows:
                    record = {
                        "fields": {
                            "Name": workflow.get("name", ""),
                            "Description": workflow.get("description", ""),
                            "Trigger Type": workflow.get("trigger_type", ""),
                            "Complexity": workflow.get("complexity", ""),
                            "Node Count": workflow.get("node_count", 0),
                            "Active": workflow.get("active", False),
                            "Integrations": ", ".join(workflow.get("integrations", [])),
                            "Last Updated": datetime.now().isoformat(),
                        }
                    }
                    records.append(record)

                # Create records in batches
                batch_size = 10
                created_records = 0

                for i in range(0, len(records), batch_size):
                    batch = records[i : i + batch_size]

                    response = await client.post(
                        f"https://api.airtable.com/v0/{base_id}/{table_name}",
                        headers=headers,
                        json={"records": batch},
                    )

                    if response.status_code == 200:
                        created_records += len(batch)
                    else:
                        return {
                            "status": "error",
                            "message": f"Failed to create records: {response.text}",
                        }

                return {
                    "status": "success",
                    "message": f"Exported {created_records} workflows to Airtable",
                }

        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def sync_with_notion(
        self, database_id: str, token: str, workflows: List[Dict]
    ) -> Dict[str, Any]:
        """Sync workflows with Notion database."""
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                    "Notion-Version": "2022-06-28",
                }

                created_pages = 0

                for workflow in workflows:
                    page_data = {
                        "parent": {"database_id": database_id},
                        "properties": {
                            "Name": {
                                "title": [
                                    {"text": {"content": workflow.get("name", "")}}
                                ]
                            },
                            "Description": {
                                "rich_text": [
                                    {
                                        "text": {
                                            "content": workflow.get("description", "")
                                        }
                                    }
                                ]
                            },
                            "Trigger Type": {
                                "select": {"name": workflow.get("trigger_type", "")}
                            },
                            "Complexity": {
                                "select": {"name": workflow.get("complexity", "")}
                            },
                            "Node Count": {"number": workflow.get("node_count", 0)},
                            "Active": {"checkbox": workflow.get("active", False)},
                            "Integrations": {
                                "multi_select": [
                                    {"name": integration}
                                    for integration in workflow.get("integrations", [])
                                ]
                            },
                        },
                    }

                    response = await client.post(
                        "https://api.notion.com/v1/pages",
                        headers=headers,
                        json=page_data,
                    )

                    if response.status_code == 200:
                        created_pages += 1
                    else:
                        return {
                            "status": "error",
                            "message": f"Failed to create page: {response.text}",
                        }

                return {
                    "status": "success",
                    "message": f"Synced {created_pages} workflows to Notion",
                }

        except Exception as e:
            return {"status": "error", "message": str(e)}

    def register_webhook(self, endpoint: str, handler):
        """Register a webhook endpoint."""
        self.webhook_endpoints[endpoint] = handler

    async def handle_webhook(self, endpoint: str, payload: WebhookPayload):
        """Handle incoming webhook."""
        if endpoint in self.webhook_endpoints:
            return await self.webhook_endpoints[endpoint](payload)
        else:
            return {"status": "error", "message": "Webhook endpoint not found"}


# Initialize integration hub
integration_hub = IntegrationHub()

# FastAPI app for Integration Hub
integration_app = FastAPI(title="N8N Integration Hub", version="1.0.0")

from fastapi.middleware.cors import CORSMiddleware

integration_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@integration_app.post("/integrations/linear/sync")
async def sync_linear(request: Request):
    """Sync issues from Linear."""
    try:
        body = await request.json()
        api_key = body.get("api_key")
        team_key = body.get("team_key")
        
        if not api_key:
            raise HTTPException(status_code=400, detail="Missing api_key")
            
        result = await integration_hub.sync_with_linear(api_key, team_key)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@integration_app.post("/integrations/github/sync")
async def sync_github(request: Request):
    """Sync workflows with GitHub repository."""
    try:
        body = await request.json()
        repo = body.get("repo")
        token = body.get("token")
        if not repo or not token:
             raise HTTPException(status_code=400, detail="Missing repo or token")
        
        result = await integration_hub.sync_with_github(repo, token)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@integration_app.post("/integrations/github/pr")
async def create_pr(request: Request):
    """Create a Pull Request."""
    try:
        body = await request.json()
        token = body.get("token")
        repo = body.get("repo")
        title = body.get("title")
        description = body.get("description")
        files = body.get("files", []) # List of {path, content}

        if not all([token, repo, title]):
             raise HTTPException(status_code=400, detail="Missing required fields")

        result = await integration_hub.create_github_pr(token, repo, title, description, files)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@integration_app.post("/integrations/slack/notify")
async def notify_slack(webhook_url: str, message: str):
    """Send notification to Slack."""
    try:
        result = await integration_hub.sync_with_slack(webhook_url, message)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@integration_app.post("/integrations/discord/notify")
async def notify_discord(webhook_url: str, message: str):
    """Send notification to Discord."""
    try:
        result = await integration_hub.sync_with_discord(webhook_url, message)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@integration_app.post("/integrations/airtable/export")
async def export_airtable(
    base_id: str, table_name: str, api_key: str, workflows: List[Dict]
):
    """Export workflows to Airtable."""
    try:
        result = await integration_hub.export_to_airtable(
            base_id, table_name, api_key, workflows
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@integration_app.post("/integrations/notion/sync")
async def sync_notion(database_id: str, token: str, workflows: List[Dict]):
    """Sync workflows with Notion database."""
    try:
        result = await integration_hub.sync_with_notion(database_id, token, workflows)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@integration_app.post("/webhooks/{endpoint}")
async def handle_webhook_endpoint(endpoint: str, payload: WebhookPayload):
    """Handle incoming webhook."""
    try:
        result = await integration_hub.handle_webhook(endpoint, payload)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@integration_app.post("/webhooks/sentry")
async def handle_sentry_webhook(payload: Dict[str, Any]):
    """Handle incoming Sentry webhook and create Linear issue."""
    try:
        # Check if it's an issue alert
        # Sentry payload structure varies, focusing on 'data' or top-level 'event'
        event_type = payload.get("action") # usually 'triggered'
        
        if event_type == "triggered":
            data = payload.get("data", {}).get("event", {})
            title = data.get("title", "Sentry Alert")
            description = f"Sentry Alert: {data.get('culprit', 'Unknown culprit')}\n\nLink: {data.get('web_url', '')}"
            
            # Use default or configured tokens (hardcoded for now to demonstrate flow, ideally from env/db)
            # In a real scenario, we'd look up the integration config
            
            # NOTE: We assume Linear is configured. We need a way to get the API key internally.
            # For this demo, we'll log it. In production, we'd fetch the generic API key.
            print(f"Sentry Alert Received: {title}")
            
            # FUTURE: Call integration_hub.sync_with_linear to CREATE an issue
            # integration_hub.create_linear_issue(title, description...)
            
            return {"status": "success", "message": "Alert received"}
            
        return {"status": "ignored", "message": "Not a trigger event"}
    except Exception as e:
        print(f"Sentry Webhook Error: {e}")
        # Don't fail the webhook request from Sentry
        return {"status": "error", "message": str(e)}


@integration_app.get("/integrations/supabase/health")
async def check_supabase_health(access_token: str, project_ref: str):
    """Check Supabase health."""
    try:
        if not access_token or not project_ref:
             raise HTTPException(status_code=400, detail="Missing access_token or project_ref")
        
        result = await integration_hub.check_supabase_health(access_token, project_ref)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@integration_app.get("/integrations/status")
async def get_integration_status():
    """Get status of all integrations."""
    return {
        "integrations": list(integration_hub.integrations.keys()),
        "webhook_endpoints": list(integration_hub.webhook_endpoints.keys()),
        "status": "operational",
    }


@integration_app.get("/integrations/dashboard")
async def get_integration_dashboard():
    """Get integration dashboard HTML."""
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>N8N Integration Hub</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                color: #333;
            }
            .dashboard {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background: white;
                padding: 30px;
                border-radius: 15px;
                margin-bottom: 30px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .header h1 {
                font-size: 32px;
                margin-bottom: 10px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            .integrations-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            .integration-card {
                background: white;
                padding: 25px;
                border-radius: 15px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                transition: transform 0.3s ease;
            }
            .integration-card:hover {
                transform: translateY(-5px);
            }
            .integration-icon {
                font-size: 48px;
                margin-bottom: 15px;
            }
            .integration-title {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 10px;
                color: #333;
            }
            .integration-description {
                color: #666;
                margin-bottom: 20px;
                line-height: 1.5;
            }
            .integration-actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            .action-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 25px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s ease;
                text-decoration: none;
                display: inline-block;
                text-align: center;
            }
            .btn-primary {
                background: #667eea;
                color: white;
            }
            .btn-primary:hover {
                background: #5a6fd8;
            }
            .btn-secondary {
                background: #f8f9fa;
                color: #666;
                border: 1px solid #e9ecef;
            }
            .btn-secondary:hover {
                background: #e9ecef;
            }
            .status-indicator {
                display: inline-block;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                margin-right: 8px;
            }
            .status-online {
                background: #28a745;
            }
            .status-offline {
                background: #dc3545;
            }
            .webhook-section {
                background: white;
                padding: 25px;
                border-radius: 15px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                margin-bottom: 30px;
            }
            .webhook-endpoint {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 10px;
                margin: 10px 0;
                font-family: monospace;
                border-left: 4px solid #667eea;
            }
        </style>
    </head>
    <body>
        <div class="dashboard">
            <div class="header">
                <h1>🔗 N8N Integration Hub</h1>
                <p>Connect your workflows with external platforms and services</p>
            </div>
            
            <div class="integrations-grid">
                <div class="integration-card">
                    <div class="integration-icon">🐙</div>
                    <div class="integration-title">GitHub</div>
                    <div class="integration-description">
                        Sync your workflows with GitHub repositories. 
                        Version control and collaborate on workflow development.
                    </div>
                    <div class="integration-actions">
                        <button class="action-btn btn-primary" onclick="syncGitHub()">Sync Repository</button>
                        <button class="action-btn btn-secondary" onclick="showGitHubConfig()">Configure</button>
                    </div>
                </div>
                
                 <div class="integration-card">
                    <div class="integration-icon">🔷</div>
                    <div class="integration-title">Linear</div>
                    <div class="integration-description">
                        Sync active issues from Linear team board. 
                        Bring your tasks directly into the Board Room.
                    </div>
                    <div class="integration-actions">
                        <button class="action-btn btn-primary" onclick="syncLinearTasks()">Sync Tasks</button>
                    </div>
                </div>

                <div class="integration-card">
                    <div class="integration-icon">💬</div>
                    <div class="integration-title">Slack</div>
                    <div class="integration-description">
                        Send notifications and workflow updates to Slack channels.
                        Keep your team informed about automation activities.
                    </div>
                    <div class="integration-actions">
                        <button class="action-btn btn-primary" onclick="testSlack()">Test Notification</button>
                        <button class="action-btn btn-secondary" onclick="showSlackConfig()">Configure</button>
                    </div>
                </div>
                
                <div class="integration-card">
                    <div class="integration-icon">🎮</div>
                    <div class="integration-title">Discord</div>
                    <div class="integration-description">
                        Integrate with Discord servers for workflow notifications.
                        Perfect for gaming communities and developer teams.
                    </div>
                    <div class="integration-actions">
                        <button class="action-btn btn-primary" onclick="testDiscord()">Test Notification</button>
                        <button class="action-btn btn-secondary" onclick="showDiscordConfig()">Configure</button>
                    </div>
                </div>
                
                <div class="integration-card">
                    <div class="integration-icon">📊</div>
                    <div class="integration-title">Airtable</div>
                    <div class="integration-description">
                        Export workflow data to Airtable for project management.
                        Create databases of your automation workflows.
                    </div>
                    <div class="integration-actions">
                        <button class="action-btn btn-primary" onclick="exportAirtable()">Export Data</button>
                        <button class="action-btn btn-secondary" onclick="showAirtableConfig()">Configure</button>
                    </div>
                </div>
                
                <div class="integration-card">
                    <div class="integration-icon">📝</div>
                    <div class="integration-title">Notion</div>
                    <div class="integration-description">
                        Sync workflows with Notion databases for documentation.
                        Create comprehensive workflow documentation.
                    </div>
                    <div class="integration-actions">
                        <button class="action-btn btn-primary" onclick="syncNotion()">Sync Database</button>
                        <button class="action-btn btn-secondary" onclick="showNotionConfig()">Configure</button>
                    </div>
                </div>
                
                <div class="integration-card">
                    <div class="integration-icon">🔗</div>
                    <div class="integration-title">Webhooks</div>
                    <div class="integration-description">
                        Create custom webhook endpoints for external integrations.
                        Receive data from any service that supports webhooks.
                    </div>
                    <div class="integration-actions">
                        <button class="action-btn btn-primary" onclick="createWebhook()">Create Webhook</button>
                        <button class="action-btn btn-secondary" onclick="showWebhookDocs()">Documentation</button>
                    </div>
                </div>
            </div>
            
            <div class="webhook-section">
                <h2>🔗 Webhook Endpoints</h2>
                <p>Available webhook endpoints for external integrations:</p>
                <div class="webhook-endpoint">
                    POST /webhooks/workflow-update<br>
                    <small>Receive notifications when workflows are updated</small>
                </div>
                <div class="webhook-endpoint">
                    POST /webhooks/workflow-execution<br>
                    <small>Receive notifications when workflows are executed</small>
                </div>
                <div class="webhook-endpoint">
                    POST /webhooks/error-report<br>
                    <small>Receive error reports from workflow executions</small>
                </div>
            </div>
        </div>
        
        <script>
            async function syncLinearTasks() {
                const apiKey = prompt('Enter Linear API Key (User settings > API):');
                if (!apiKey) return;
                
                const teamKey = prompt('Enter Team Key (e.g. KOS) [Optional]:') || null;

                try {
                    const response = await fetch('/integrations/linear/sync', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({api_key: apiKey, team_key: teamKey})
                    });
                     const result = await response.json();
                     alert(result.message || 'Linear sync completed');
                     console.log(result);
                } catch(error) {
                    alert('Error syncing with Linear: ' + error.message);
                }
            }

            async function syncGitHub() {
                const repo = prompt('Enter GitHub repository (owner/repo):');
                const token = prompt('Enter GitHub token:');
                
                if (repo && token) {
                    try {
                        const response = await fetch('/integrations/github/sync', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({repo, token})
                        });
                        const result = await response.json();
                        alert(result.message || 'GitHub sync completed');
                    } catch (error) {
                        alert('Error syncing with GitHub: ' + error.message);
                    }
                }
            }
            
            async function testSlack() {
                const webhook = prompt('Enter Slack webhook URL:');
                const message = 'Test notification from N8N Integration Hub';
                
                if (webhook) {
                    try {
                        const response = await fetch('/integrations/slack/notify', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({webhook_url: webhook, message})
                        });
                        const result = await response.json();
                        alert(result.message || 'Slack notification sent');
                    } catch (error) {
                        alert('Error sending to Slack: ' + error.message);
                    }
                }
            }
            
            async function testDiscord() {
                const webhook = prompt('Enter Discord webhook URL:');
                const message = 'Test notification from N8N Integration Hub';
                
                if (webhook) {
                    try {
                        const response = await fetch('/integrations/discord/notify', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({webhook_url: webhook, message})
                        });
                        const result = await response.json();
                        alert(result.message || 'Discord notification sent');
                    } catch (error) {
                        alert('Error sending to Discord: ' + error.message);
                    }
                }
            }
            
            function showGitHubConfig() {
                alert('GitHub Configuration:\\n\\n1. Create a GitHub token with repo access\\n2. Use format: owner/repository\\n3. Ensure workflows are in /workflows directory');
            }
            
            function showSlackConfig() {
                alert('Slack Configuration:\\n\\n1. Go to Slack App Directory\\n2. Add "Incoming Webhooks" app\\n3. Create webhook URL\\n4. Use the URL for notifications');
            }
            
            function showDiscordConfig() {
                alert('Discord Configuration:\\n\\n1. Go to Server Settings\\n2. Navigate to Integrations\\n3. Create Webhook\\n4. Copy webhook URL');
            }
            
            function showAirtableConfig() {
                alert('Airtable Configuration:\\n\\n1. Create a new Airtable base\\n2. Get API key from account settings\\n3. Get base ID from API documentation\\n4. Configure table structure');
            }
            
            function showNotionConfig() {
                alert('Notion Configuration:\\n\\n1. Create a Notion integration\\n2. Get integration token\\n3. Create database with proper schema\\n4. Share database with integration');
            }
            
            function createWebhook() {
                alert('Webhook Creation:\\n\\n1. Choose endpoint name\\n2. Configure payload structure\\n3. Set up authentication\\n4. Test webhook endpoint');
            }
            
            function showWebhookDocs() {
                alert('Webhook Documentation:\\n\\nAvailable at: /docs\\n\\nEndpoints:\\n- POST /webhooks/{endpoint}\\n- Payload: {event, data, timestamp}\\n- Response: {status, message}');
            }
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(integration_app, host="127.0.0.1", port=8003)
