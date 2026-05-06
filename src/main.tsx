import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { AppProvider, useAppState } from './app/state/store';
import { bootstrapApp } from './app/bootstrap/index';
import { DashboardShell } from './ui/dashboard/DashboardShell';
import { StorageSetupDialog } from './ui/storage/StorageSetupDialog';
import { SyncConfirmDialog } from './ui/shared/dialogs/SyncConfirmDialog';
import './styles/theme-tokens.css';
import './styles/globals.css';

function App() {
  const { state, dispatch } = useAppState();

  useEffect(() => {
    bootstrapApp(dispatch);
  }, [dispatch]);

  const { storageStatus } = state;

  if (storageStatus === 'uninitialized') {
    return null;
  }

  if (storageStatus === 'setup-required') {
    return <StorageSetupDialog />;
  }

  return (
    <>
      <DashboardShell />
      <SyncConfirmDialog />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
