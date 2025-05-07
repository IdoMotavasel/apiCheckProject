// controllers/dockerController.ts
import { Request, Response } from 'express';
import { exec, spawn } from 'child_process';
import ContainerModel from '../db/containerModel';
import allowedCommands from '../../allowedCommands.json';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { Socket } from 'socket.io';
import { AuthenticatedSocket } from '../sockets/socketServer';

export const runContainer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { apiCodeName, version } = req.body;

    if (!apiCodeName || !version) {
      res.status(400).json({ message: 'Missing required fields.' });
      return;
    }

    const container = await ContainerModel.findOne({ sanitizedName: apiCodeName, version });
    if (!container) {
      res.status(404).json({ message: 'Container not found.' });
      return;
    }

    const tempDir = path.join(os.tmpdir(), `container-${uuidv4()}`);
    fs.mkdirSync(tempDir);
    const tarPath = path.join(tempDir, 'container.tar');
    fs.writeFileSync(tarPath, container.tarData);

    // Extract tar
    const extractCmd = `tar -xf ${tarPath} -C ${tempDir}`;
    exec(extractCmd, (err) => {
      if (err) {
        console.error('Tar extraction failed:', err);
        res.status(500).json({ message: 'Failed to extract container files.' });
        return;
      }

      const dockerfilePath = path.join(tempDir, 'Dockerfile');
      if (!fs.existsSync(dockerfilePath)) {
        res.status(400).json({ message: 'Dockerfile not found in tar archive.' });
        return;
      }

      const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf-8');
      const exposeMatch = dockerfileContent.match(/EXPOSE\s+(\d+)/i);
      const exposedPort = exposeMatch ? exposeMatch[1] : null;

      if (!exposedPort) {
        res.status(400).json({ message: 'EXPOSE command not found in Dockerfile.' });
        return;
      }

      const imageTag = `${apiCodeName}:${version}`;
      const containerName = `${apiCodeName}_${version.replace(/\./g, '_')}`;
      const dockerBuildCmd = `docker build -t ${imageTag} ${tempDir}`;
      exec(dockerBuildCmd, (err, stdout, stderr) => {
        if (err) {
          console.error('Docker build failed:', err);
          res.status(500).json({ message: 'Docker build failed.' });
          return;
        }

        const removeExistingCmd = `docker rm -f ${containerName}`;
        exec(removeExistingCmd, () => {
            // Now run the new container
            const dockerRunCmd = `docker run -d -p ${exposedPort}:${exposedPort} --name ${containerName} ${imageTag}`;
            exec(dockerRunCmd, (err, stdout, stderr) => {
              if (err) {
                console.error('Docker run failed:', err);
                res.status(500).json({ message: 'Docker run failed.' });
                return;
              }
  
              res.status(200).json({ message: 'Container is running.', containerId: stdout.trim() });
            });
        });
      });
    });
  } catch (err) {
    console.error('Error running container:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const stopContainer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { apiCodeName, version } = req.body;

    if (!apiCodeName || !version) {
      res.status(400).json({ message: 'Missing required fields.' });
      return;
    }

    const containerName = `${apiCodeName}_${version.replace(/\./g, '_')}`;

    const checkCmd = `docker ps -q --filter name=^/${containerName}$`;
    exec(checkCmd, (err, stdout) => {
      if (err || !stdout.trim()) {
        res.status(404).json({ message: 'Running container not found.' });
        return;
      }

      const dockerStopCmd = `docker stop ${containerName}`;

      exec(dockerStopCmd, (err2) => {
        if (err2) {
          console.error('Docker stop failed:', err2);
          res.status(500).json({ message: 'Failed to stop container.' });
          return;
        }

        res.status(200).json({ message: 'Container stopped successfully.' });
      });
    });
  } catch (err) {
    console.error('Error stopping container:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getContainerLogs = (req: Request, res: Response): void => {
  const { apiCodeName, version } = req.body;

  // Normalize the container name to lowercase to match Docker behavior
  const containerName = `${apiCodeName}_${version.replace(/\./g, '_')}`;

  exec(`docker ps -a --format "{{.Names}}"`, (err, stdout) => {
    if (err) {
      return res.status(500).json({ message: 'Docker is not available' });
    }

    const containers = stdout.split('\n').filter(Boolean);
    if (!containers.includes(containerName)) {
      return res.status(404).json({ message: `Container "${containerName}" not found.` });
    }

    exec(`docker logs ${containerName}`, (logErr, stdout, stderr) => {
      if (logErr) {
        return res.status(500).json({ message: 'Failed to retrieve logs.' });
      }

      res.status(200).json({ logs: stdout || stderr });
    });
  });
};


export const executeInContainer = async (req: Request, res: Response): Promise<void> => {
  const { apiCodeName, version, command } = req.body;

  if (!apiCodeName || !version || !command) {
    res.status(400).json({ message: 'Missing required fields: apiCodeName, version, or command.' });
    return;
  }

  const trimmedCommand = command.trim();
  if (!trimmedCommand) {
    res.status(400).json({ message: 'Command is empty.' });
    return;
  }

  const commandParts = trimmedCommand
    .split(/[\|\;&]+/) // split by | or ; or &
    .map((part: string) => part.trim().split(' ')[0]) // get first word of each
    .filter((word: string) => Boolean(word)); // remove empty parts

    const allAllowed = commandParts.every((cmd: string) => allowedCommands.includes(cmd));

  if (!allAllowed) {
    res.status(403).json({ message: `One or more commands are not allowed.` });
    return;
  }

  try {
    const container = await ContainerModel.findOne({ sanitizedName: apiCodeName, version });
    if (!container) {
      res.status(404).json({ message: 'Container not found.' });
      return;
    }

    const containerName = `${apiCodeName}_${version.replace(/\./g, '_')}`;

    // Build the docker exec command
    const dockerExecCmd = `docker exec ${containerName} sh -c ${JSON.stringify(trimmedCommand)}`;

    exec(dockerExecCmd, (execErr, execStdout, execStderr) => {
      if (execErr) {
        const errorOutput = execStderr.trim() || execErr.message;
        const notFound = errorOutput.includes('not found') || errorOutput.includes('command not found');

        res.status(200).json({
          output: notFound
            ? `Command '${trimmedCommand.split(' ')[0]}' not found.`
            : errorOutput
        });
      } else {
        res.status(200).json({ output: execStdout.trim() });
      }
    });
  } catch (error) {
    console.error('Error executing command in container:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


//controllers for sockets
export const startLogStreaming = (socket: AuthenticatedSocket, containerName: string) => {
  console.log(`Starting log stream for container: ${containerName}`);

  // old logs (past logs)
  exec(`docker logs ${containerName}`, (error, stdout, stderr) => {
    if (error) {
      console.error('Error fetching old logs:', error.message);
      return;
    }

    const oldLogs = stdout || stderr;
    if (oldLogs) {
      socket.emit('containerLogs', { logs: oldLogs });
    }
  });

  // start following live logs
  const logProcess = spawn('docker', ['logs', '-f', containerName]);

  logProcess.stdout.on('data', (data) => {
    socket.emit('containerLogs', { logs: data.toString() });
  });

  logProcess.stderr.on('data', (data) => {
    console.error('Error streaming logs:', data.toString());
    socket.emit('containerLogs', { logs: data.toString() });
  });

  logProcess.on('close', (code) => {
    console.log(`Stopped streaming logs for container: ${containerName}`);
  });

  // Optional: when socket disconnects, clean up
  socket.on('disconnect', () => {
    console.log('Socket disconnected, stopping log stream');
    logProcess.kill();
  });
};