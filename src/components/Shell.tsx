import React, { useState } from 'react';
import { Avatar, Badge, Dropdown, DropdownItem } from './ui';
import { MOCK_NOTIFICATIONS } from '../data';
import type { Role } from '../data';

type Page = string;

const navItems: {
  label: string;
  icon: React.ReactNode;
  page: Page;
  roles: Role[];
  section?: string;
}[] = [
  {
    label: 'Dashboard',
    icon: <HomeIcon />,
    page: 'dashboard',
    roles: ['admin', 'agent', 'marketing', 'sales', 'customer'],
  },
  {
    label: 'Customers',
    icon: <PeopleIcon />,
    page: 'customers',
    roles: ['admin', 'agent', 'sales'],
    section: 'Core',
  },
  {
    label: 'Journey',
    icon: <RouteIcon />,
    page: 'journey',
    roles: ['admin', 'agent', 'sales', 'customer'],
  },
  {
    label: 'Segments & Outreach',
    icon: <SegmentIcon />,
    page: 'segments',
    roles: ['admin', 'marketing', 'sales'],
    section: 'Outreach',
  },
  {
    label: 'Service Tickets',
    icon: <TicketIcon />,
    page: 'tickets',
    roles: ['admin', 'agent', 'customer'],
  },
  {
    label: 'AI Predictions',
    icon: <AiIcon />,
    page: 'predictions',
    roles: ['admin', 'agent', 'marketing', 'sales'],
    section: 'Intelligence',
  },
  {
    label: 'Recommendations',
    icon: <RecommendIcon />,
    page: 'recommendations',
    roles: ['admin', 'agent', 'marketing', 'sales'],
  },
  {
    label: 'Outcomes & Feedback',
    icon: <OutcomeIcon />,
    page: 'outcomes',
    roles: ['admin', 'marketing', 'sales'],
  },
  {
    label: 'Reports & Analytics',
    icon: <ReportsIcon />,
    page: 'reports',
    roles: ['admin', 'agent', 'marketing', 'sales'],
    section: 'Analytics',
  },
  {
    label: 'Notifications',
    icon: <BellIcon />,
    page: 'notifications',
    roles: ['admin', 'agent', 'marketing', 'sales', 'customer'],
  },
  {
    label: 'Users & Roles',
    icon: <UsersIcon />,
    page: 'users',
    roles: ['admin'],
    section: 'Admin',
  },
  {
    label: 'Audit Logs',
    icon: <AuditIcon />,
    page: 'audit',
    roles: ['admin'],
  },
  {
    label: 'Settings',
    icon: <SettingsIcon />,
    page: 'settings',
    roles: ['admin'],
  },
];

// Customer-specific navigation
const customerNav: {
  label: string;
  icon: React.ReactNode;
  page: Page;
}[] = [
  {
    label: 'My Dashboard',
    icon: <HomeIcon />,
    page: 'dashboard',
  },
  {
    label: 'My Journey',
    icon: <RouteIcon />,
    page: 'journey',
  },
  {
    label: 'My Tickets',
    icon: <TicketIcon />,
    page: 'tickets',
  },
  {
    label: 'Notifications',
    icon: <BellIcon />,
    page: 'notifications',
  },
];

interface ShellProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  currentUser: {
    name: string;
    role: Role;
    avatar: string;
  };
  onLogout: () => void;
  children: React.ReactNode;
  pageTitle: string;
}

export default function Shell({
  currentPage,
  onNavigate,
  currentUser,
  onLogout,
  children,
  pageTitle,
}: ShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);

  const unread = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  /*
   * IMPORTANT FIX:
   * Backend may return roles such as ADMIN, SERVICE_AGENT,
   * MARKETING_MANAGER, SALES_MANAGER, CUSTOMER.
   * Frontend navigation uses admin, agent, marketing, sales, customer.
   * Normalize the backend role before filtering the sidebar.
   */
  const rawRole = String(currentUser.role).toLowerCase();

  const normalizedRole: Role =
    rawRole === 'admin'
      ? 'admin'
      : rawRole === 'service_agent' || rawRole === 'service-agent' || rawRole === 'agent'
      ? 'agent'
      : rawRole === 'marketing_manager' ||
        rawRole === 'marketing-manager' ||
        rawRole === 'marketing'
      ? 'marketing'
      : rawRole === 'sales_manager' ||
        rawRole === 'sales-manager' ||
        rawRole === 'sales'
      ? 'sales'
      : 'customer';

  const visibleNav =
    normalizedRole === 'customer'
      ? customerNav
      : navItems.filter((item) =>
          item.roles.includes(normalizedRole)
        );

  const roleName: Record<Role, string> = {
    admin: 'Administrator',
    agent: 'Service Agent',
    marketing: 'Marketing Manager',
    sales: 'Sales Manager',
    customer: 'Student',
  };

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden">

      {/* SIDEBAR */}
      <aside
        className={`flex flex-col bg-[#0f1f3d] text-white transition-all duration-200 shrink-0 ${
          sidebarOpen ? 'w-60' : 'w-16'
        } h-full overflow-hidden`}
      >

        {/* LOGO */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 min-h-[60px]">

          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
            <svg
              width="16"
              height="16"
              fill="white"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>

          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white leading-tight">
                University AI
              </p>
              <p className="text-[10px] text-white/50 leading-tight">
                Journey Orchestrator
              </p>
            </div>
          )}

          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="ml-auto w-6 h-6 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors shrink-0"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? '‹' : '›'}
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">

          {(() => {
            let lastSection = '';

            return visibleNav.map((item) => {
              const isActive = currentPage === item.page;

              const hasSection =
                'section' in item &&
                !!item.section;

              const showSection =
                sidebarOpen &&
                hasSection &&
                item.section !== lastSection;

              if (hasSection) {
                lastSection = item.section as string;
              }

              return (
                <React.Fragment key={item.page}>

                  {showSection && (
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 pt-4 pb-1">
                     {String(item.section ?? '')}
                    </p>
                  )}

                  <button
                    onClick={() => onNavigate(item.page)}
                    title={!sidebarOpen ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all mb-0.5 ${
                      isActive
                        ? 'bg-white/10 text-white font-medium'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >

                    <span className="shrink-0 w-4 h-4">
                      {item.icon}
                    </span>

                    {sidebarOpen && (
                      <span className="truncate">
                        {item.label}
                      </span>
                    )}

                    {sidebarOpen &&
                      item.page === 'notifications' &&
                      unread > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {unread}
                        </span>
                      )}
                  </button>

                </React.Fragment>
              );
            });
          })()}

        </nav>

        {/* BOTTOM USER SECTION */}
        <div className="border-t border-white/10 p-3">

          <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors text-left">

            <Avatar
              initials={currentUser.avatar}
              size="sm"
              color="bg-indigo-500"
            />

            {sidebarOpen && (
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {currentUser.name}
                </p>

                <p className="text-[10px] text-white/40 capitalize">
                  {roleName[normalizedRole]}
                </p>
              </div>
            )}

          </button>

          {sidebarOpen && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 text-xs transition-colors mt-1"
            >
              <svg
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>

              Sign Out
            </button>
          )}

        </div>

      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* TOP NAVBAR */}
        <header className="bg-white border-b border-slate-200 flex items-center gap-4 px-6 h-[60px] shrink-0">

          <div>
            <h1 className="text-base font-semibold text-slate-900">
              {pageTitle}
            </h1>
          </div>

          {/* GLOBAL SEARCH */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">

              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>

              <input
                type="text"
                placeholder="Search students, tickets, campaigns…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2563a8] focus:ring-2 focus:ring-[#2563a8]/10 focus:bg-white transition-all"
              />

              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono border border-slate-200 rounded px-1">
                ⌘K
              </span>

            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">

            {/* NOTIFICATIONS */}
            <div className="relative">

              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
                aria-label="Notifications"
              >

                <BellIcon />

                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unread}
                  </span>
                )}

              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 w-96 bg-white border border-slate-200 rounded-xl shadow-xl">

                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Notifications
                    </h3>

                    <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">

                    {MOCK_NOTIFICATIONS.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                          !n.read ? 'bg-indigo-50/40' : ''
                        }`}
                      >

                        <div className="flex items-start gap-3">

                          <div
                            className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                              n.severity === 'critical'
                                ? 'bg-red-500'
                                : n.severity === 'warning'
                                ? 'bg-amber-500'
                                : 'bg-indigo-400'
                            }`}
                          />

                          <div className="flex-1 min-w-0">

                            <p className="text-xs font-semibold text-slate-800">
                              {n.title}
                            </p>

                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                              {n.description}
                            </p>

                          </div>

                          <span className="text-[10px] text-slate-400 shrink-0">
                            {n.timestamp}
                          </span>

                        </div>

                      </div>
                    ))}

                  </div>

                  <div className="px-4 py-2 border-t border-slate-100 text-center">

                    <button
                      onClick={() => {
                        onNavigate('notifications');
                        setNotifOpen(false);
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      View all notifications
                    </button>

                  </div>

                </div>
              )}

            </div>

            {/* HELP */}
            <button
              className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
              aria-label="Help"
            >
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
              </svg>
            </button>

            {/* USER AVATAR */}
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 hover:bg-slate-100 rounded-lg p-1.5 transition-colors">
                  <Avatar
                    initials={currentUser.avatar}
                    size="sm"
                  />
                </button>
              }
              align="right"
            >

              <div className="px-4 py-2 border-b border-slate-100">

                <p className="text-sm font-semibold text-slate-900">
                  {currentUser.name}
                </p>

                <p className="text-xs text-slate-500 capitalize">
                  {roleName[normalizedRole]}
                </p>

              </div>

              <DropdownItem onClick={() => {}}>
                Profile Settings
              </DropdownItem>

              <DropdownItem
                onClick={() => onNavigate('settings')}
              >
                System Settings
              </DropdownItem>

              <DropdownItem
                danger
                onClick={onLogout}
              >
                Sign Out
              </DropdownItem>

            </Dropdown>

          </div>

        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

      </div>

    </div>
  );
}

/* =========================
   ICONS
========================= */

function HomeIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm-10 2a2 2 0 1 0 4 0 2 2 0 0 0-4 0z" />
    </svg>
  );
}

function SegmentIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 1 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 0-4V7a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function AiIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function RecommendIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function OutcomeIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function AuditIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}