import { useState, useMemo } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import "./Feed.css";

function Feed() {
  const samplePosts = [
    {
      id: 1,
      author: "Aarav Mehta",
      role: "2018 • Google",
      avatar: "https://i.pravatar.cc/150?img=1",
      content: "Excited to join Google as SDE! #career #google",
      likes: 356,
      comments: 24,
      shares: 12,
      time: "2h",
      image: null,
    },
    {
      id: 2,
      author: "Sofia Khan",
      role: "2019 • Microsoft",
      avatar: "https://i.pravatar.cc/150?img=5",
      content: "Looking for Frontend Developer role. #job #hiring",
      likes: 198,
      comments: 12,
      shares: 8,
      time: "5h",
      image: "https://source.unsplash.com/600x400/?office",
    },
    {
      id: 3,
      author: "Liam Johnson",
      role: "2017 • Amazon",
      avatar: "https://i.pravatar.cc/150?img=12",
      content: "Remote work changed alumni networking forever.",
      likes: 521,
      comments: 47,
      shares: 18,
      time: "8h",
      image: null,
    },
    {
      id: 4,
      author: "Olivia Martin",
      role: "2016 • Startup Founder",
      avatar: "https://i.pravatar.cc/150?img=18",
      content: "Hiring React Developers! DM me.",
      likes: 742,
      comments: 89,
      shares: 33,
      time: "1d",
      image: "https://source.unsplash.com/600x400/?startup",
    },
  ];

  const [posts, setPosts] = useState(samplePosts);

  const sortedPosts = useMemo(() => {
    return [...posts].sort(
      (a, b) => b.likes + b.comments * 2 - (a.likes + a.comments * 2),
    );
  }, [posts]);

  const suggestions = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    name: `User ${i + 1}`,
    avatar: `https://i.pravatar.cc/150?img=${i + 10}`,
  }));

  return (
    <div className="feed-layout">
      <Sidebar />

      <div className="feed-container">
        <Topbar />

        {/* STORY BAR */}
        <div className="story-bar">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="story">
              <img src={`https://i.pravatar.cc/150?img=${i + 20}`} />
              <span>User{i + 1}</span>
            </div>
          ))}
        </div>

        <div className="feed-grid">
          {/* LEFT PANEL */}
          <div className="left-panel">
            <h3>Categories</h3>
            {["Career", "Tech", "Startup", "Events", "Internships"].map(
              (cat) => (
                <div key={cat} className="category">
                  {cat}
                </div>
              ),
            )}
          </div>

          {/* MAIN FEED */}
          <div className="main-feed">
            {sortedPosts.map((post, index) => (
              <div key={post.id} className="post-card">
                {index === 0 && <span className="trending">🔥 Trending</span>}

                <div className="post-header">
                  <img src={post.avatar} className="avatar" />
                  <div>
                    <h4>{post.author}</h4>
                    <span className="role">{post.role}</span>
                  </div>
                  <span className="time">{post.time}</span>
                </div>

                <p className="content">{post.content}</p>

                {post.image && <img src={post.image} className="post-image" />}

                <div className="divider"></div>

                <div className="post-stats">
                  <span>{post.likes} Likes</span>
                  <span>{post.comments} Comments</span>
                  <span>{post.shares} Shares</span>
                </div>

                <div className="post-actions">
                  <button>Like</button>
                  <button>Comment</button>
                  <button>Share</button>
                  <button>Save</button>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT PANEL */}
          <div className="right-panel">
            <h3>Suggestions</h3>

            {suggestions.map((user) => (
              <div key={user.id} className="suggestion">
                <img src={user.avatar} className="avatar small" />
                <span>{user.name}</span>
                <button className="follow-btn">Follow</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Feed;
