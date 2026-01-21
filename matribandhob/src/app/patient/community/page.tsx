"use client";
import { useState, useEffect } from 'react';
import {
    collection, query, orderBy, limit, addDoc,
    serverTimestamp, onSnapshot, doc, updateDoc,
    increment, arrayUnion, arrayRemove
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Post, Comment } from "@/types/community";
import {
    MessageCircle, Heart, Share2, Send,
    User, PlusCircle, Loader2, Sun, Moon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

export default function CommunityPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPostContent, setNewPostContent] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTag, setSelectedTag] = useState("General");
    
    // Theme Hook
    const { darkMode, toggleDarkMode } = useTheme();

    // Tags
    const tags = ["General", "Pregnancy", "Nutrition", "Mental Health", "Baby Care", "Experience"];

    // --- 1. FETCH POSTS REAL-TIME ---
    useEffect(() => {
        const q = query(
            collection(db, "posts"),
            orderBy("timestamp", "desc"),
            limit(50)
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const livePosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Post[];
            setPosts(livePosts);
            setLoading(false);
        });

        return () => unsub();
    }, []);

    // --- 2. CREATE POST ---
    const handleCreatePost = async () => {
        if (!newPostContent.trim() || !auth.currentUser) return;

        try {
            await addDoc(collection(db, "posts"), {
                authorId: auth.currentUser.uid,
                authorName: auth.currentUser.displayName || "Anonymous Mother",
                authorRole: 'mother',
                content: newPostContent,
                tags: [selectedTag],
                likes: 0,
                likedBy: [],
                commentCount: 0,
                timestamp: serverTimestamp()
            });
            setNewPostContent("");
            setShowCreateModal(false);
        } catch (e) {
            console.error("Error creating post:", e);
        }
    };

    // --- 3. LIKE POST ---
    const handleLike = async (post: Post) => {
        if (!auth.currentUser) return;
        const userId = auth.currentUser.uid;
        const postRef = doc(db, "posts", post.id);

        if (post.likedBy.includes(userId)) {
            await updateDoc(postRef, {
                likes: increment(-1),
                likedBy: arrayRemove(userId)
            });
        } else {
            await updateDoc(postRef, {
                likes: increment(1),
                likedBy: arrayUnion(userId)
            });
        }
    };

    return (
        <div className={`min-h-screen font-sans relative pb-28 pt-24 px-4 md:px-0 transition-colors duration-500 overflow-x-hidden
            ${darkMode ? "bg-[#120a10] text-white" : "bg-[#fff5f7] text-slate-900"}`}>

            {/* BACKGROUND EFFECTS (MATCHING DASHBOARD) */}
            <div className={`fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none transition-colors duration-500 ${darkMode ? "bg-pink-600/10" : "bg-pink-300/20"}`} />
            <div className={`fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none transition-colors duration-500 ${darkMode ? "bg-purple-600/10" : "bg-purple-300/20"}`} />

            {/* HEADER */}
            <header className={`fixed top-0 left-0 w-full z-40 backdrop-blur-xl border-b px-4 md:px-8 py-4 flex justify-between items-center transition-all duration-300
                ${darkMode ? "bg-[#120a10]/80 border-white/5" : "bg-[#fff5f7]/80 border-pink-100"}`}>
                
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-full shadow-sm ${darkMode ? "bg-white/10" : "bg-white"}`}>
                        <MessageCircle className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Moms Community</h1>
                        <p className={`text-[10px] font-bold uppercase tracking-widest leading-none ${darkMode ? "text-gray-400" : "text-slate-400"}`}>Safe Space</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* DARK MODE TOGGLE */}
                    <button
                        onClick={toggleDarkMode}
                        className={`p-2 rounded-full transition-all border ${darkMode ? "bg-white/5 text-yellow-400 border-white/5" : "bg-white text-slate-500 shadow-sm border-pink-100"}`}
                    >
                        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg shadow-pink-500/30 transition-transform active:scale-95 hover:brightness-110"
                    >
                        <PlusCircle className="w-4 h-4" /> <span className="hidden sm:inline">New Post</span>
                    </button>
                </div>
            </header>

            {/* FEED */}
            <div className="max-w-2xl mx-auto space-y-6 relative z-10">
                {/* TAG FILTER BAR */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                    {["All", ...tags].map(tag => {
                        const isSelected = selectedTag === (tag === "All" ? "General" : tag);
                        return (
                            <button
                                key={tag}
                                onClick={() => setSelectedTag(tag === "All" ? "General" : tag)}
                                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border
                                ${isSelected 
                                    ? "bg-pink-600 text-white border-pink-600" 
                                    : (darkMode ? "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10" : "bg-white border-pink-100 text-slate-500 hover:text-pink-600")}`}
                            >
                                {tag}
                            </button>
                        )
                    })}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center pt-20 gap-3 opacity-50">
                        <Loader2 className="animate-spin text-pink-500 w-8 h-8" />
                        <p className={`text-xs font-bold ${darkMode ? "text-gray-500" : "text-slate-400"}`}>Loading conversations...</p>
                    </div>
                ) : (
                    posts.map(post => {
                        if (selectedTag !== "General" && !post.tags.includes(selectedTag) && selectedTag !== "All") return null;
                        return <PostCard key={post.id} post={post} onLike={() => handleLike(post)} darkMode={darkMode} />;
                    })
                )}

                {!loading && posts.length === 0 && (
                    <div className="text-center py-20 opacity-50">
                        <MessageCircle className={`w-12 h-12 mx-auto mb-4 ${darkMode ? "text-gray-700" : "text-slate-300"}`} />
                        <p className={`font-bold ${darkMode ? "text-gray-500" : "text-slate-400"}`}>No posts yet. Be the first!</p>
                    </div>
                )}
            </div>

            {/* CREATE MODAL */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className={`fixed inset-0 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4
                        ${darkMode ? "bg-black/60" : "bg-slate-900/60"}`}
                    >
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            className={`w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden
                            ${darkMode ? "bg-[#1a0b10] border border-white/10" : "bg-white"}`}
                        >
                            {!darkMode && <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-pink-50 to-purple-50 -z-10" />}

                            <div className="flex justify-between items-center mb-6">
                                <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>New Discussion</h3>
                                <button onClick={() => setShowCreateModal(false)} className={`p-2 rounded-full shadow-sm transition-colors ${darkMode ? "bg-white/10 hover:bg-white/20 text-white" : "bg-white hover:bg-slate-50 text-slate-800"}`}>
                                    <span className="text-xl leading-none block -mt-1">&times;</span>
                                </button>
                            </div>

                            <textarea
                                className={`w-full border rounded-2xl p-4 font-medium h-40 resize-none outline-none focus:ring-2 focus:ring-pink-500/50 transition-all shadow-sm
                                ${darkMode 
                                    ? "bg-white/5 border-white/10 text-white placeholder:text-gray-500" 
                                    : "bg-white border-slate-100 text-slate-700 placeholder:text-slate-300"}`}
                                placeholder="Share your experience or ask a question..."
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                            />

                            <div className="mt-4 mb-6">
                                <label className={`text-[10px] font-bold uppercase tracking-widest mb-2 block ${darkMode ? "text-gray-500" : "text-slate-400"}`}>Select Topic</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {tags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => setSelectedTag(tag)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border
                                            ${selectedTag === tag
                                                    ? "bg-pink-600 border-pink-600 text-white shadow-lg shadow-pink-200"
                                                    : (darkMode 
                                                        ? "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10" 
                                                        : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50")}`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleCreatePost}
                                disabled={!newPostContent.trim()}
                                className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-xl shadow-pink-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                            >
                                Post to Community
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}

// --- SUB-COMPONENT: POST CARD ---
function PostCard({ post, onLike, darkMode }: { post: Post, onLike: () => void, darkMode: boolean }) {
    const isLiked = auth.currentUser ? post.likedBy.includes(auth.currentUser.uid) : false;
    const [commentsOpen, setCommentsOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-[2rem] p-6 shadow-sm border transition-all duration-300 hover:shadow-lg
            ${darkMode 
                ? "bg-[#1a0b10] border-white/5 hover:border-pink-500/20" 
                : "bg-white border-pink-50/50 hover:shadow-[0_8px_30px_rgba(236,72,153,0.1)]"}`}
        >
            {/* HEADER */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm text-pink-500
                        ${darkMode ? "bg-white/5 border-white/5" : "bg-gradient-to-br from-pink-100 to-purple-50 border-white"}`}>
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className={`font-bold text-base ${darkMode ? "text-gray-100" : "text-slate-900"}`}>{post.authorName}</h4>
                        <span className={`text-xs font-medium capitalize flex items-center gap-1.5 mt-0.5 ${darkMode ? "text-gray-500" : "text-slate-400"}`}>
                            <span className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] tracking-wide ${darkMode ? "bg-white/10 text-gray-300" : "bg-slate-100 text-slate-500"}`}>{post.authorRole}</span>
                            <span>•</span>
                            <span className="text-pink-500 font-bold">{post.tags[0]}</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <p className={`leading-relaxed mb-6 font-medium text-[15px] ${darkMode ? "text-gray-300" : "text-slate-600"}`}>
                {post.content}
            </p>

            {/* ACTIONS */}
            <div className="flex items-center gap-4 pt-2">
                <button
                    onClick={onLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all
                    ${isLiked 
                        ? (darkMode ? "bg-pink-500/20 text-pink-400" : "bg-pink-50 text-pink-600") 
                        : (darkMode ? "bg-white/5 text-gray-400 hover:bg-white/10" : "bg-slate-50 text-slate-500 hover:bg-slate-100")}`}
                >
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                    {post.likes} <span className="hidden sm:inline">Likes</span>
                </button>
                <button
                    onClick={() => setCommentsOpen(!commentsOpen)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all
                    ${commentsOpen 
                        ? (darkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-50 text-blue-600")
                        : (darkMode ? "bg-white/5 text-gray-400 hover:bg-white/10" : "bg-slate-50 text-slate-500 hover:bg-slate-100")}`}
                >
                    <MessageCircle className="w-4 h-4" />
                    {post.commentCount} <span className="hidden sm:inline">Comments</span>
                </button>
                <button className={`p-2 rounded-xl ml-auto transition-colors ${darkMode ? "bg-white/5 text-gray-400 hover:bg-white/10" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}>
                    <Share2 className="w-4 h-4" />
                </button>
            </div>

            {/* COMMENT SECTION */}
            <AnimatePresence>
                {commentsOpen && <CommentSection postId={post.id} darkMode={darkMode} />}
            </AnimatePresence>

        </motion.div>
    );
}

// --- SUB-COMPONENT: COMMENT SECTION ---
function CommentSection({ postId, darkMode }: { postId: string, darkMode: boolean }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
        const q = query(
            collection(db, "posts", postId, "comments"),
            orderBy("timestamp", "asc")
        );
        const unsub = onSnapshot(q, (snap) => {
            setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment)));
        });
        return () => unsub();
    }, [postId]);

    const submitComment = async () => {
        if (!newComment.trim() || !auth.currentUser) return;
        try {
            await addDoc(collection(db, "posts", postId, "comments"), {
                authorId: auth.currentUser.uid,
                authorName: auth.currentUser.displayName || "User",
                content: newComment,
                timestamp: serverTimestamp(),
                postId
            });
            await updateDoc(doc(db, "posts", postId), {
                commentCount: increment(1)
            });
            setNewComment("");
        } catch (e) { console.error(e) }
    };

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`mt-6 pt-6 border-t ${darkMode ? "border-white/5" : "border-slate-100"}`}
        >
            <div className="space-y-4 mb-6">
                {comments.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0
                            ${darkMode ? "bg-white/10 text-gray-400" : "bg-slate-100 text-slate-500"}`}>
                            {comment.authorName[0]}
                        </div>
                        <div className={`p-3 rounded-2xl rounded-tl-none text-sm border
                            ${darkMode ? "bg-white/5 border-white/5 text-gray-300" : "bg-slate-50 border-slate-100 text-slate-600"}`}>
                            <span className={`font-bold block text-xs mb-1 ${darkMode ? "text-white" : "text-slate-900"}`}>{comment.authorName}</span>
                            <span className="leading-snug block">{comment.content}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 relative items-center">
                <input
                    className={`flex-1 border rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-pink-500 transition-all
                    ${darkMode 
                        ? "bg-white/5 border-white/10 text-white placeholder:text-gray-600" 
                        : "bg-slate-50 border-slate-200 focus:bg-white"}`}
                    placeholder="Write a supportive comment..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submitComment()}
                />
                <button onClick={submitComment} className={`p-3 rounded-xl transition-colors shadow-lg active:scale-95
                    ${darkMode ? "bg-pink-600 text-white hover:bg-pink-500" : "bg-slate-900 text-white hover:bg-black shadow-slate-900/20"}`}>
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    )
}