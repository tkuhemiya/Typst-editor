import { useEffect, useState } from "react";
import TypstView from "./components/TypstView";
import SyncedEditor from "./components/SyncedEditor";
import Sidebar from "./components/Sidebar";
import LocalEditor from "./components/LocalEditor";
import useUrl from "./hooks/use-url";
import { getTypstFile, setTypstFile } from "./store";

export function App() {
  const [fileBuffer, setFileBuffer] = useState<string>("");
  const [urlParams, setUrl] = useUrl();

  useEffect(() => {
    const fileName = urlParams.get("file") || "main";

    const loadFile = async () => {
      const data = await getTypstFile(fileName);

      if (data === undefined) {
        await setTypstFile(fileName, "");
      }
      setFileBuffer(data || "");
    };

    loadFile();

    return () => {};
  }, [urlParams]);

  useEffect(() => {
    // const p = urlParams.get("p");
    // console.log(p);
    // setUrl("p", "bit");
  }, []);

  return (
    <div className="flex flex-col h-screen m-0">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <LocalEditor buffer={fileBuffer} setBuffer={setFileBuffer} />
        {/*<SyncedEditor
          roomId={roomId}
          currentFile={currentFile}
          setContent={setContent}
          setUserCount={setUserCount}
        />*/}
        <TypstView buffer={fileBuffer} />
      </div>
    </div>
  );
}

export default App;
