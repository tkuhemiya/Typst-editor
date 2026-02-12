import { useEffect, useState } from "react";
import TypstView from "./components/TypstView";
import SyncedEditor from "./components/SyncedEditor";

export function App() {
  const [content, setContent] = useState<string>("");
  const [userCount, setUserCount] = useState<number>(1);
  const [roomId, setRoomId] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let id = params.get("room");
    if (!id) {
      id = crypto.randomUUID();
      window.history.replaceState(null, "", `?room=${id}`);
    }
    setRoomId(id);
  }, []);

  return (
    <div className="flex flex-col h-screen m-0">
      <div className="flex flex-1 overflow-hidden">
        {roomId ? (
          <SyncedEditor
            roomId={roomId}
            setContent={setContent}
            setUserCount={setUserCount}
          />
        ) : (
          <div>Initializing Room...</div>
        )}
        <TypstView content={content} />
      </div>
    </div>
  );
}

export default App;
