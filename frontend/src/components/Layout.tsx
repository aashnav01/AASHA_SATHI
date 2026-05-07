import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { TabBar } from './TabBar';
import { PanicFAB } from './PanicFAB';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const Layout: React.FC = () => {
  const isOnline = useOnlineStatus();
  const offlineOffset = isOnline ? 'pt-16' : 'pt-[88px]';

  return (
    <div className="min-h-screen app-background flex flex-col font-sans">
      <div className="blob-1" />
      <div className="blob-2" />
      <div className="blob-3" />
      <div className="blob-4" />
      
      <TopBar />
      <main className={`flex-1 ${offlineOffset} pb-[env(safe-area-inset-bottom)] mb-[76px] overflow-y-auto w-full page-transition`}>
        <div className="p-4 w-full max-w-md mx-auto">
          <Outlet />
        </div>
      </main>
      <TabBar />
      <PanicFAB />
    </div>
  );
};
