import Editor, { type OnMount } from "@monaco-editor/react";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { getSavedFiles, handleSave } from "../utils";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { MonacoBinding } from "y-monaco";

interface SyncedEditorProps {
  roomId: string;
  setContent: Dispatch<SetStateAction<string>>;
  setUserCount: Dispatch<SetStateAction<number>>;
}

const SyncedEditor = ({
  roomId,
  setContent,
  setUserCount,
}: SyncedEditorProps) => {
  const editorRef = useRef<any>(null);
  const yDocRef = useRef<Y.Doc>(new Y.Doc());
  const providerRef = useRef<WebrtcProvider | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const init = async () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const signalingUrl = `${protocol}//${window.location.host}/ws?room=${roomId}`;
      console.log(signalingUrl);
      const provider = new WebrtcProvider(roomId, yDocRef.current, {
        signaling: [signalingUrl],
      });
      providerRef.current = provider;

      provider.on("synced", () => {
        const yText = yDocRef.current.getText("monaco");
        if (yText.length === 0) {
          console.log("no file");
          const localContent = localStorage.getItem("v1/main.typ") || "";
          if (localContent) {
            yDocRef.current.transact(() => {
              yText.insert(0, localContent);
            });
          }
        }
        setContent(yText.toString());
      });

      // User Counter
      const updateCount = () =>
        setUserCount(provider.awareness.getStates().size);
      provider.awareness.on("change", updateCount);

      // Handle file map sync
      const yFiles = yDocRef.current.getMap<Uint8Array>("files");
      yFiles.observe(async (event) => {
        const updates: Record<string, Uint8Array> = {};
        event.keys.forEach((change, key) => {
          if (change.action === "add" || change.action === "update") {
            const data = yFiles.get(key);
            if (data) updates[key] = data;
          }
        });

        try {
          const savedFiles = await getSavedFiles();
          Object.assign(savedFiles, updates);
          savedFiles.forEach((data, filename) => handleSave(filename, data));
        } catch (err) {
          console.error("Sync error:", err);
        }
      });
    };

    init();

    return () => {
      providerRef.current?.destroy();
      yDocRef.current.destroy();
    };
  }, []);

  const onMount: OnMount = (editor) => {
    editorRef.current = editor;
    const yText = yDocRef.current.getText("monaco");

    // Bind Monaco to Yjs
    new MonacoBinding(
      yText,
      editor.getModel()!,
      new Set([editor]),
      providerRef.current?.awareness,
    );

    // Sync editor changes
    yText.observe(() => {
      const updated = yText.toString();
      setContent(updated);
      localStorage.setItem("v1/main.typ", updated);
    });
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    if (e.clipboardData.files.length === 0) return;
    const imageFile = e.clipboardData.files[0];

    if (imageFile?.type.startsWith("image/")) {
      e.preventDefault();
      const data = new Uint8Array(await imageFile.arrayBuffer());
      const filename = imageFile.name.normalize();

      yDocRef.current.getMap<Uint8Array>("files").set(filename, data);
      handleSave(filename, data);

      const selection = editorRef.current.getSelection();
      editorRef.current.executeEdits("paste-image", [
        {
          range: selection,
          text: `#image("${filename}")`,
          forceMoveMarkers: true,
        },
      ]);
    }
  };

  return (
    <div className="w-1/2 h-full" onPasteCapture={handlePaste}>
      <Editor
        height="100%"
        theme="vs-dark"
        defaultLanguage="markdown"
        onMount={onMount}
        options={{
          minimap: { enabled: false },
          automaticLayout: true,
          wordWrap: "on",
        }}
      />
    </div>
  );
};

export default SyncedEditor;
