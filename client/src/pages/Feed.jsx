import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import Badge from "../components/Badge";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { getPostEngagementBadgeType } from "../utils/badgeHelper";


let socket;

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newPost, setNewPost] = useState({ content: "", type: "general", imageUrl: "" });
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState({});
  const [expanded, setExpanded] = useState({});
  const [engagementFilter, setEngagementFilter] = useState("recent");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000");
    socket.emit("user:online", user?._id);
    socket.on("post:created", (post) => setPosts((prev) => [post, ...prev]));
    return () => socket.disconnect();
  }, [user]);

  const loadPosts = useCallback(async (p = 1, append = false) => {
    try {
      const data = await api.getFeed(p);
      setPosts((prev) => append ? [...prev, ...data.posts] : data.posts);
      setHasMore(data.posts.length === 10);
    } catch { toast.error("Failed to load feed"); }
    finally { setLoading(false); setLoadingMore(false); }
  }, []);

  useEffect(() => { loadPosts(1); }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (categoryFilter && post.type !== categoryFilter) return false;
      if (dateFilter) {
        const now = Date.now();
        const postTime = new Date(post.createdAt).getTime();
        const diffDays = (now - postTime) / (1000 * 60 * 60 * 24);
        if (dateFilter === "today" && diffDays > 1) return false;
        if (dateFilter === "week" && diffDays > 7) return false;
        if (dateFilter === "month" && diffDays > 30) return false;
      }
      return true;
    }).sort((a, b) => {
      if (engagementFilter === "trending") {
        const aScore = (a.likes?.length || 0) * 2 + (a.comments?.length || 0);
        const bScore = (b.likes?.length || 0) * 2 + (b.comments?.length || 0);
        return bScore - aScore;
      }
      if (engagementFilter === "popular") {
        return (b.likes?.length || 0) - (a.likes?.length || 0);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [posts, engagementFilter, categoryFilter, dateFilter]);

  const clearFilters = () => {
    setEngagementFilter("recent");
    setCategoryFilter("");
    setDateFilter("");
  };

  const handlePost = async () => {
    if (!newPost.content.trim()) return;
    setSubmitting(true);
    try {
      const post = await api.createPost(newPost);
      socket?.emit("post:new", post);
      setPosts((prev) => [post, ...prev]);
      setNewPost({ content: "", type: "general", imageUrl: "" });
      toast.success("Post created!");
    } catch (e) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  const handleLike = async (id) => {
    try {
      const data = await api.likePost(id);
      setPosts((prev) => prev.map((p) => p._id === id ? {
        ...p,
        likes: data.liked ? [...(p.likes || []), user._id] : (p.likes || []).filter((l) => l !== user._id)
      } : p));
    } catch {}
  };

  const handleComment = async (postId) => {
    const text = commentText[postId];
    if (!text?.trim()) return;
    try {
      const comment = await api.commentPost(postId, text);
      setPosts((prev) => prev.map((p) => p._id === postId ? { ...p, comments: [...(p.comments || []), comment] } : p));
      setCommentText((prev) => ({ ...prev, [postId]: "" }));
    } catch (e) { toast.error(e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this post?")) return;
    try {
      await api.deletePost(id);
      setPosts((prev) => prev.filter((p) => p._id !== id));
      toast.success("Deleted");
    } catch (e) { toast.error(e.message); }
  };

  const loadMore = () => {
    const next = page + 1; setPage(next); setLoadingMore(true);
    loadPosts(next, true);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title="Community Feed" />
        <div style={{ display: "flex", maxWidth: 1100, padding: "24px 32px", gap: 24 }}>
          {/* Feed Center */}
          <div style={{ flex: 1, maxWidth: 640 }}>
            {/* Filters */}
            <div className="card" style={{ marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                  Engagement
                </label>
                <select
                  value={engagementFilter}
                  onChange={(e) => setEngagementFilter(e.target.value)}
                >
                  <option value="recent">Recent</option>
                  <option value="trending">Trending</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>

              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All posts</option>
                  <option value="general">General</option>
                  <option value="job">Job Updates</option>
                  <option value="achievement">Achievements</option>
                  <option value="event">Events</option>
                </select>
              </div>

              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                  Date Posted
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="">All time</option>
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                </select>
              </div>

              <button className="btn btn-outline btn-sm" onClick={clearFilters} style={{ marginBottom: 0 }}>
                Clear
              </button>
            </div>

            {/* Create Post */}
            <div className="create-post">
              <div className="create-post-input">
                <div className="avatar">{user?.fullName?.[0]}</div>
                <textarea rows={3} placeholder={`What's on your mind, ${user?.fullName?.split(" ")[0]}?`}
                  value={newPost.content} onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  style={{ flex: 1 }} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
                <select value={newPost.type} onChange={(e) => setNewPost({ ...newPost, type: e.target.value })} style={{ width: 140 }}>
                  <option value="general">General</option>
                  <option value="job">Job Update</option>
                  <option value="achievement">Achievement</option>
                  <option value="event">Event</option>
                </select>
                <input placeholder="Image URL (optional)" value={newPost.imageUrl}
                  onChange={(e) => setNewPost({ ...newPost, imageUrl: e.target.value })} style={{ flex: 1 }} />
                <button className="btn btn-primary" onClick={handlePost} disabled={submitting || !newPost.content.trim()}>
                  {submitting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
            {/* Posts */}
            {loading ? (
              <div style={{ textAlign: "center", padding: 40 }}><div className="spinner" style={{ margin: "auto" }} /></div>
            ) : filteredPosts.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}>
                {posts.length === 0 ? "No posts yet. Be the first to post!" : "No posts match your filters."}
              </div>
            ) : (
              filteredPosts.map((post) => {
                const liked = post.likes?.includes(user?._id) || post.likes?.some?.((l) => l === user?._id || l?._id === user?._id);
                const showComments = expanded[post._id];
                return (
                  <div className="post-card" key={post._id}>
                    <div className="post-header">
                      <div className="avatar">{post.author?.avatar ? <img src={post.author.avatar} alt="" /> : post.author?.fullName?.[0]}</div>
                      <div className="post-author">
                        <div className="name">{post.author?.fullName}</div>
                        <div className="meta">{post.author?.role === "alumni" ? post.author?.company : post.author?.role} · {new Date(post.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Badge type={getPostEngagementBadgeType(post.createdAt, post.likes?.length || 0)} size="small" />
                        {post.type !== "general" && <span className="badge badge-blue">{post.type}</span>}
                        {(post.author?._id === user?._id || user?.role === "admin") && (
                          <button className="btn btn-sm" style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer" }} onClick={() => handleDelete(post._id)}>🗑</button>
                        )}
                      </div>
                    </div>
                    <div className="post-body">{post.content}</div>
                    {post.imageUrl && <img src={post.imageUrl} className="post-img" alt="" onError={(e) => e.target.style.display = "none"} />}
                    {post.tags?.length > 0 && (
                      <div style={{ padding: "0 16px 12px" }} className="tags">
                        {post.tags.map((t) => <span key={t} className="tag">#{t}</span>)}
                      </div>
                    )}
                    <div className="post-actions">
                      <button className={`post-action-btn ${liked ? "liked" : ""}`} onClick={() => handleLike(post._id)}>
                        {liked ? "❤️" : "🤍"} {post.likes?.length || 0}
                      </button>
                      <button className="post-action-btn" onClick={() => setExpanded((e) => ({ ...e, [post._id]: !e[post._id] }))}>
                        💬 {post.comments?.length || 0}
                      </button>
                      <button className="post-action-btn" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}>
                        🔗 Share
                      </button>
                    </div>
                    {showComments && (
                      <div>
                        {post.comments?.map((c, i) => (
                          <div key={i} className="comment">
                            <div className="avatar avatar-sm">{c.author?.avatar ? <img src={c.author.avatar} alt="" /> : c.author?.fullName?.[0]}</div>
                            <div>
                              <strong>{c.author?.fullName}</strong>
                              <div style={{ color: "var(--text2)" }}>{c.text}</div>
                            </div>
                          </div>
                        ))}
                        <div className="comment-input-row">
                          <div className="avatar avatar-sm">{user?.fullName?.[0]}</div>
                          <input placeholder="Write a comment..." value={commentText[post._id] || ""}
                            onChange={(e) => setCommentText((p) => ({ ...p, [post._id]: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && handleComment(post._id)} />
                          <button className="btn btn-primary btn-sm" onClick={() => handleComment(post._id)}>Send</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {hasMore && !loading && (
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <button className="btn btn-outline" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div style={{ width: 280 }}>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="section-title" style={{ marginBottom: 12 }}>🔥 Trending Tags</div>
              <div className="tags">
                {["#placement", "#coding", "#internship", "#machinelearning", "#webdev", "#dsa", "#startup", "#react"].map((t) => (
                  <span key={t} className="tag" style={{ cursor: "default" }}>{t}</span>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="section-title" style={{ marginBottom: 12 }}>💡 Tips</div>
              <ul style={{ color: "var(--text3)", fontSize: 13, lineHeight: 1.8, paddingLeft: 16 }}>
                <li>Share your achievements</li>
                <li>Tag your posts by type</li>
                <li>Connect with alumni mentors</li>
                <li>Use AI tools for prep</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
