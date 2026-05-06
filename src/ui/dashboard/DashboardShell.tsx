import React from 'react';
import { useAppState } from '../../app/state/store';
import { CategorySidebar } from './CategorySidebar';
import { WeblinkGrid } from './WeblinkGrid';
import { DashboardToolbar } from './DashboardToolbar';
import styles from './DashboardShell.module.css';

export function DashboardShell() {
  const { state } = useAppState();

  return (
    <div
      className={styles.shell}
      data-compact={state.settings.compactMode ? 'true' : 'false'}
    >
      <DashboardToolbar />
      <div className={styles.layout}>
        <CategorySidebar />
        <main className={styles.content}>
          <WeblinkGrid />
        </main>
      </div>
    </div>
  );
}
