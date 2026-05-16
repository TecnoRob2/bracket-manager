import { clashStore } from "../store/clashStore";
import { BaseDirectory, readTextFile, writeTextFile, readDir } from '@tauri-apps/plugin-fs';
import { ensureFile, getRelativePath } from '../core/filesystem';
import { appDataDir } from '@tauri-apps/api/path';
import { add } from "@dnd-kit/utilities";

export const clashService = {
    loadClasheos: async () => {
        const { setClasheos, clasheos } = clashStore.getState();
        await ensureFile('clasheos.json', JSON.stringify([]));

        if (clasheos.length > 0) {
            console.log('Clasheos ya cargados en el store, no se realizará una nueva lectura del archivo.');
            return; // Si ya hay clasheos cargados en el store, no hacemos nada
        }
        const appDir = await appDataDir();
        const relativeFilePath = await getRelativePath('clasheos.json');
        const fileContent = await readTextFile(relativeFilePath, {
            baseDir: BaseDirectory.AppData,
        });
        const clasheosFile = JSON.parse(fileContent);
        setClasheos(clasheosFile);
    },

    saveClasheos: async (clasheos) => {
        const appDir = await appDataDir();
        const relativeFilePath = await getRelativePath('clasheos.json');
        try {
            await writeTextFile(relativeFilePath, JSON.stringify(clasheos, null, 2), {
                baseDir: BaseDirectory.AppData,
            });
            console.log('Clasheos guardados exitosamente en el archivo:', relativeFilePath);
        }
        catch (error) {
            console.error('Error al guardar los clasheos en el archivo:', error);
            throw error;
        }
    },

    addClasheo: async (clasheo) => {
        const { clasheos, setClasheos } = clashStore.getState();
        const updatedClasheos = [...clasheos, clasheo];
        setClasheos(updatedClasheos);
        await clashService.saveClasheos(updatedClasheos);
    },

    checkClasheo: async (p1_id, p2_id) => {
        const { clasheos } = clashStore.getState();
        return clasheos.some(clasheo =>
            (clasheo.p1_id === p1_id && clasheo.p2_id === p2_id) ||
            (clasheo.p1_id === p2_id && clasheo.p2_id === p1_id)
        );
    }
}