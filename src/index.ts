import index from "./index.html";

const server = Bun.serve({
  routes: {
    "/typst_ts_web_compiler_bg.wasm": Bun.file("public/typst_ts_web_compiler_bg.wasm"),
    "/typst_ts_renderer_bg.wasm": Bun.file("public/typst_ts_renderer_bg.wasm"),

    "/": index,
  },

  development: process.env.NODE_ENV !== "production",
});

console.log(`🚀 Server running at ${server.url}`);
