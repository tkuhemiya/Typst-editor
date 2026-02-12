import { useEffect, useRef, useState } from "react";
import {
  createTypstCompiler,
  createTypstRenderer,
  createTypstFontBuilder,
} from "@myriaddreamin/typst.ts";
import type { TypstCompiler } from "@myriaddreamin/typst.ts/dist/esm/compiler";
import type { TypstRenderer } from "@myriaddreamin/typst.ts/dist/esm/renderer";

export function useTypst(containerRef: React.RefObject<HTMLDivElement | null>) {
  const compilerRef = useRef<TypstCompiler | null>(null);
  const rendererRef = useRef<TypstRenderer | null>(null);

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
    };
    init();
  }, []);

  return { compilerRef, rendererRef };
}
