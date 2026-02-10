import Editor from '@monaco-editor/react';
import { useEffect, useState } from 'react';
import { $typst } from '@myriaddreamin/typst.ts/dist/esm/contrib/snippet.mjs';

export function App() {
    const [isReady, setIsReady] = useState(false);
    const [editorInput, setEditorInput] = useState<string>("= Hello World");
    const [svgOutput, setSvgOutput] = useState<string>("");

    useEffect(() => {
        const init = async () => {
            $typst.setCompilerInitOptions({
                getModule: () => '/typst_ts_web_compiler_bg.wasm',
            });
            $typst.setRendererInitOptions({
                getModule: () => '/typst_ts_renderer_bg.wasm',
            });

            try {
                await $typst.svg({ mainContent: "= Hello" });
                setIsReady(true);
            } catch (e) {
                console.error("compiler error", e);
            }
        };
        init();
    }, []);

    useEffect(() => {
        const run = async () => {
            if (!isReady || !editorInput) return;
            try {
                const svg = await $typst.svg({ 
                    mainContent: editorInput 
                });
                setSvgOutput(svg);
            } catch (e) {
                console.error("render error", e);
            }
        };

        const timer = setTimeout(run, 300);
        return () => clearTimeout(timer);
    }, [editorInput, isReady]);

    return (
        <div style={{ display: 'flex', height: '100vh'}}>
            <Editor 
                height="100%" 
                width="50%"
                defaultLanguage="markdown"
                value={editorInput} 
                onChange={(val) => setEditorInput(val || "")}
            />
             {!isReady ? "Loading..." : (
                <div dangerouslySetInnerHTML={{ __html: svgOutput }} />
             )}
        </div>
    );
}

export default App;
