import { file } from "bun";
import { get, set } from "idb-keyval";

export const handleSave = async (filename: string, data: Uint8Array) => {
  const files = (await get("v1/files")) || {};
  files[filename] = data;
  await set("v1/files", files);
  console.log("saved file", filename, data);
  return filename;
};

export const getSavedFiles = async (): Promise<Map<string, Uint8Array>> => {
  const files = await get("v1/files");
  console.log("getting files", files);
  return files;
};

export const startingText = `
#let pat = tiling(size: (30pt, 30pt))[
  #place(line(start: (0%, 0%), end: (100%, 100%)))
  #place(line(start: (0%, 100%), end: (100%, 0%)))
]

#rect(fill: pat, width: 100%, height: 60pt, stroke: 1pt)
`;
