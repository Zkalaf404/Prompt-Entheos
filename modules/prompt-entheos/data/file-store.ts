import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const dataDirectory = path.join(process.cwd(), ".data", "prompt-entheos");
const writeQueue = new Map<string, Promise<void>>();

async function ensureDataDirectory(): Promise<void> {
  await mkdir(dataDirectory, { recursive: true });
}

function resolveDataPath(fileName: string): string {
  return path.join(dataDirectory, fileName);
}

export async function readJsonFile<T>(fileName: string, fallback: T): Promise<T> {
  await ensureDataDirectory();

  try {
    const content = await readFile(resolveDataPath(fileName), "utf8");
    return JSON.parse(content) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await writeJsonFile(fileName, fallback);
      return fallback;
    }

    throw error;
  }
}

export async function writeJsonFile<T>(fileName: string, value: T): Promise<void> {
  await ensureDataDirectory();

  const targetPath = resolveDataPath(fileName);
  const tempPath = `${targetPath}.tmp`;
  const currentWrite = writeQueue.get(fileName) ?? Promise.resolve();

  const nextWrite = currentWrite.then(async () => {
    const content = `${JSON.stringify(value, null, 2)}\n`;
    await writeFile(tempPath, content, "utf8");
    await rename(tempPath, targetPath);
  });

  writeQueue.set(fileName, nextWrite.catch(() => undefined));
  await nextWrite;
}
