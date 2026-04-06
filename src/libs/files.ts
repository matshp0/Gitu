import { appendFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

export const readFile = async (path: string) => {
  try {
    const content = await Bun.file(path).text();
    return content;
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") {
      console.log(`File: ${path} not found`);
    } else {
      throw err;
    }
  }
};

export const appendToFile = async (path: string, content: string) => {
  await Bun.write(path, "");
  await appendFile(path, content);
};

export const expandPath = (inputPath: string): string => {
  if (inputPath.startsWith("~/")) {
    return join(homedir(), inputPath.slice(2));
  }
  return resolve(inputPath);
};

export const fileExists = async (path: string): Promise<boolean> => {
  return await Bun.file(path).exists();
};
