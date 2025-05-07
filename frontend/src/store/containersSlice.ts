// store/containerSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ContainerInfo {
    isRunning: boolean;
    startTime: number | null;
    logs: string[];
}

interface ContainerState {
  selectedContainer: { sanitizedName: string; version: string; description?: string } | null;
  containers: Record<string, ContainerInfo>;
}

const initialState: ContainerState = {
  selectedContainer: null,
  containers: {},
};

const containerKey = (name: string, version: string) =>
    `${name.trim().toLowerCase()}__${version}`;

export const containerSlice = createSlice({
    name: 'container',
    initialState,
    reducers: {
      setSelectedContainer(state, action: PayloadAction<{ sanitizedName: string; version: string; description?: string } | null>) {
        state.selectedContainer = action.payload;
      },
      setContainerInfo(state, action: PayloadAction<{ sanitizedName: string; version: string; data: Partial<ContainerInfo> }>) {
        const key = containerKey(action.payload.sanitizedName, action.payload.version);
        state.containers[key] = {
          ...state.containers[key],
          ...action.payload.data,
        };
      },
      resetContainerInfo(state, action: PayloadAction<{ sanitizedName: string; version: string }>) {
        const key = containerKey(action.payload.sanitizedName, action.payload.version);
        delete state.containers[key];
      },
      setContainerLogs(state, action: PayloadAction<{ sanitizedName: string; version: string; logs: string[] }>) {
        const key = containerKey(action.payload.sanitizedName, action.payload.version);
        if (!state.containers[key]) {
          state.containers[key] = { isRunning: false, startTime: null, logs: [] };
        }
        state.containers[key].logs = action.payload.logs;
      },
      appendContainerLogs(state, action: PayloadAction<{ sanitizedName: string; version: string; log: string }>) {
        const key = containerKey(action.payload.sanitizedName, action.payload.version);
        if (!state.containers[key]) {
          state.containers[key] = { isRunning: false, startTime: null, logs: [] };
        }
        state.containers[key].logs.push(action.payload.log);
      },
    },
});

  export const { setSelectedContainer, setContainerInfo, resetContainerInfo, setContainerLogs, appendContainerLogs} = containerSlice.actions;
  export default containerSlice.reducer;
