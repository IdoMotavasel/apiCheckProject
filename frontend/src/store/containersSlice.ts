// store/containerSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ContainerInfo {
    isRunning: boolean;
    startTime: number | null;
    logs: string[];
}

interface ContainerState {
  selectedContainer: { sanitizedName: string; description?: string } | null;
  containers: Record<string, ContainerInfo>;
}

const initialState: ContainerState = {
  selectedContainer: null,
  containers: {},
};

const containerKey = (name: string) => name.trim().toLowerCase();

export const containerSlice = createSlice({
    name: 'container',
    initialState,
    reducers: {
      setSelectedContainer(state, action: PayloadAction<{ sanitizedName: string; description?: string } | null>) {
        state.selectedContainer = action.payload;
      },
      setContainerInfo(state, action: PayloadAction<{ sanitizedName: string; data: Partial<ContainerInfo> }>) {
        const key = containerKey(action.payload.sanitizedName);
        state.containers[key] = {
          ...state.containers[key],
          ...action.payload.data,
        };
      },
      resetContainerInfo(state, action: PayloadAction<{ sanitizedName: string;}>) {
        const key = containerKey(action.payload.sanitizedName);
        delete state.containers[key];
      },
      setContainerLogs(state, action: PayloadAction<{ sanitizedName: string; logs: string[] }>) {
        const key = containerKey(action.payload.sanitizedName);
        if (!state.containers[key]) {
          state.containers[key] = { isRunning: false, startTime: null, logs: [] };
        }
        state.containers[key].logs = action.payload.logs;
      },
      appendContainerLogs(state, action: PayloadAction<{ sanitizedName: string; log: string }>) {
        const key = containerKey(action.payload.sanitizedName);
        if (!state.containers[key]) {
          state.containers[key] = { isRunning: false, startTime: null, logs: [] };
        }
        state.containers[key].logs.push(action.payload.log);
      },
    },
});

  export const { setSelectedContainer, setContainerInfo, resetContainerInfo, setContainerLogs, appendContainerLogs} = containerSlice.actions;
  export default containerSlice.reducer;
