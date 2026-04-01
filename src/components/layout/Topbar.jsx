import { useState } from "react";
import "./Topbar.css";
function Topbar() {
  const [show, setShow] = useState(false);

  return (
    <div className="topbar">
      <span>Welcome, Name</span>

      <div className="topbar-right">
        <div className="bell" onClick={() => setShow(!show)}>
          🔔
        </div>

        {show && (
          <div className="notification-box">
            <p>New Event Added</p>
            <p>Profile 75% Complete</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Topbar;
