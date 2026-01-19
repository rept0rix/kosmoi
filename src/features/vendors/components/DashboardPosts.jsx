import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, Send, Crown, Eye, ThumbsUp, Loader2, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

export const DashboardPosts = ({ business }) => {
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    // Fetch Posts
    const { data: posts, isLoading } = useQuery({
        queryKey: ['business-posts', business.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('business_posts')
                .select('*')
                .eq('provider_id', business.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        }
    });

    // Create Post Mutation
    const createPostMutation = useMutation({
        mutationFn: async (/** @type {{ title: string; content: string; image_url: string; }} */ newPost) => {
            const { error } = await supabase
                .from('business_posts')
                .insert([{
                    title: newPost.title,
                    content: newPost.content,
                    image_url: newPost.image_url,
                    provider_id: business.id
                }]);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['business-posts', business.id] });
            toast({ title: "Post Published!", description: "Your update is now live." });
            setTitle('');
            setContent('');
            setImageUrl('');
        },
        onError: (err) => {
            console.error(err);
            toast({ title: "Error", description: "Failed to publish post.", variant: "destructive" });
        }
    });

    // Delete Post Mutation
    const deletePostMutation = useMutation({
        mutationFn: async (postId) => {
            const { error } = await supabase
                .from('business_posts')
                .delete()
                .eq('id', postId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['business-posts', business.id] });
            toast({ title: "Post Deleted", description: "The post has been removed." });
        }
    });

    const handleSubmit = () => {
        if (!title.trim() || !content.trim()) {
            toast({ title: "Missing Fields", description: "Please add a title and content.", variant: "destructive" });
            return;
        }
        createPostMutation.mutate({ title, content, image_url: imageUrl });
    };

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
                {/* Create & List Column */}
                <div className="md:col-span-2 space-y-6">
                    {/* Create Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Create New Post</CardTitle>
                            <CardDescription>Share updates, offers, or news with your customers.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input
                                placeholder="Post Title (e.g., Summer Sale!)"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <Textarea
                                placeholder="What's new with your business?"
                                className="min-h-[100px]"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                            <Input
                                placeholder="Image URL (Optional)"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                            />
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="text-slate-600" onClick={() => toast({ description: "Image upload coming soon, copy paste URL for now." })}>
                                    <ImageIcon className="w-4 h-4 mr-2" /> Upload Photo
                                </Button>
                                {/* Boost feature placeholder */}
                                <Button variant="outline" size="sm" className="text-slate-600" disabled>
                                    <Crown className="w-4 h-4 mr-2 text-yellow-600" /> Boost Post
                                </Button>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end border-t bg-slate-50/50 p-4">
                            <Button
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={handleSubmit}
                                disabled={createPostMutation.isPending}
                            >
                                {createPostMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                Publish Post
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Posts List */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-slate-900">Your Posts</h3>
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                        ) : posts && posts.length > 0 ? (
                            posts.map(post => (
                                <Card key={post.id} className="group relative">
                                    <CardContent className="p-6">
                                        <div className="flex gap-4">
                                            <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {post.image_url ? (
                                                    <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="w-6 h-6 text-slate-400" />
                                                )}
                                            </div>
                                            <div className="space-y-1 flex-1">
                                                <div className="flex justify-between">
                                                    <h4 className="font-medium">{post.title}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="bg-green-100 text-green-700">Published</Badge>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => deletePostMutation.mutate(post.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-600 line-clamp-2">
                                                    {post.content}
                                                </p>
                                                <div className="flex gap-4 pt-2 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.view_count || 0} views</span>
                                                    <span className="flex items-center gap-1">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Card>
                                <CardContent className="p-8 text-center text-muted-foreground">
                                    No posts yet. Create your first post above!
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Sidebar / Tips */}
                <div className="space-y-4">
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
                        <CardHeader>
                            <CardTitle className="text-amber-900 flex items-center gap-2">
                                <Crown className="w-5 h-5" /> Pro Tips
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-amber-800/80 space-y-3">
                            <p>Posts with images get <strong>2.3x</strong> more engagement.</p>
                            <p>Post at least once a week to keep your audience engaged.</p>
                            <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-700 text-white border-none mt-2">
                                Unlock Premium Templates
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
