import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, Persistor } from 'redux-persist';
import storageSession from 'redux-persist/lib/storage/session';
import authReducer from './authSlice';

const persistConfig = {
  key: 'auth',
  storage: storageSession, 
};

const persistedReducer = persistReducer(persistConfig, authReducer);

 const store = configureStore({
    reducer:{
      auth:persistedReducer,
    },
    // Allow non-serializable values in the state and actions
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST'], // Ignore the persist action (for redux-persist)
          ignoredPaths: ['auth'], // Ignore the 'auth' part of the state if needed
        },
      }),
});

const persistor: Persistor = persistStore(store);
export { store, persistor };
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;