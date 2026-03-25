import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  useNotifications,
  useMarkRead,
  useMentionToast,
  useBugs,
  useTestCases,
  useTesters,
  useDevelopers,
  useProjects,
} from '../hooks/useData';
import { formatDistanceToNow } from 'date-fns';

const NavIcon = ({ path }) => {
  const icons = {
    dashboard: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="1" width="6" height="6" rx="1.5" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" />
      </svg>
    ),
    'test-cases': (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="12" height="12" rx="1.5" />
        <path d="M5 8l2 2 4-4" />
      </svg>
    ),
    runs: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6" />
        <path d="M6 5.5l5 2.5-5 2.5V5.5z" fill="currentColor" stroke="none" />
      </svg>
    ),
    projects: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="5" height="5" rx="1" />
        <rect x="9" y="3" width="5" height="5" rx="1" />
        <rect x="2" y="10" width="5" height="3" rx="1" />
        <rect x="9" y="10" width="5" height="3" rx="1" />
      </svg>
    ),
    bugs: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 2a3 3 0 0 1 3 3v4a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
        <path d="M2 7h3M11 7h3M4 4L2 2M12 4l2-2" />
      </svg>
    ),
    testers: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="6" cy="5" r="3" />
        <path d="M1 14c0-3 2-5 5-5s5 2 5 5" />
        <circle cx="13" cy="5" r="2" />
        <path d="M15 13c0-2-1-3.5-2-3.5" />
      </svg>
    ),
    'dev-connect': (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 6l-3 2 3 2M12 6l3 2-3 2M9 3l-2 10" />
      </svg>
    ),
    reports: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 14V8l3-3 3 3 3-5 3 5" />
        <path d="M2 14h12" />
      </svg>
    ),
    settings: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="2.5" />
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.22 3.22l1.41 1.41M11.37 11.37l1.41 1.41M3.22 12.78l1.41-1.41M11.37 4.63l1.41-1.41" />
      </svg>
    ),
    logs: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 3h12v10H2z" />
        <path d="M2 6h12M5 9h6M5 12h4" />
      </svg>
    ),
  };
  return icons[path] || null;
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, colors } = useTheme();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const { data: notifs = [] } = useNotifications();
  const { data: bugs = [] } = useBugs({ status: 'Open' });
  const { data: tcData = {} } = useTestCases({ limit: 200 });
  const testCases = tcData.data || [];
  const { data: testersData = {} } = useTesters({ limit: 200 });
  const testers = testersData.data || [];
  const { data: devsData = {} } = useDevelopers({ limit: 200 });
  const developers = devsData.data || [];
  const { data: projData = {} } = useProjects();
  const projects = projData.data || projData || [];
  const markRead = useMarkRead();
  const unread = notifs.filter(n => !n.is_read).length;

  // Show toast popup when someone @mentions the current user
  useMentionToast();

  const navLinks = [
    { section: 'Overview', items: [{ to: '/dashboard', label: 'Dashboard' }] },
    {
      section: 'Testing',
      items: [
        { to: '/test-cases', label: 'Test Cases' },
        { to: '/runs', label: 'Test Runs' },
        { to: '/projects', label: 'Projects' },
      ],
    },
    { section: 'Issues', items: [{ to: '/bugs', label: 'Bug Tracker' }] },
    {
      section: 'Team',
      items: [
        { to: '/testers', label: 'Testers' },
        { to: '/dev-connect', label: 'Dev Connect' },
      ],
    },
    { section: 'Analytics', items: [{ to: '/reports', label: 'Reports' }] },
    {
      section: 'Admin',
      items: user?.role?.toLowerCase() === 'admin'
        ? [{ to: '/logs', label: 'Access Logs' }]
        : [],
    },
    { section: 'Settings', items: [{ to: '/settings', label: 'Settings' }] },
  ];

  return (
    <div className="shell">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="logo" onClick={() => navigate('/dashboard')}>
          <div className="logo-icon">TF</div>
          <div>
            <div className="logo-name">TestFlow</div>
            <div className="logo-sub">Pro</div>
          </div>
        </div>
        <nav className="nav">
          {navLinks.map(({ section, items }) => (
            <div key={section}>
              <div className="nav-sep">{section}</div>
              {items.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `ni${isActive ? ' active' : ''}`}
                >
                  <NavIcon path={to.replace('/', '')} />
                  <span>{label}</span>
                  {to === '/bugs' && bugs.length > 0 && (
                    <span className="nb nb-red" style={{ marginLeft: 'auto' }}>
                      {bugs.length}
                    </span>
                  )}
                  {to === '/test-cases' && testCases.length > 0 && (
                    <span className="nb nb-blue" style={{ marginLeft: 'auto' }}>
                      {testCases.length}
                    </span>
                  )}
                  {to === '/projects' && projects.length > 0 && (
                    <span className="nb nb-violet" style={{ marginLeft: 'auto' }}>
                      {projects.length}
                    </span>
                  )}
                  {to === '/testers' && testers.length > 0 && (
                    <span className="nb nb-green" style={{ marginLeft: 'auto' }}>
                      {testers.length}
                    </span>
                  )}
                  {to === '/dev-connect' && developers.length > 0 && (
                    <span className="nb nb-purple" style={{ marginLeft: 'auto' }}>
                      {developers.length}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sb-user">
          <div className="sb-user-inner" onClick={() => navigate('/settings')}>
            <div className={`av av-md ${user?.avatar_color || 'av-blue'}`}>
              {user?.initials || 'U'}
            </div>
            <div>
              <div className="sb-name">{user?.name || 'User'}</div>
              <div className="sb-role">{user?.role || 'QA'}</div>
            </div>
            <div className="online-dot" />
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="main">
        {/* TOP NOTIFICATION BAR */}
        <div className="topbar" style={{ justifyContent: 'flex-end', zIndex: 20 }}>
          <button
            className="btn btn-icon btn-sm"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            style={{ position: 'relative' }}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button
            className="btn btn-icon btn-sm"
            onClick={() => setNotifOpen(o => !o)}
            style={{ position: 'relative' }}
          >
            🔔
            {unread > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 6,
                  height: 6,
                  background: 'var(--red)',
                  borderRadius: '50%',
                }}
              />
            )}
          </button>
          <button className="btn btn-sm btn-danger" onClick={logout}>
            Logout
          </button>
        </div>

        {/* PAGE OUTLET */}
        <Outlet />

        {/* NOTIFICATION PANEL */}
        {notifOpen && (
          <div className="notif-panel">
            <div className="notif-hd">
              <div className="notif-title">Notifications</div>
              <button className="btn btn-xs" onClick={() => markRead.mutate('all')}>
                Mark all read
              </button>
            </div>
            {notifs.length === 0 ? (
              <div
                style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}
              >
                No notifications
              </div>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                  onClick={() => {
                    markRead.mutate(n.id);
                    if (n.related_url) {
                      navigate(n.related_url);
                      setNotifOpen(false);
                    }
                  }}
                  style={{ cursor: n.related_url ? 'pointer' : 'default' }}
                >
                  <div className="notif-item-t">
                    {n.type === 'mention' && '👋 '}
                    {n.title}
                  </div>
                  <div className="notif-item-s">
                    {n.sub} · {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
