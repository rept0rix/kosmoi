import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogPosts } from '@/data/blogPosts';
import { db } from '@/api/supabaseClient';
import SEO from '@/components/SEO';
import { motion } from 'framer-motion';
import { Calendar, Tag, ChevronRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

export default function Blog() {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.dir() === 'rtl';
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPosts() {
            try {
                // Fetch published posts (and drafts for dev visibility if needed)
                const { data, error } = await db
                    .from('blog_posts')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setPosts(data || []);
            } catch (err) {
                console.error("Failed to fetch blog posts:", err);
                // Fallback to static data if DB fails or is empty? 
                // setPosts(blogPosts); 
            } finally {
                setLoading(false);
            }
        }
        fetchPosts();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <SEO
                title="Kosmoi Blog - Island Updates & Travel Tips"
                description="Latest news, hidden gems, and travel guides for Koh Samui."
                url="https://kosmoi.com/blog"
            />

            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/kosmoi_logo_icon.svg" alt="Kosmoi" className="w-8 h-8" />
                        <span className="font-bold text-xl tracking-tight text-gray-900">Kosmoi Blog</span>
                    </Link>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                {posts.length === 0 ? (
                    <div className="text-center py-20">
                        <h3 className="text-xl font-medium text-gray-500">
                            {isRTL ? 'בקרוב יעלו כתבות...' : 'Coming soon...'}
                        </h3>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post, idx) => (
                            <motion.article
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col"
                            >
                                {/* Cover Image - Aspect Ratio 16:9 */}
                                <div className="aspect-[16/9] bg-gray-200 relative overflow-hidden">
                                    {post.cover_image ? (
                                        <img
                                            src={post.cover_image}
                                            alt={post.title}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-200">
                                            <Tag className="w-12 h-12" />
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(post.published_at || post.created_at), 'MMM d, yyyy')}
                                        </span>
                                        {post.tags && post.tags.length > 0 && (
                                            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                                                {post.tags[0]}
                                            </span>
                                        )}
                                    </div>

                                    <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                                        {post.title}
                                    </h2>

                                    <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">
                                        {post.excerpt || post.content?.substring(0, 120) + '...'}
                                    </p>

                                    <Link
                                        to={`/blog/${post.slug}`}
                                        className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 mt-auto"
                                    >
                                        {isRTL ? 'קרא עוד' : 'Read Article'}
                                        <ChevronRight className={`w-4 h-4 ${isRTL ? 'rotate-180 mr-1' : 'ml-1'}`} />
                                    </Link>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
