import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { setSelectedContainer, setContainerInfo, setContainerLogs } from '../../store/containersSlice';
import './ManageContainers.css';
import axios from 'axios';
import { useToken, useTokenProperty } from '../../utils/decodingUtils';
import { Dispatch } from '@reduxjs/toolkit';
import { FaSpinner, FaTerminal, FaRegListAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../toastStyles.css';
import { getSocket } from '../../socket/socket';

interface ContainerData {
    sanitizedName: string;
    version: string;
    description: string;
}

export default function ManageContainers() {
  const [search, setSearch] = useState('');
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [isTimerReady, setIsTimerReady] = useState(false);
  const [showApiList, setShowApiList] = useState(false);
  const [approvedApiCodes, setApprovedApiCodes] = useState<{ name: string, description: string }[]>([]);
  const [selectedApiCode, setSelectedApiCode] = useState<string>('');
  const [version, setVersion] = useState('1.0.0');
  const [selectedTarFile, setSelectedTarFile] = useState<File | null>(null);
  const [allContainers, setAllContainers] = useState<ContainerData[]>([]);

  const [activeTab, setActiveTab] = useState<'console' | 'terminal'>('console');
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const terminalInputRef = useRef<HTMLInputElement>(null);
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  const logFeedRef = useRef<HTMLDivElement>(null);

  const accessToken = useToken('access');
  const userId = useTokenProperty('userId');

  const dispatch: Dispatch = useDispatch();
  const { selectedContainer, containers } = useSelector((state: RootState) => state.container);

  const selectedKey =
    selectedContainer &&
    `${selectedContainer.sanitizedName.trim().toLowerCase()}__${selectedContainer.version}`;

  const isRunning = selectedKey ? containers[selectedKey]?.isRunning : false;
  const logs = selectedKey ? containers[selectedKey]?.logs || [] : [];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const currentContainer = selectedKey ? containers[selectedKey] : null;
    if (selectedKey && currentContainer?.isRunning && currentContainer?.startTime) {
      setIsTimerReady(false);
      const updateTime = () => {
        const seconds = Math.floor((Date.now() - currentContainer.startTime!) / 1000);
        const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        setElapsedTime(`${hrs}:${mins}:${secs}`);
        setIsTimerReady(true);
      };
      updateTime();
      interval = setInterval(updateTime, 1000);
    } else {
      setIsTimerReady(false);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [selectedKey, containers]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !selectedContainer) return;
  
    const handleLogs = (data: { logs: string }) => {
      if (data.logs) {
        const parsedLogs = data.logs.toString().split('\n').filter(line => line.trim() !== '');
        dispatch(setContainerLogs({
          sanitizedName: selectedContainer.sanitizedName,
          version: selectedContainer.version,
          logs: [...(containers[selectedKey!]?.logs || []), ...parsedLogs]
        }));
      }
    };
  
    socket.on('containerLogs', handleLogs);
  
    return () => {
      socket.off('containerLogs', handleLogs);
    };
  }, [selectedContainer, dispatch, selectedKey, containers]);


  useEffect(() => {
    const fetchApprovedApis = async () => {
      try {
        if (!userId || !accessToken) return;
        const response = await axios.get(`http://localhost:3000/user/containers/approved-apis/${userId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        console.log("approvedApiNames:", response.data.approvedApiNames);
        setApprovedApiCodes(response.data.approvedApiNames || []);
      } catch (err) {
        console.error('Error fetching approved APIs:', err);
      }
    };
    fetchApprovedApis();
  }, [userId, accessToken]);

  const fetchAllContainers = async () => {
    try {
      if (!userId || !accessToken) return;
      const response = await axios.get(`http://localhost:3000/user/containers/admin-group/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setAllContainers(response.data.containers || []);
      console.log("ManageContainers, line 72: ", response.data.containers);
    } catch (err) {
      console.error('Error fetching containers:', err);
    }
  };

  useEffect(() => {
    fetchAllContainers();
  }, [userId, accessToken]);

  useEffect(() => {
    if (!selectedContainer) return;
  
    const currentKey = `${selectedContainer.sanitizedName.trim().toLowerCase()}__${selectedContainer.version}`;
    const currentContainer = containers[currentKey];
  
    if (!currentContainer?.isRunning) {
      setElapsedTime('00:00:00');
      setActiveTab('console');
      setIsTimerReady(false);
    }
  }, [selectedContainer, containers]);

  useEffect(() => {
    if (activeTab === 'terminal') {
      terminalInputRef.current?.focus();
      terminalContainerRef.current?.scrollTo({
        top: terminalContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [terminalOutput, activeTab]);

  useEffect(() => {
    if (logFeedRef.current) {
      logFeedRef.current.scrollTo({
        top: logFeedRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [logs]);

  const filteredContainers = allContainers.filter((c) =>
    c.sanitizedName.toLowerCase().includes(search.toLowerCase())
  );

  const handleRunStop = async () => {
    if (!selectedContainer || !accessToken) return;
  
    const endpoint = isRunning
      ? 'http://localhost:3000/user/docker/stop'
      : 'http://localhost:3000/user/docker/run';

    const normalizedName = `${selectedContainer.sanitizedName.trim().toLowerCase()}_${selectedContainer.version.replace(/\./g, '_')}`;
  
    try {
      const response = await axios.post(endpoint, {
        apiCodeName: selectedContainer.sanitizedName,
        version: selectedContainer.version,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });
  
      if (response.status === 200) {
        dispatch(
          setContainerInfo({
            sanitizedName: selectedContainer.sanitizedName,
            version: selectedContainer.version,
            data: {
              isRunning: !isRunning,
              startTime: isRunning ? null : Date.now(),
            },
          })
        );

        if (!isRunning) {
          // Clear logs only when starting a new container run
          dispatch(
            setContainerLogs({
              sanitizedName: selectedContainer.sanitizedName,
              version: selectedContainer.version,
              logs: []
            })
          );
        }

        setActiveTab('console');

        if (isRunning) {
          setIsTimerReady(false);
        } else {
          setElapsedTime('00:00:00');
          setIsTimerReady(true);

          const socket = getSocket();
          if (socket) {
            socket.emit('startLogStream', { containerName: normalizedName });
          }
        }
      } else {
        toast.error('Operation failed.');
      }
    } catch (error) {
      console.error('Error running/stopping container:', error);
      toast.error(`Failed to ${isRunning ? 'stop' : 'run'} container.`);
    }
  };

  const handleTerminalCommand = async () => {
    if (!selectedContainer || !accessToken || !terminalInput.trim()) return;
    try {
      const response = await axios.post('http://localhost:3000/user/docker/exec', {
        apiCodeName: selectedContainer.sanitizedName,
        version: selectedContainer.version,
        command: terminalInput,
      }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
  
      setTerminalOutput((prev) => [...prev, `> ${terminalInput}`, response.data.output || '']);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error executing command';
      setTerminalOutput((prev) => [...prev, `> ${terminalInput}`, errorMessage]);
    } finally {
      setTerminalInput('');
    }
  };

  const handleCreateContainer = async () => {
    if (!selectedApiCode || !selectedTarFile || !userId || !accessToken) {
      toast.warning('Please fill out all fields and select an API.');
      return;
    }

    const versionPattern = /^\d+\.\d+\.\d+$/;
    if (!versionPattern.test(version)) {
      toast.warning('Version must be in format x.x.x (e.g., 1.0.0)');
      return;
    }

    const formData = new FormData();
    formData.append('apiCodeName', selectedApiCode);
    formData.append('version', version);
    formData.append('userId', userId);
    formData.append('tarFile', selectedTarFile);

    try {
      const response = await axios.post('http://localhost:3000/user/containers/create-from-api', formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      });
      if (response.status === 201) {
        toast.success('Container created successfully.');
        setSelectedTarFile(null);
        setSelectedApiCode('');
        setVersion('1.0.0');
        fetchAllContainers();
      }
    } catch (err: any) {
        console.error('Error creating container:', err);
        if (err.response && err.response.status === 409) {
          toast.error('A container with this version already exists for this API.');
        } else {
          toast.error('Failed to create container.');
        }
    }
  };

  return (
    <div className="mc-container">
      <div className="mc-sidebar">
        <input
          type="text"
          placeholder="Search containers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mc-search-bar"
        />
        <ul className="mc-container-list">
          {filteredContainers.map((container, idx) => (
            <li
              key={idx}
              className={`mc-container-item ${selectedContainer?.sanitizedName === container.sanitizedName && selectedContainer?.version === container.version ? 'mc-active' : ''}`}
              onClick={() =>{
                const isSame =
                  selectedContainer?.sanitizedName === container.sanitizedName &&
                  selectedContainer?.version === container.version;
                dispatch(setSelectedContainer(isSame ? null : container ));
              }}
            >
              <div>{container.sanitizedName}</div>
              <div className="mc-container-version">{container.version}</div>
            </li>
          ))}
        </ul>
      </div>
      <div className="mc-details">
        {selectedContainer ? (
          <div>
            <h2 className="mc-title">{selectedContainer.sanitizedName}</h2>
            <p className="mc-description">{selectedContainer.description}</p>
            <p className="mc-version">Version: {selectedContainer.version}</p>
            <button
              className="mc-run-button"
              onClick={handleRunStop}
            >
              {isRunning ? 'Stop' : 'Run'}
            </button>
            <div className="mc-clock">
              ⏱️ {isRunning && containers[selectedKey!]?.startTime && elapsedTime === '00:00:00' ? (
                <FaSpinner className="mc-spinner" />
              ) : (
                elapsedTime
              )}
              <div className="mc-tab-bar">
                <button className={`mc-tab-button ${activeTab === 'console' ? 'active' : ''}`} onClick={() => setActiveTab('console')}><FaRegListAlt /> Console</button>
                <button className={`mc-tab-button ${activeTab === 'terminal' ? 'active' : ''}`} 
                        onClick={() => {
                          if (!isRunning) {
                            toast.warning('Must Run Container Before using Terminal');
                            return;
                          }
                          setActiveTab('terminal');
                        }}><FaTerminal /> Terminal</button>
              </div>
            </div>
            {activeTab === 'console' ? (
              <div className="mc-output-feed" ref={logFeedRef}>
                {(!logs || logs.length === 0) ? (
                  <p>// Output feed will be shown here...</p>
                ) : (
                  logs.map((line, idx) => <p key={idx}>{line}</p>)
                )}
              </div>
            ) : (
              <div className="mc-terminal-wrapper">
                <div className="mc-terminal" ref={terminalContainerRef}>
                  {terminalOutput.map((line, idx) => {
                    const isCommand = line.startsWith('> ');
                    return (
                      <p key={idx} className={isCommand ? 'mc-terminal-command' : 'mc-terminal-output'}>
                        {line}
                      </p>
                    );
                  })}
                  <input
                    className="mc-terminal-input"
                    ref={terminalInputRef}
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTerminalCommand()}
                    placeholder="$ Enter command"
                  />
                </div>
                <button className="mc-clear-terminal-button" onClick={() => setTerminalOutput([])}>
                    Clear Terminal
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mc-popup">
            <h2>Create New Container</h2>
            <button
              className="mc-toggle-api-list"
              onClick={() => setShowApiList((prev) => !prev)}
            >
              {showApiList ? 'Hide Approved APIs' : 'Show Approved APIs'}
            </button>

            {showApiList && (
              <ul className="mc-api-code-list">
                {approvedApiCodes.map((apiCode, idx) => (
                  <li key={idx} className={`mc-api-code-item ${selectedApiCode === apiCode.name ? 'mc-selected-api' : ''}`} 
                  onClick={() => setSelectedApiCode(apiCode.name)}>{apiCode.name}</li>
                ))}
              </ul>
            )}

            <label>Version</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="mc-version-input"
            />

            <label>Upload Container .tar File</label>
            <div
              className="mc-upload-zone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files.length > 0) {
                  const file = e.dataTransfer.files[0];
                  if (file.name.endsWith('.tar')) {
                    setSelectedTarFile(file);
                  } else {
                    toast.warning('Please upload a valid .tar file.');
                  }
                }
              }}
              onClick={() => document.getElementById('hidden-tar-upload')?.click()}
            >
              {selectedTarFile ? <p>{selectedTarFile.name}</p> : 
              <p>
              Drag & drop a .tar file here or click to browse<br />
              <strong>
                !!! Make sure the tar file contains the following files/folders:<br />
                <span style={{ color: '#bfa800' }}>package.json</span> file,{" "}
                <span style={{ color: '#1e3a8a' }}>Dockerfile</span>,{" "}
                <span style={{ color: 'red' }}>node_modules</span> folder
              </strong>
            </p>
              }
            </div>
            <input
              type="file"
              id="hidden-tar-upload"
              accept=".tar"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && file.name.endsWith('.tar')) {
                  setSelectedTarFile(file);
                } else {
                  toast.warning('Please upload a valid .tar file.');
                }
              }}
            />

            <div className="mc-popup-buttons">
              <button className="mc-create-button" onClick={handleCreateContainer}>Create</button>
              <button className="mc-close-popup" 
                onClick={() => {
                  setSelectedApiCode('');
                  setSelectedTarFile(null);
                  setVersion('1.0.0');
                }}>
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
