// controllers/dockerController.ts
import { Request, Response } from 'express';
import { exec, spawn } from 'child_process';
import ContainerModel from '../db/containerModel';
import allowedCommands from '../../allowedCommands.json';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedSocket } from '../sockets/socketServer';

// ==========================
// Run a container from the stored tar
// ==========================
export const runContainer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { apiCodeName } = req.body;

    if (!apiCodeName) {
      res.status(400).json({ message: 'Missing required fields.' });
      return;
    }

    // Find container in DB
    const container = await ContainerModel.findOne({ sanitizedName: apiCodeName });
    if (!container) {
      res.status(404).json({ message: 'Container not found.' });
      return;
    }

    // Create temp dir and save tar
    const tempDir = path.join(os.tmpdir(), `container-${uuidv4()}`);
    fs.mkdirSync(tempDir);
    const tarPath = path.join(tempDir, 'container.tar');
    fs.writeFileSync(tarPath, container.tarData);

    // Extract tar file
    const extractCmd = `tar -xf ${tarPath} -C ${tempDir}`;
    exec(extractCmd, (err) => {
      if (err) {
        console.error('Tar extraction failed:', err);
        res.status(500).json({ message: 'Failed to extract container files.' });
        return;
      }

      // Check for Dockerfile existence
      const dockerfilePath = path.join(tempDir, 'Dockerfile');
      if (!fs.existsSync(dockerfilePath)) {
        res.status(400).json({ message: 'Dockerfile not found in tar archive.' });
        return;
      }

      // Read Dockerfile and find exposed port
      const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf-8');
      const exposeMatch = dockerfileContent.match(/EXPOSE\s+(\d+)/i);
      const exposedPort = exposeMatch ? exposeMatch[1] : null;

      if (!exposedPort) {
        res.status(400).json({ message: 'EXPOSE command not found in Dockerfile.' });
        return;
      }

      // Build docker image
      const imageTag = `${apiCodeName}:latest`;
      const containerName = `${apiCodeName}`;
      const dockerBuildCmd = `docker build -t ${imageTag} ${tempDir}`;
      exec(dockerBuildCmd, (err, stdout, stderr) => {
        if (err) {
          console.error('Docker build failed:', err);
          res.status(500).json({ message: 'Docker build failed.', error: stderr });
          return;
        }

        // Remove old container if exists, then run new
        const removeExistingCmd = `docker rm -f ${containerName}`;
        exec(removeExistingCmd, () => {
          const dockerRunCmd = `docker run -d -p ${exposedPort}:${exposedPort} --name ${containerName} ${imageTag}`;
          exec(dockerRunCmd, (err, stdout, stderr) => {
            if (err) {
              console.error('Docker run failed:', err);
              res.status(500).json({ message: 'Docker run failed.', forceStop: true });
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

// ==========================
// Stop a running container
// ==========================
export const stopContainer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { apiCodeName} = req.body;

    if (!apiCodeName) {
      res.status(400).json({ message: 'Missing required fields.' });
      return;
    }

    const containerName = `${apiCodeName}`;

    // Check if container is running
    const checkCmd = `docker ps -q --filter name=^/${containerName}$`;
    exec(checkCmd, (err, stdout) => {
      if (err || !stdout.trim()) {
        res.status(404).json({ message: 'Running container not found.' });
        return;
      }

      // Stop the container
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

// ==========================
// Get logs from a container
// ==========================
export const getContainerLogs = (req: Request, res: Response): void => {
  const { apiCodeName} = req.body;
  const containerName = `${apiCodeName}`;

  // Get list of all containers
  exec(`docker ps -a --format "{{.Names}}"`, (err, stdout) => {
    if (err) {
      return res.status(500).json({ message: 'Docker is not available' });
    }

    const containers = stdout.split('\n').filter(Boolean);
    if (!containers.includes(containerName)) {
      return res.status(404).json({ message: `Container "${containerName}" not found.` });
    }

    // Fetch container logs
    exec(`docker logs ${containerName}`, (logErr, stdout, stderr) => {
      if (logErr) {
        return res.status(500).json({ message: 'Failed to retrieve logs.' });
      }

      res.status(200).json({ logs: stdout || stderr });
    });
  });
};

// ==========================
// Execute a command inside a container
// ==========================
export const executeInContainer = async (req: Request, res: Response): Promise<void> => {
  const { apiCodeName, command } = req.body;

  // Validate input
  if (!apiCodeName || !command) {
    res.status(400).json({ message: 'Missing required fields: apiCodeName, version, or command.' });
    return;
  }

  const trimmedCommand = command.trim();
  if (!trimmedCommand) {
    res.status(400).json({ message: 'Command is empty.' });
    return;
  }

  // Validate that command is allowed
  const commandParts = trimmedCommand
    .split(/[\|\;&]+/) 
    .map((part: string) => part.trim().split(' ')[0]) 
    .filter((word: string) => Boolean(word)); 

    const allAllowed = commandParts.every((cmd: string) => allowedCommands.includes(cmd));

  if (!allAllowed) {
    res.status(403).json({ message: `One or more commands are not allowed.` });
    return;
  }

  try {
    const container = await ContainerModel.findOne({ sanitizedName: apiCodeName});
    if (!container) {
      res.status(404).json({ message: 'Container not found.' });
      return;
    }

    const containerName = `${apiCodeName}`;

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

// ==========================
// Stream live container logs via WebSocket
// ==========================
export const startLogStreaming = (socket: AuthenticatedSocket, containerName: string) => {
  console.log(`Starting log stream for container: ${containerName}`);

  // Send old logs first
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

  // Stream stdout logs
  logProcess.stdout.on('data', (data) => {
    socket.emit('containerLogs', { logs: data.toString() });
  });

  // Stream stderr logs (errors)
  logProcess.stderr.on('data', (data) => {
    console.error('Error streaming logs:', data.toString());
    socket.emit('containerLogs', { logs: data.toString() });
  });

  // When container stops
  logProcess.on('close', (code) => {
    console.log(`Stopped streaming logs for container: ${containerName}`);
    socket.emit('containerStopped', { containerName });
  });

  // Cleanup if socket disconnects
  socket.on('disconnect', () => {
    console.log('Socket disconnected, stopping log stream');
    logProcess.kill();
  });
};