import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogPosts } from '@/data/blogPosts';
import SEO from '@/components/SEO';
import { motion } from 'framer-motion';
import { Calendar, Tag, ArrowLeft, ArrowRight, Loader2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';

export default function BlogPostDetail() {
    const { slug } = useParams();
    const { t, i18n } = useTranslation();
    const isRTL = i18n.dir() === 'rtl';
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) {
            fetchPost();
        }
    }, [slug]);

    async function fetchPost() {
        setLoading(true);
        // Simulate fetch delay
        setTimeout(() => {
            const foundPost = blogPosts.find(p => p.slug === slug);
            setPost(foundPost || null);
            setLoading(false);
        }, 400);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Post not found</h1>
                <Link to="/blog" className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
                    {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                    {isRTL ? 'חזרה לבלוג' : 'Back to Blog'}
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans">
            <SEO
                title={`${post.title} - Kosmoi Blog`}
                description={post.excerpt}
                image={post.cover_image}
                url={`https://kosmoi.com/blog/${post.slug}`}
            />

            {/* Navigation Bar */}
            <div className="bg-white border-b sticky top-0 z-10 bg-opacity-90 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/blog" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                        {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                        <span className="font-medium">{isRTL ? 'חזרה לבלוג' : 'Back to Blog'}</span>
                    </Link>
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/kosmoi_logo_icon.svg" alt="Kosmoi" className="w-8 h-8" />
                    </Link>
                </div>
            </div>

            <article className="max-w-4xl mx-auto px-4 py-8 md:py-12">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 md:mb-12 text-center"
                >
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-6">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(post.published_at || post.created_at), 'MMMM d, yyyy')}
                        </span>
                        {post.reading_time && (
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {post.reading_time} min read
                            </span>
                        )}
                        {post.tags && post.tags.length > 0 && (
                            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium text-xs">
                                {post.tags[0]}
                            </span>
                        )}
                    </div>

                    <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                        {post.title}
                    </h1>

                    {post.excerpt && (
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                            {post.excerpt}
                        </p>
                    )}
                </motion.div>

                {/* Cover Image */}
                {post.cover_image && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mb-12 rounded-2xl overflow-hidden shadow-lg aspect-video"
                    >
                        <img
                            src={post.cover_image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                    </motion.div>
                )}

                {/* Content Body */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="prose prose-lg md:prose-xl max-w-none prose-blue prose-headings:font-bold prose-img:rounded-xl text-gray-800"
                >
                    <ReactMarkdown>
                        {post.content}
                    </ReactMarkdown>
                </motion.div>

                {/* Footer Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-gray-100">
                        <div className="flex flex-wrap gap-2">
                            {post.tags.map(tag => (
                                <span key={tag} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                                    <Tag className="w-3 h-3" />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </article>
        </div>
    );
}
