import Editor, { DiffEditor, useMonaco, loader } from '@monaco-editor/react';
import { useEffect, useState } from 'react';
import { TypstCompiler } from '@myriaddreamin/typst-ts-web-compiler';
import { $typst } from '@myriaddreamin/typst.ts';



export function App() {
    const [compiler, setCompiler] = useState<TypstCompiler | null>(null);
    const [editorInput, setEditorInput] = useState<string | undefined>()

    useEffect(() => {
        if (!editorInput) return
        const out = $typst.svg({
            mainContent: editorInput
        })
        console.log(out)
    }, [editorInput])

  return (
      <div>
          <Editor height="100vh" defaultLanguage="javascript" defaultValue="" onChange={(value) => setEditorInput(value) } />
      </div>
  );
}

export default App;
