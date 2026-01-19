import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageCircle, ExternalLink, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const DashboardReviews = ({ business }) => {
    const { data: reviews, isLoading } = useQuery({
        queryKey: ['reviews', business.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('reviews')
                .select(`
                    *,
                    user:user_id (
                        email,
                        user_metadata
                    )
                `)
                .eq('provider_id', business.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        }
    });

    const handleViewPublic = () => {
        window.open(`/provider/${business.id}#reviews`, '_blank');
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold">Customer Reviews</h2>
                    <p className="text-sm text-slate-500">Manage and reply to your reviews.</p>
                </div>
                <Button variant="outline" onClick={handleViewPublic}>
                    <ExternalLink className="w-4 h-4 mr-2" /> View on Public Page
                </Button>
            </div>

            <div className="grid gap-4">
                {reviews && reviews.length > 0 ? (
                    reviews.map((review) => (
                        <Card key={review.id}>
                            <CardContent className="p-6">
                                <div className="flex gap-4">
                                    <Avatar>
                                        <AvatarImage src={review.user?.user_metadata?.avatar_url} />
                                        <AvatarFallback>{review.user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold">{review.user?.user_metadata?.full_name || 'Anonymous User'}</h4>
                                                <div className="flex items-center gap-1 text-yellow-500">
                                                    {[...Array(5)].map((_, j) => (
                                                        <Star
                                                            key={j}
                                                            className={`w-3 h-3 ${j < review.rating ? 'fill-current' : 'text-slate-300'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-400">
                                                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            {review.comment}
                                        </p>
                                        <div className="pt-2">
                                            <Button variant="ghost" size="sm" className="text-blue-600 h-auto p-0 hover:text-blue-700 hover:bg-transparent font-medium">
                                                <MessageCircle className="w-3 h-3 mr-1.5" /> Reply
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            No reviews yet. Share your profile to get more feedback!
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};
