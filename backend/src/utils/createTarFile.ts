import {create} from 'tar';
import * as fs from 'fs/promises';
import * as path from 'path';
import { filePathsType } from '../types/utilsTypes';

export const createTarFile = async (files: {name: string; content: string}[]): Promise<Buffer> => {
    const tempDir: string = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true});

    const filePaths: filePathsType[] = files.map(file => ({
        fullPath: path.join(tempDir, file.name),
        content: file.content,
    }));

    await Promise.all(filePaths.map(file => fs.writeFile(file.fullPath, file.content)));
    
    const tarFilePath: string = path.join(tempDir, 'temp-api-code.tar.gz');
    await create(
        {
            gzip: true,
            file: tarFilePath,
            cwd: tempDir,
        },
        files.map(file => file.name)
    );

    const tarBuffer = await fs.readFile(tarFilePath);
    await Promise.all(filePaths.map(file => fs.unlink(file.fullPath)));
    await fs.unlink(tarFilePath);
    await fs.rmdir(tempDir);
    return tarBuffer;
};