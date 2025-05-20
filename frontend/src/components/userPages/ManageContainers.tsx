import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { setSelectedContainer, setContainerInfo, setContainerLogs } from '../../store/containersSlice';
import './ManageContainers.css';
import axios from 'axios';
import { useToken, useTokenProperty } from '../../utils/decodingUtils';
import { Dispatch } from '@reduxjs/toolkit';
import { FaSpinner, FaTerminal, FaRegListAlt,FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../toastStyles.css';
import { getSocket } from '../../socket/socket';
import Spinner from '../spinner/Spinner';

interface ContainerData {
    sanitizedName: string;
    description: string;
}

export default function ManageContainers() {
  const [search, setSearch] = useState('');
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [isTimerReady, setIsTimerReady] = useState(false);
  const [showApiList, setShowApiList] = useState(false);
  const [approvedApiCodes, setApprovedApiCodes] = useState<{ name: string, description: string }[]>([]);
  const [selectedApiCode, setSelectedApiCode] = useState<string>('');
  const [selectedTarFile, setSelectedTarFile] = useState<File | null>(null);
  const [allContainers, setAllContainers] = useState<ContainerData[]>([]);
  const [selectedContainerName, setSelectedContainerName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showRunPopup, setShowRunPopup] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [runPopupText, setRunPopupText] = useState("Uploading Docker Container...");

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

  const selectedKey = selectedContainer && `${selectedContainer.sanitizedName.trim().toLowerCase()}`;
  const isRunning = useSelector((state: RootState) => {
    const key = selectedContainer?.sanitizedName.trim().toLowerCase();
    return key ? state.container.containers[key]?.isRunning : false;
  });
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
          logs: [...(containers[selectedKey!]?.logs || []), ...parsedLogs]
        }));
      }
    };

    const handleContainerStopped = ({ containerName }: { containerName: string }) => {
    if (selectedContainer?.sanitizedName === containerName) {
      console.log(`Container ${containerName} stopped (from server)`);

      dispatch(setContainerInfo({
        sanitizedName: containerName,
        data: {
          isRunning: false,
          startTime: null,
        },
      }));

      setElapsedTime('00:00:00');
      setIsTimerReady(false);
      setActiveTab('console');

      toast.warning('Container stopped.');
    }
  };
  
    socket.on('containerLogs', handleLogs);
    socket.on('containerStopped', handleContainerStopped);
  
    return () => {
      socket.off('containerLogs', handleLogs);
      socket.off('containerStopped', handleContainerStopped);
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
      const containers: ContainerData[] = response.data.containers || [];
      setAllContainers(containers);
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
  
    const currentKey = `${selectedContainer.sanitizedName.trim().toLowerCase()}`;
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

  useEffect(() => {
  if (!selectedContainerName) {
    dispatch(setSelectedContainer(null));
    return;
  }

  const selected = allContainers.find(c => c.sanitizedName === selectedContainerName);
    if (selected) dispatch(setSelectedContainer(selected));
}, [selectedContainerName]);

  const filteredContainers = allContainers.filter((c) =>
    c.sanitizedName.toLowerCase().includes(search.toLowerCase())
  );

  const handleRunStop = async () => {
  if (!selectedContainer || !accessToken) return;

  setRunPopupText(isRunning  ? "Stopping Docker Container..." : "Uploading Docker Container...");
  setShowRunPopup(true);

  const endpoint = isRunning 
    ? 'http://localhost:3000/user/docker/stop'
    : 'http://localhost:3000/user/docker/run';

  const normalizedName = `${selectedContainer.sanitizedName.trim().toLowerCase()}`;

  try {
    const response = await axios.post(endpoint, {
      apiCodeName: selectedContainer.sanitizedName,
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
          data: {
            isRunning: !isRunning ,
            startTime: isRunning  ? null : Date.now(),
          },
        })
      );

      if (!isRunning) {
        dispatch(setContainerLogs({
          sanitizedName: selectedContainer.sanitizedName,
          logs: []
        }));
        setActiveTab('console');
        setElapsedTime('00:00:00');
        setIsTimerReady(true);

        const socket = getSocket();
        if (socket) {
          socket.emit('startLogStream', { containerName: normalizedName });
        }
      } else {
        setIsTimerReady(false);
      }
    } else {
      toast.error('Operation failed.');
    }
  } catch (error: any) {
    console.error('Error running/stopping container:', error);
    toast.error(`Failed to ${isRunning ? 'stop' : 'run'} container.`);


    if (!isRunning && selectedContainer) {
      dispatch(
        setContainerInfo({
          sanitizedName: selectedContainer.sanitizedName,
          data: {
            isRunning: false,
            startTime: null,
          },
        })
      );

      dispatch(setContainerLogs({
        sanitizedName: selectedContainer.sanitizedName,
        logs: [],
      }));
      setElapsedTime('00:00:00');
      setIsTimerReady(false);
      setActiveTab('console');
      }
  } finally {
    setShowRunPopup(false); // Hide popup
  }
};

  const handleTerminalCommand = async () => {
    if (!selectedContainer || !accessToken || !terminalInput.trim()) return;
    try {
      const response = await axios.post('http://localhost:3000/user/docker/exec', {
        apiCodeName: selectedContainer.sanitizedName,
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

    const formData = new FormData();
    formData.append('apiCodeName', selectedApiCode);
    formData.append('userId', userId);
    formData.append('tarFile', selectedTarFile);

    setShowCreatePopup(true);

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
        fetchAllContainers();
        setApprovedApiCodes(prev => prev.filter(api => api.name !== selectedApiCode));
      }
    } catch (err: any) {
        console.error('Error creating container:', err);
        if (err.response && err.response.status === 409) {
          toast.error('A container with this code already exists.');
        } else {
          const errorMsg = err.response?.data?.message || 'Failed to create container.';
          toast.error(errorMsg);
        }
      } finally {
        setShowCreatePopup(false); // Hide spinner
      }
  };

  const handleDeleteContainer = async (sanitizedName: string, description: string) => {
  if (!accessToken || !userId) return;

  console.log("Attempting delete with:", { apiCodeName: sanitizedName, userId });

  try {
    const res = await axios.delete('http://localhost:3000/user/containers/delete', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: { sanitizedName, userId }
    });

    if (res.status === 200) {
      toast.success('Container deleted.');
      setSelectedContainerName(null);
      dispatch(setSelectedContainer(null));
      fetchAllContainers();
      setApprovedApiCodes(prev => [...prev, { name: sanitizedName, description }]);
    }
  } catch (err) {
    console.error('Error deleting container:', err);
    toast.error('Failed to delete container.');
  }
};


  return (
    <div className="manage-containers-container">
      <div className="manage-containers-sidebar">
        <input type="text"
          placeholder="Search containers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="manage-containers-search-bar"
        />
        <ul className="manage-containers-list">
        {filteredContainers.map((container) => (
          <li
            key={container.sanitizedName}
            className={`manage-containers-item ${selectedContainerName === container.sanitizedName ? 'manage-containers-active' : ''}`}
          >
            <span
              className="manage-containers-list-item-name"
              onClick={() => {
                if (selectedContainerName === container.sanitizedName) {
                  setSelectedContainerName(null);
                  dispatch(setSelectedContainer(null));
                } else {
                  setSelectedContainerName(container.sanitizedName);
                }
              }}
            >
              {container.sanitizedName}
            </span>
            <FaTrash
              className="manage-containers-list-item-trash"
              title="Delete Container"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteContainer(container.sanitizedName, container.description);
              }}
            />
          </li>
        ))}
      </ul>
      </div>
      <div className="manage-containers-details">
        {selectedContainer ? (
          <div>
            <h2 className="manage-containers-title">{selectedContainer.sanitizedName}</h2>
            <p className="manage-containers-description">{selectedContainer.description}</p>
            <button
              className="manage-containers-run-btn"
              onClick={handleRunStop}
            >
              {isRunning  ? 'Stop' : 'Run'}
            </button>
            <div className="manage-containers-clock">
              ⏱️ {isRunning  && containers[selectedKey!]?.startTime && elapsedTime === '00:00:00' ? (
                <FaSpinner className="manage-containers-spinner" />
              ) : (
                elapsedTime
              )}
              <div className="manage-containers-tab-bar">
                <button className={`manage-containers-tab-btn ${activeTab === 'console' ? 'active' : ''}`} onClick={() => setActiveTab('console')}><FaRegListAlt /> Console</button>
                <button className={`manage-containers-tab-btn ${activeTab === 'terminal' ? 'active' : ''}`} 
                        onClick={() => {
                          if (!isRunning ) {
                            toast.warning('Must Run Container Before using Terminal');
                            return;
                          }
                          setActiveTab('terminal');
                        }}><FaTerminal /> Terminal</button>
              </div>
            </div>
            {activeTab === 'console' ? (
              <div className="manage-containers-console-feed" ref={logFeedRef}>
                {(!logs || logs.length === 0) ? (
                  <p>// Output feed will be shown here...</p>
                ) : (
                  logs.map((line, idx) => <p key={idx}>{line}</p>)
                )}
              </div>
            ) : (
              <div className="manage-containers-terminal-wrapper">
                <div className="manage-containers-terminal" ref={terminalContainerRef}>
                  {terminalOutput.map((line, idx) => {
                    const isCommand = line.startsWith('> ');
                    return (
                      <p key={idx} className={isCommand ? 'manage-containers-terminal-command' : 'manage-containers-terminal-output'}>
                        {line}
                      </p>
                    );
                  })}
                  <input
                    className="manage-containers-terminal-input"
                    ref={terminalInputRef}
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTerminalCommand()}
                    placeholder="$ Enter command"
                  />
                </div>
                <button className="manage-containers-terminal-clear-btn" onClick={() => setTerminalOutput([])}>
                    Clear Terminal
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="manage-containers-popup">
            <h2>Create New Container</h2>
            <button
              className="manage-containers-toggle-list"
              onClick={() => setShowApiList((prev) => !prev)}
            >
              {showApiList ? 'Hide Approved APIs' : 'Show Approved APIs'}
            </button>

            {showApiList && (
              <ul className="manage-containers-api-list">
                {approvedApiCodes.map((apiCode, idx) => (
                  <li key={idx} className={`manage-containers-api-item ${selectedApiCode === apiCode.name ? 'manage-containers-selected-api' : ''}`} 
                  onClick={() => setSelectedApiCode(apiCode.name)}>{apiCode.name}</li>
                ))}
              </ul>
            )}

            <div className="manage-containers-upload-block">
            <label>Upload Container .tar File</label>
            <div
              className={`manage-containers-upload-drop ${isDragging ? 'dragover' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
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
              {selectedTarFile ? <p>{selectedTarFile.name}</p> : (
                <div style={{ textAlign: 'left' }}>
                  <p><strong>Drag & drop</strong> a <code>.tar</code> file here or <strong>click to browse</strong></p>

                  <p style={{ marginTop: '1rem' }}><strong>🛠 Required structure inside the archive:</strong></p>

                  <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                    <li><span style={{ color: '#22c55e' }}><strong>Dockerfile</strong></span> — must be at root level</li>
                    <li><span style={{ color: '#eab308' }}><strong>package.json</strong></span> — must define:<br />
                      <code style={{ background: '#1e1e1e', color: '#38bdf8', display: 'inline-block', marginTop: '0.3rem', padding: '0.3rem 0.5rem' }}>
                        "main": "index.js" (for JS) or "main": "dist/index.js" (for TS)
                      </code>
                    </li>
                    <li><span style={{ color: '#f97316' }}><strong>TypeScript projects:</strong></span> should contain:</li>
                    <ul style={{ paddingLeft: '1.5rem' }}>
                      <li><code>src/index.ts</code> (your TypeScript code)</li>
                      <li><code>tsconfig.json</code> (TypeScript configuration)</li>
                      <li><code>yarn.lock</code> or <code>package-lock.json</code> (optional)</li>
                    </ul>
                    <li><span style={{ color: '#3b82f6' }}><strong>JavaScript projects:</strong></span> should contain:</li>
                    <ul style={{ paddingLeft: '1.5rem' }}>
                      <li><code>index.js</code> (or file specified in <code>package.json</code>)</li>
                    </ul>
                    <li><span style={{ color: '#ef4444' }}><strong>node_modules/</strong> folder</span> — optional but speeds up container build</li>
                  </ul>
                </div>
              )}
              </div>
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

            <div className="manage-containers-popup-actions">
              <button className="manage-containers-create-btn" onClick={handleCreateContainer}>Create</button>
              <button className="manage-containers-reset-btn" 
                onClick={() => {
                  setSelectedApiCode('');
                  setSelectedTarFile(null);
                }}>
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
      {showRunPopup && (
        <div className="manage-containers-popup-overlay">
          <Spinner text="Loading" size="small" />
          <p className="manage-containers-spinner-text">{runPopupText}</p>
        </div>
      )}

      {showCreatePopup && (
        <div className="manage-containers-popup-overlay">
          <Spinner text="Loading" size="small" />
          <p className="manage-containers-spinner-text">Container Being Created...</p>
        </div>
      )}
    </div>

  );
}
