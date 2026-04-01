import { useState } from "react";

function CreatePost({ onPost }) {
  const [text, setText] = useState("");

  const handlePost = () => {
    if (!text.trim()) return;
    onPost(text);
    setText("");
  };

  return (
    <div className="create-post">
      <textarea
        placeholder="Share something... use #hashtags"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={handlePost}>Post</button>
    </div>
  );
}

export default CreatePost;
