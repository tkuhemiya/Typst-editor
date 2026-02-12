import index from "./index.html";
import type { ServerWebSocket } from "bun";

interface ServerData {
  roomId: string;
}

const rooms = new Map<string, Set<ServerWebSocket<ServerData>>>();

const server = Bun.serve<ServerData>({
  routes: {
    "/typst_ts_web_compiler_bg.wasm": Bun.file(
      "public/typst_ts_web_compiler_bg.wasm",
    ),
    "/typst_ts_renderer_bg.wasm": Bun.file("public/typst_ts_renderer_bg.wasm"),
    "/Geist-Regular.ttf": Bun.file("public/Geist-Regular.ttf"),
    "/": index,
  },
  fetch(req, serverInstance) {
    const url = new URL(req.url);
    if (url.pathname === "/ws") {
      const roomId = url.searchParams.get("room");
      if (!roomId) return new Response("Missing room", { status: 400 });

      const upgraded = serverInstance.upgrade(req, {
        data: { roomId },
      });

      return upgraded
        ? undefined
        : new Response("Upgrade failed", { status: 500 });
    }
    return new Response("404!");
  },
  websocket: {
    open(ws) {
      const { roomId } = ws.data;
      if (!rooms.has(roomId)) rooms.set(roomId, new Set());
      rooms.get(roomId)!.add(ws);
      console.log(`Peer joined room: ${roomId}`);
    },
    message(ws, message) {
      const { roomId } = ws.data;
      const room = rooms.get(roomId);
      if (room) {
        for (const peer of room) {
          if (peer !== ws) peer.send(message);
        }
      }
    },
    close(ws) {
      const { roomId } = ws.data;
      const room = rooms.get(roomId);
      if (room) {
        room.delete(ws);
        if (room.size === 0) rooms.delete(roomId);
      }
    },
  },
  development: process.env.NODE_ENV !== "production",
});

console.log(`🚀 Server running at ${server.url}`);
