import { useEffect, useRef, type RefObject } from "react";
import { useTypst } from "@/hooks/use-typst";
import { getSavedFiles } from "@/utils";

interface TypstViewProps {
  content: string;
}

const TypstView = ({ content }: TypstViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isCompiling = useRef(false);
  const { compilerRef, rendererRef } = useTypst(containerRef);

  useEffect(() => {
    const run = async () => {
      if (!compilerRef.current || !rendererRef.current || isCompiling.current) {
        return;
      }

      isCompiling.current = true;
      const compiler = compilerRef.current;
      const renderer = rendererRef.current;

      try {
        // const files = yDoc.current.getMap<Uint8Array>("files");
        // files.forEach((data, filename) => {
        //   compiler.mapShadow(`/${filename}`, data);
        // });
        const files = await getSavedFiles();
        Object.entries(files).forEach(([filename, data]) => {
          compiler.mapShadow(`/${filename}`, data as Uint8Array);
        });
        compiler.addSource("/main.typ", content);

        const artifact = await compiler.compile({
          mainFilePath: "/main.typ",
        });

        if (!artifact) throw new Error("NO ARTIFACTS!!!");

        await renderer.renderToSvg({
          container: containerRef.current!,
          artifactContent: artifact.result!,
          format: "vector",
        });
      } catch (e) {
        console.error(e);
      } finally {
        await compiler.reset();
        // compiler.resetShadow();
        isCompiling.current = false;
      }
    };

    const timer = setTimeout(run, 300);
    return () => clearTimeout(timer);
  }, [content]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "50%",
        height: "100%",
        padding: "0px",
        overflow: "auto",
      }}
    ></div>
  );
};

export default TypstView;
