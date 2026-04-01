import { useState } from "react";

function CommentSection({ comments, onAdd }) {
  const [text, setText] = useState("");

  return (
    <div className="comment-section">
      {comments.map((c, i) => (
        <div key={i}>💬 {c}</div>
      ))}

      <input
        placeholder="Add comment..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={() => {
          if (!text.trim()) return;
          onAdd(text);
          setText("");
        }}
      >
        Comment
      </button>
    </div>
  );
}

export default CommentSection;
