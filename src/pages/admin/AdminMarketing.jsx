import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bot, Megaphone, TrendingUp, Send } from "lucide-react";
import { AgentRunner } from "@/features/agents/services/AgentRunner";
import { MARKETING_AGENT } from "@/features/agents/services/registry/MarketingAgent";
import { toast } from "@/components/ui/use-toast";
import { MarketingService } from "../../services/integrations/MarketingService";

const AdminMarketing = () => {
    const [history, setHistory] = useState([]);
    const [isThinking, setIsThinking] = useState(false);
    const [agentOutput, setAgentOutput] = useState(null);
    const [generatedPost, setGeneratedPost] = useState(null);
    const [isPosting, setIsPosting] = useState(false);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await MarketingService.getHistory();
            setHistory(data || []);
        } catch (e) {
            console.error("Failed to load history", e);
        }
    };

    const handleRunDave = async () => {
        setIsThinking(true);
        setAgentOutput(null);
        setGeneratedPost(null);

        try {
            // "Run Dave" - we give him a generic trigger to find trends and create content
            const input = "Find a trending travel topic for Koh Samui and generate an Instagram post for it.";
            const result = await AgentRunner.run(MARKETING_AGENT, input, {
                // Context for Dave
                niche: "Travel & Services"
            });

            setAgentOutput(result);
        } catch (error) {
            console.error(error);
            toast({ title: "Dave Error", description: "Dave crashed!", variant: "destructive" });
        } finally {
            setIsThinking(false);
        }
    };

    const handlePost = async () => {
        if (!agentOutput || !agentOutput.output) return;

        setIsPosting(true);
        try {
            // Generate an image asset first (simulated)
            const imageUrl = await MarketingService.generateImageAsset(agentOutput.output.substring(0, 50));

            await MarketingService.publishPost('instagram', {
                caption: agentOutput.output,
                imageUrl: imageUrl
            });

            toast({ title: "Posted!", description: "Content is live on Instagram." });
            setAgentOutput(null); // Clear workspace
            loadHistory(); // Refresh history
        } catch (error) {
            console.error(error);
            toast({ title: "Post Failed", description: "Could not publish content.", variant: "destructive" });
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Marketing Center</h1>
                    <p className="text-gray-500">Manage your social presence with Dave</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="text-lg py-1 px-3 gap-1">
                        <Bot className="w-4 h-4 text-purple-600" />
                        Dave Status: <span className="text-green-600 font-bold">Online</span>
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Control Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
                        <CardHeader>
                            <CardTitle className="text-purple-800 flex items-center gap-2">
                                <Megaphone className="w-5 h-5" />
                                Daily Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-gray-600">
                                Dave is ready to scrape trends and generate viral content for you.
                            </p>
                            <Button
                                className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg"
                                onClick={handleRunDave}
                                disabled={isThinking}
                            >
                                {isThinking ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Dave is working...
                                    </>
                                ) : (
                                    <>
                                        <TrendingUp className="w-5 h-5 mr-2" />
                                        Generate Daily Content
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Recent History */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base text-gray-500 uppercase tracking-wide">Recent Posts</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {history.length === 0 ? (
                                <p className="text-sm text-gray-400">No recent activity.</p>
                            ) : (
                                history.map(post => (
                                    <div key={post.id} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className={`p-2 rounded-full ${post.platform === 'instagram' ? 'bg-pink-100 text-pink-600' : 'bg-gray-200'}`}>
                                            <Send className="w-3 h-3" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate">
                                                {post.content?.caption?.substring(0, 30)}...
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(post.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                            {post.status}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Agent Workspace */}
                <Card className="lg:col-span-2 shadow-sm border-2 border-purple-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-700">
                            <Bot className="w-5 h-5" />
                            Dave's Workspace
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="min-h-[500px]">
                        {!agentOutput && !isThinking && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50 space-y-2">
                                <Bot className="w-16 h-16" />
                                <p>Waiting for instructions...</p>
                            </div>
                        )}

                        {agentOutput && (
                            <div className="space-y-6">
                                {/* Thoughts */}
                                <div className="space-y-2">
                                    <h4 className="font-medium text-xs uppercase tracking-wider text-gray-500">Thought Stream</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono text-gray-700 space-y-2 border max-h-[200px] overflow-y-auto">
                                        {agentOutput.thoughtProcess.map((t, i) => (
                                            <div key={i} className="flex gap-2">
                                                <span className="text-purple-500">{">"}</span>
                                                <span>{t}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Result */}
                                <div className="space-y-2">
                                    <h4 className="font-medium text-xs uppercase tracking-wider text-gray-500">Suggested Content</h4>
                                    <div className="bg-white p-4 rounded-xl border-2 border-purple-100 shadow-sm">
                                        <pre className="whitespace-pre-wrap font-sans text-gray-800">
                                            {typeof agentOutput.output === 'object'
                                                ? JSON.stringify(agentOutput.output, null, 2)
                                                : agentOutput.output}
                                        </pre>
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <Button
                                            variant="default"
                                            className="bg-pink-600 hover:bg-pink-700"
                                            onClick={handlePost}
                                            disabled={isPosting}
                                        >
                                            {isPosting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                            Post to Instagram
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};

export default AdminMarketing;
