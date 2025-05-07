import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, Persistor } from 'redux-persist';
import storageSession from 'redux-persist/lib/storage/session';
import authReducer from './authSlice';
import containerReducer from './containersSlice';

const authPersistConfig = {
  key: `auth-${window.location.port}`,
  storage: storageSession, 
};

const containerPersistConfig = {
  key: `container-${window.location.port}`,
  storage: storageSession,
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedContainerReducer = persistReducer(containerPersistConfig, containerReducer);


 const store = configureStore({
    reducer:{
      auth:persistedAuthReducer,
      container:persistedContainerReducer,
    },
    // Allow non-serializable values in the state and actions
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST'], // Ignore the persist action (for redux-persist)
          ignoredPaths: ['auth', 'container'], // Ignore the 'auth' part of the state if needed
        },
      }),
});

const persistor: Persistor = persistStore(store);
export { store, persistor };
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;