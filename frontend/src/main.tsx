import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store , persistor } from './store/store.ts';
import App from './App.tsx';
import './globalCss/base.css';

const SplashScreen = () => (
  <div style={{ textAlign: 'center', marginTop: '3rem' }}>
    <h2>Loading...</h2>
  </div>
);

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
      <PersistGate loading={<SplashScreen />} persistor={persistor}>
        <BrowserRouter> 
            <App />
        </BrowserRouter>
      </PersistGate>
  </Provider>
);
