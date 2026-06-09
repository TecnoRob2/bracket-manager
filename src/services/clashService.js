import { clashStore } from "../store/clashStore";
import { BaseDirectory, readTextFile, writeTextFile, exists } from '@tauri-apps/plugin-fs';

export const clashService = {
    loadClasheos: async () => {
        const { setClasheos, clasheos } = clashStore.getState();
        
        if (clasheos.length > 0) {
            console.log('Clasheos ya cargados en el store, no se realizará una nueva lectura del archivo.');
            return;
        }

        try {
            const relativeFilePath = 'clasheos.json';
            const fileExists = await exists(relativeFilePath, {
                baseDir: BaseDirectory.AppData,
            });

            if (!fileExists) {
                // Si no existe, lo creamos
                await writeTextFile(relativeFilePath, JSON.stringify([]), {
                    baseDir: BaseDirectory.AppData,
                });
                console.log('Archivo clasheos.json creado');
                setClasheos([]);
                return;
            }

            const fileContent = await readTextFile(relativeFilePath, {
                baseDir: BaseDirectory.AppData,
            });
            const clasheosFile = JSON.parse(fileContent);
            setClasheos(clasheosFile);
        } catch (error) {
            console.error('Error al cargar clasheos:', error);
            setClasheos([]);
        }
    },

    saveClasheos: async (clasheosData) => {
        try {
            const relativeFilePath = 'clasheos.json';
            await writeTextFile(relativeFilePath, JSON.stringify(clasheosData, null, 2), {
                baseDir: BaseDirectory.AppData,
            });
            console.log('Clasheos guardados exitosamente en el archivo');
        } catch (error) {
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
    },

    getClasheo: async (p1_id, p2_id) => {
        const { clasheos } = clashStore.getState();
        return clasheos.find(clasheo =>
            (String(clasheo.p1_id) === String(p1_id) && String(clasheo.p2_id) === String(p2_id)) ||
            (String(clasheo.p1_id) === String(p2_id) && String(clasheo.p2_id) === String(p1_id))
        ) || null;
    },

    removeClasheo: async (p1_id, p2_id) => {
        const { clasheos, setClasheos } = clashStore.getState();
        const updatedClasheos = clasheos.filter(clasheo =>
            !((String(clasheo.p1_id) === String(p1_id) && String(clasheo.p2_id) === String(p2_id)) ||
              (String(clasheo.p1_id) === String(p2_id) && String(clasheo.p2_id) === String(p1_id)))
        );
        setClasheos(updatedClasheos);
        await clashService.saveClasheos(updatedClasheos);
    },
};