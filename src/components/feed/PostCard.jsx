import CommentSection from "./CommentSection";

function PostCard({ post, onDelete, onLike, onComment, isTrending }) {
  return (
    <div className="feed-card">
      {isTrending && <span className="trending">🔥 Trending</span>}

      <h4>{post.author}</h4>
      <p>{post.content}</p>

      <div className="hashtags">
        {post.hashtags.map((tag, i) => (
          <span key={i}>{tag}</span>
        ))}
      </div>

      <div className="feed-actions">
        <button onClick={() => onLike(post.id)}>❤️ {post.likes}</button>
        <button onClick={() => onDelete(post.id)}>🗑 Delete</button>
      </div>

      <CommentSection
        comments={post.comments}
        onAdd={(text) => onComment(post.id, text)}
      />
    </div>
  );
}

export default PostCard;
