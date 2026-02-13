import { get, set } from "idb-keyval";

export const setImageFile = async (filename: string, data: Uint8Array) => {
  set(`img:${filename}`, data);
  const names: Set<string> = (await get(`registry:img`)) || new Set();
  names.add(filename);
  set("registry:img", names);
};

export const getImagesNames = async (): Promise<string[]> => {
  const names: Set<string> = (await get("registry:img")) || new Set();
  return Array.from(names);
};

export const getImagesFiles = async (): Promise<Record<string, Uint8Array>> => {
  const names = await getImagesNames();
  const result: Record<string, Uint8Array> = {};

  await Promise.all(
    names.map(async (name) => {
      const data = await get(`img:${name}`);
      if (data) result[name] = data;
    })
  );

  return result;
};

export const setTypstFile = async (filename: string, data: string) => {
  await set(`typst:${filename}`, data);
  const names: Set<string> = (await get(`registry:typst`)) || new Set();
  names.add(filename);
  await set("registry:typst", names);
};

export const getTypstFile = async (
  filename: string
): Promise<string | undefined> => {
  return await get(`typst:${filename}`);
};

export const getTypstNames = async (): Promise<string[]> => {
  const names: Set<string> = (await get(`registry:typst`)) || new Set();
  return Array.from(names);
};

export const getAllTypstFiles = async (): Promise<Record<string, string>> => {
  const names = await getTypstNames();
  const result: Record<string, string> = {};

  await Promise.all(
    names.map(async (name) => {
      const data = await get(`typst:${name}`);
      if (data) result[name] = data;
    })
  );

  return result;
};
