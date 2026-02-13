import Editor, { type OnMount } from "@monaco-editor/react";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  getImagesFiles,
  getTypstFile,
  setImageFile,
  setTypstFile,
} from "../store";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { MonacoBinding } from "y-monaco";

interface SyncedEditorProps {
  roomId: string;
  currentFile: string;
  setContent: Dispatch<SetStateAction<string>>;
  setUserCount: Dispatch<SetStateAction<number>>;
}

const SyncedEditor = ({
  roomId,
  currentFile,
  setContent,
  setUserCount,
}: SyncedEditorProps) => {
  const editorRef = useRef<any>(null);
  const yDocRef = useRef<Y.Doc>(new Y.Doc());
  const providerRef = useRef<WebrtcProvider | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const init = async () => {
      // setup provider
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const signalingUrl = `${protocol}//${window.location.host}/ws?room=${roomId}`;
      console.log(signalingUrl);
      const provider = new WebrtcProvider(roomId, yDocRef.current, {
        signaling: [signalingUrl],
      });
      providerRef.current = provider;

      provider.on("synced", async () => {
        const yText = yDocRef.current.getText("monaco");
        const yFiles = yDocRef.current.getMap<Uint8Array>("images");

        if (yText.length === 0) {
          const localContent = await getTypstFile(currentFile);
          if (localContent) {
            yDocRef.current.transact(() => {
              yText.insert(0, localContent);
            });
          }
        }

        if (yFiles.size > 0) {
          const currentLocalImages = await getImagesFiles();
          yFiles.forEach((data, filename) => {
            // Only write to disk if it's missing or different to save IO
            if (!currentLocalImages[filename]) {
              setImageFile(filename, data);
            }
          });
        }

        setContent(yText.toString());
      });

      // User Counter
      const updateCount = () =>
        setUserCount(provider.awareness.getStates().size);
      provider.awareness.on("change", updateCount);

      // Handle file map sync
      const yFiles = yDocRef.current.getMap<Uint8Array>("images");
      yFiles.observe(async (event) => {
        const updates: Record<string, Uint8Array> = {};
        event.keys.forEach((change, key) => {
          if (change.action === "add" || change.action === "update") {
            const data = yFiles.get(key);
            if (data) {
              console.log("setting image:", key);
              setImageFile(key, data);
            }
          }
        });
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
      providerRef.current?.awareness
    );

    // Sync editor changes
    yText.observe(() => {
      const updated = yText.toString();
      setContent(updated);

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        setTypstFile(currentFile, updated);
      }, 300);
    });
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    if (e.clipboardData.files.length === 0) return;
    const imageFile = e.clipboardData.files[0];

    if (imageFile?.type.startsWith("image/")) {
      e.preventDefault();
      const data = new Uint8Array(await imageFile.arrayBuffer());
      const filename = imageFile.name.normalize();

      yDocRef.current.getMap<Uint8Array>("images").set(filename, data);
      setImageFile(filename, data);

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
