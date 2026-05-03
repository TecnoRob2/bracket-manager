import { BaseDirectory, readTextFile, writeTextFile, readDir } from '@tauri-apps/plugin-fs';
import { ensureDirectory, getRelativePath } from '../core/filesystem';
import { appDataDir } from '@tauri-apps/api/path';
import { tournamentStore } from '../store/tournamentStore';


export const draftService = {
    exportSeedingDraft: async (dirPath, seedingData) => {

        const unixTimestamp = Math.floor(Date.now() / 1000);
        const relativeDirPath = await getRelativePath(dirPath);
        await ensureDirectory(relativeDirPath) 


        const filePath = `${relativeDirPath}/${unixTimestamp}.json`;

        try {
            await writeTextFile(filePath, JSON.stringify(seedingData, null, 2), {
            baseDir: BaseDirectory.AppData,
            });
            console.log('Archivo de seeding exportado exitosamente:', filePath);
            return { success: true, filePath, error: null };
        } catch (error) {
            console.error('Error al exportar el archivo de seeding:', error);
            return { success: false, filePath, error: error.message };
        }
    },

    importSeedingDraft: async (filePath) => {
        try {
            const fileContent = await readTextFile(filePath, {
            baseDir: BaseDirectory.AppData,
            });
            const seedingData = JSON.parse(fileContent);
            console.log('Archivo de seeding importado exitosamente:', filePath);
            return { success: true, seedingData, error: null };
        } catch (error) {
            console.error('Error al importar el archivo de seeding:', error);
            return { success: false, seedingData: null, error: error.message };
        }
    },

    listSeedingDrafts: async (dirPath) => {
        try {
            const { setDrafts } = tournamentStore.getState();

            const appDir = await appDataDir();
            const relativeDirPath = await getRelativePath(dirPath);
            
            console.log('Listando borradores en el directorio:', relativeDirPath);
            if (!relativeDirPath) {
                throw new Error('No se recibio una ruta valida para listar borradores');
            }

            await ensureDirectory(relativeDirPath); // Asegura que el directorio exista antes de intentar leerlo


            const entries = await readDir(relativeDirPath, {
                baseDir: BaseDirectory.AppData,
            });
            const seedingFiles = await Promise.all(
                entries
                    .filter(entry => entry.isFile && entry.name.endsWith('.json'))
                    .map(async (entry) => {
                        try {
                            return {
                                name: entry.name,
                            };
                        } catch (error) {
                            console.error(`Error al leer el archivo ${entry.name}:`, error);
                            return null;
                        }
                    })
            );

            const validSeedingFiles = seedingFiles.filter(file => file !== null);
            console.log('Archivos de seeding listados exitosamente:', validSeedingFiles);
            console.log('Actualizando el store con los borradores listados...');
            setDrafts(validSeedingFiles);

            return { success: true, drafts: validSeedingFiles, error: null };
        } catch (error) {
            console.error('Error al listar los archivos de seeding:', error);
            return { success: false, drafts: [], error: error.message };
        }
    },
}