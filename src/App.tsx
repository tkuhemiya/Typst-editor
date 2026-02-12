import { useEffect, useState } from "react";
import TypstView from "./components/TypstView";
import SyncedEditor from "./components/SyncedEditor";
import Sidebar from "./components/Sidebar";

export function App() {
  const [currentFile, setCurrentFile] = useState<string>("main.typ");
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
        <Sidebar currentFile={currentFile} />
        {roomId ? (
          <SyncedEditor
            roomId={roomId}
            currentFile={currentFile}
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
