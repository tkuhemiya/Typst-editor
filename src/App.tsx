import Editor from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { $typst } from "@myriaddreamin/typst.ts/dist/esm/contrib/snippet.mjs";
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

  const [isReady, setIsReady] = useState(false);

  const [editorInput, setEditorInput] = useState<string>(startingText);
  const [images, setImages] = useState<Record<string, Uint8Array>>({});
  const [output, setOutput] = useState<Uint8Array | undefined>();

  const isRenderingRef = useRef(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);

    setImages((prev) => ({ ...prev, [file.name]: data }));

    console.log(`uploaded ${file.name}`);
  };

  // Initialize
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

  // Compiler
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
        for (const [filename, data] of Object.entries(images)) {
          compiler.mapShadow(`/${filename}`, data);
        }

        // TODO: support multiple files
        compiler.addSource("/main.typ", editorInput);

        const artifact = await compiler.compile({
          mainFilePath: "/main.typ",
        });

        // ToCanvas works
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
  }, [editorInput, images, isReady]);

  return (
    <>
      <div style={{ display: "flex", height: "100vh" }}>
        <Editor
          height="100%"
          width="50%"
          theme="vs-dark"
          defaultLanguage="markdown"
          value={editorInput}
          onChange={(val) => setEditorInput(val || "")}
        />
        {/*<div
          style={{
            width: "50%",
            padding: "20px",
            overflow: "auto",
          }}
        >
          {output && <TypstDocument fill="#ffffff" artifact={output} />}
        </div>*/}
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
