import { BaseDirectory,
  mkdir,
  writeTextFile
} from "@tauri-apps/plugin-fs";

import { appDataDir } from '@tauri-apps/api/path';


function assertSlug(slug) {
  const value = String(slug ?? "").trim();
  if (!value) {
    throw new Error("El slug es obligatorio para crear la carpeta del torneo");
  }
  return value;
}

export function getTournamentDirPath(slug) {
  return `${assertSlug(slug)}`;
}

export async function ensureDirectory(relativePath) {
  const appDir = await appDataDir();
  const fullPath = `${appDir}\\${relativePath}`;
  
  try {
    await mkdir(relativePath, {
      baseDir: BaseDirectory.AppData,
      recursive: true
    });
    console.log('Directorio asegurado:', fullPath);
    return fullPath;
  }
  catch (error) {
    console.error('Error al asegurar el directorio:', error);
    throw error;
  }
}

export async function getRelativePath(dirPath) {
  const appDir = await appDataDir();
  const relativePath = String(dirPath ?? '')
    .replace(appDir, '')
    .replace(/^[\\/]+/, '')
    .replace(/\\/g, '/');
  return relativePath;
}

export async function ensureTournamentDir() {
  const dirPath = 'tournament';
  const appDir = await appDataDir();

  await mkdir(dirPath, {
    baseDir: BaseDirectory.AppData,
    recursive: true
  });

  return `${appDir}\\${dirPath}`;
}


export async function ensureTournamentSlugDir(slug) {
  await ensureTournamentDir();

  const dirPath = getTournamentDirPath(slug);
  const appDir = await appDataDir();

  await mkdir(dirPath, {
    baseDir: BaseDirectory.AppData,
    recursive: true
  });

  // console.log('Directorio del torneo asegurado:', `${appDir}\\${dirPath}`);
  return `${appDir}\\${dirPath}`;
}