import { get, set } from "idb-keyval";

export const setImageFile = async (filename: string, data: Uint8Array) => {
  const files = (await get<Record<string, Uint8Array>>("images")) || {};
  files[filename] = data;
  await set("images", files);

  const names = (await get<string[]>("names/images")) || [];
  if (!names.includes(filename)) {
    await set("names/images", [...names, filename]);
  }
};

export const getImagesFiles = async (): Promise<Record<string, Uint8Array>> => {
  return (await get("images")) || {};
};

export const getImagesNames = async (): Promise<string[]> => {
  return (await get("names/images")) || [];
};

export const setTypstFile = async (filename: string, data: string) => {
  await set(`typst/${filename}.typ`, data);

  const names = (await get<string[]>("names/typst")) || [];
  if (!names.includes(filename)) {
    await set("names/typst", [...names, filename]);
  }
};

export const getTypstFile = async (
  filename: string
): Promise<string | undefined> => {
  return await get(`typst/${filename}.typ`);
};

export const getTypstNames = async (): Promise<string[]> => {
  return (await get("names/typst")) || [];
};
