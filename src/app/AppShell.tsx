import { Outlet } from 'react-router';

/** Phone-framed shell (desktop) / fullscreen (mobile). */
export function AppShell() {
  return (
    <div className="lt-app">
      <div className="lt-shell">
        <Outlet />
      </div>
    </div>
  );
}
