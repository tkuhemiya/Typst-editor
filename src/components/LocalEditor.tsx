import Editor, { type OnMount } from "@monaco-editor/react";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { setImageFile, setTypstFile } from "../store";
import useUrl from "@/hooks/use-url";

interface SyncedEditorProps {
  buffer: string;
  setBuffer: Dispatch<SetStateAction<string>>;
}

const LocalEditor = ({ buffer, setBuffer }: SyncedEditorProps) => {
  const editorRef = useRef<any>(null);
  const [urlParams, setUrl] = useUrl();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const onMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    if (e.clipboardData.files.length === 0) return;
    const imageFile = e.clipboardData.files[0];

    if (imageFile?.type.startsWith("image/")) {
      e.preventDefault();
      const data = new Uint8Array(await imageFile.arrayBuffer());
      const filename = imageFile.name.normalize();

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

  const handleChange = (value: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setBuffer(value);
      console.log("Saving to DB:", value);
      const filename = urlParams.get("file") || "";
      await setTypstFile(filename, value);
    }, 300);
  };

  return (
    <div className="w-1/2 h-full" onPasteCapture={handlePaste}>
      <Editor
        height="100%"
        theme="vs-dark"
        defaultLanguage="markdown"
        value={buffer}
        onChange={(value) => handleChange(value || "")}
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

export default LocalEditor;
