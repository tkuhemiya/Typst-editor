import Editor, { type OnMount } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import {
  createTypstCompiler,
  createTypstRenderer,
  createTypstFontBuilder,
} from "@myriaddreamin/typst.ts";
import type { TypstCompiler } from "@myriaddreamin/typst.ts/dist/esm/compiler";
import type { TypstRenderer } from "@myriaddreamin/typst.ts/dist/esm/renderer";

export function App() {
  const compilerRef = useRef<TypstCompiler | null>(null);
  const rendererRef = useRef<TypstRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  const [isReady, setIsReady] = useState(false);
  const [editorInput, setEditorInput] = useState<string>(startingText);
  const [file, setFile] = useState<Record<string, Uint8Array>>({});
  const [output, setOutput] = useState<Uint8Array | undefined>();

  const isRenderingRef = useRef(false);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    if (e.clipboardData.files.length === 0) return;

    const imageFile = e.clipboardData.files[0];

    if (imageFile) {
      e.preventDefault(); // stop

      const buffer = await imageFile.arrayBuffer();
      const data = new Uint8Array(buffer);

      const filename = imageFile.name.normalize();

      setFile((prev) => ({ ...prev, [filename]: data }));

      const editor = editorRef.current;
      if (editor) {
        const position = editor.getPosition();
        const selection = editor.getSelection();

        editor.executeEdits("paste-image", [
          {
            range: {
              startLineNumber: selection.startLineNumber,
              startColumn: selection.startColumn,
              endLineNumber: selection.endLineNumber,
              endColumn: selection.endColumn,
            },
            text: `#image("${filename}")`,
            forceMoveMarkers: true,
          },
        ]);
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      const fontBuilder = createTypstFontBuilder();
      await fontBuilder.init({
        getModule: () => "/typst_ts_web_compiler_bg.wasm",
      });
      const fontRes = await fetch("/Geist-Regular.ttf");
      const fontBuffer = new Uint8Array(await fontRes.arrayBuffer());
      await fontBuilder.addFontData(fontBuffer);

      const compiler = createTypstCompiler();
      const renderer = createTypstRenderer();

      await Promise.all([
        compiler.init({ getModule: () => "/typst_ts_web_compiler_bg.wasm" }),
        renderer.init({ getModule: () => "/typst_ts_renderer_bg.wasm" }),
      ]);

      await fontBuilder.build(async (resolver) => {
        await compiler.setFonts(resolver);
        await renderer.loadGlyphPack(resolver);
      });

      compilerRef.current = compiler;
      rendererRef.current = renderer;
      setIsReady(true);
    };
    init();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (
        !compilerRef.current ||
        !rendererRef.current ||
        isRenderingRef.current ||
        !isReady
      )
        return;

      const compiler = compilerRef.current;
      const renderer = rendererRef.current;
      isRenderingRef.current = true;

      try {
        for (const [filename, data] of Object.entries(file)) {
          compiler.mapShadow(`/${filename}`, data);
        }

        compiler.addSource("/main.typ", editorInput);

        const artifact = await compiler.compile({ mainFilePath: "/main.typ" });
        await renderer.renderToSvg({
          container: containerRef.current!,
          artifactContent: artifact.result!,
          format: "vector",
        });
        setOutput(artifact.result);
      } catch (e) {
        console.error(e);
      } finally {
        compiler.reset();
        compiler.resetShadow();
        isRenderingRef.current = false;
      }
    };

    const timer = setTimeout(run, 300);
    return () => clearTimeout(timer);
  }, [editorInput, file, isReady]);

  return (
    <>
      <div style={{ display: "flex", height: "100vh" }}>
        <div
          style={{ width: "50%", height: "100%" }}
          onPasteCapture={handlePaste}
        >
          <Editor
            height="100%"
            width="100%"
            theme="vs-dark"
            defaultLanguage="markdown"
            onMount={handleEditorMount}
            value={editorInput}
            onChange={(val) => setEditorInput(val || "")}
          />
        </div>

        <div
          ref={containerRef}
          style={{
            width: "50%",
            height: "100%",
            padding: "0px",
            overflow: "auto",
          }}
        ></div>
      </div>
    </>
  );
}

export default App;

const startingText = `
#let pat = tiling(size: (30pt, 30pt))[
  #place(line(start: (0%, 0%), end: (100%, 100%)))
  #place(line(start: (0%, 100%), end: (100%, 0%)))
]

#rect(fill: pat, width: 100%, height: 60pt, stroke: 1pt)
`;
