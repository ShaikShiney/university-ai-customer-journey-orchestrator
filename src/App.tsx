import { useEffect, useState } from 'react';

import Shell from './components/Shell';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerProfile from './pages/CustomerProfile';
import Journey from './pages/Journey';
import Segments from './pages/Segments';
import Tickets from './pages/Tickets';
import Predictions from './pages/Predictions';
import Recommendations from './pages/Recommendations';
import Outcomes from './pages/Outcomes';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';

import type { Role } from './data';

type Page =
  | 'dashboard'
  | 'customers'
  | 'customerProfile'
  | 'journey'
  | 'segments'
  | 'tickets'
  | 'predictions'
  | 'recommendations'
  | 'outcomes'
  | 'reports'
  | 'notifications'
  | 'users'
  | 'audit'
  | 'settings';

interface CurrentUser {
  name: string;
  role: Role;
  avatar: string;
}

interface NavigationParams {
  studentId?: string;
}

const API_URL = 'https://university-ai-customer-journey.onrender.com';

/* -----------------------------------------
   Convert backend role to frontend role
----------------------------------------- */

function convertRole(role: unknown): Role {
  const normalized = String(role || '').trim().toUpperCase();

  switch (normalized) {
    case 'ADMIN':
    case 'ADMINISTRATOR':
      return 'admin';

    case 'SERVICE_AGENT':
    case 'SERVICEAGENT':
    case 'AGENT':
      return 'agent';

    case 'MARKETING_MANAGER':
    case 'MARKETING':
      return 'marketing';

    case 'SALES_MANAGER':
    case 'SALES':
      return 'sales';

    case 'CUSTOMER':
    case 'STUDENT':
      return 'customer';

    default:
      return 'customer';
  }
}

/* -----------------------------------------
   Extract role from any backend response
----------------------------------------- */

function extractRole(user: any): Role {
  if (!user) {
    return 'customer';
  }

  // Direct role
  if (typeof user.role === 'string') {
    return convertRole(user.role);
  }

  // role_name
  if (typeof user.role_name === 'string') {
    return convertRole(user.role_name);
  }

  // roles array
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    const firstRole = user.roles[0];

    if (typeof firstRole === 'string') {
      return convertRole(firstRole);
    }

    if (firstRole?.name) {
      return convertRole(firstRole.name);
    }

    if (firstRole?.role) {
      return convertRole(firstRole.role);
    }
  }

  // role object
  if (user.role && typeof user.role === 'object') {
    if (user.role.name) {
      return convertRole(user.role.name);
    }

    if (user.role.role) {
      return convertRole(user.role.role);
    }
  }

  return 'customer';
}

/* -----------------------------------------
   Avatar
----------------------------------------- */

function createAvatar(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'
  );
}

/* -----------------------------------------
   Token helpers
----------------------------------------- */

function getStoredToken(): string | null {
  return (
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token') ||
    localStorage.getItem('authToken') ||
    sessionStorage.getItem('authToken')
  );
}

function clearAuthStorage() {
  localStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_token');

  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');

  localStorage.removeItem('authUser');
  sessionStorage.removeItem('authUser');
}

/* -----------------------------------------
   Build frontend user
----------------------------------------- */

function buildCurrentUser(backendUser: any): CurrentUser {
  const name =
    backendUser?.name ||
    backendUser?.full_name ||
    backendUser?.username ||
    'University User';

  return {
    name,
    role: extractRole(backendUser),
    avatar:
      backendUser?.avatar ||
      createAvatar(name),
  };
}

/* -----------------------------------------
   App
----------------------------------------- */

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [currentPage, setCurrentPage] =
    useState<Page>('dashboard');

  const [navigationParams, setNavigationParams] =
    useState<NavigationParams>({});

  const [checkingSession, setCheckingSession] =
    useState(true);

  /* ---------------------------------------
     Restore login session
  --------------------------------------- */

  useEffect(() => {
    const restoreSession = async () => {
      const token = getStoredToken();

      if (!token) {
        setCheckingSession(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/auth/me`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          clearAuthStorage();
          setAuthenticated(false);
          setCurrentUser(null);
          setCheckingSession(false);
          return;
        }

        /*
          Backend may return the user in:
          result.user
          result.data.user
          result.data
        */

        const backendUser =
          result.user ||
          result.data?.user ||
          result.data;

        if (!backendUser) {
          clearAuthStorage();
          setAuthenticated(false);
          setCurrentUser(null);
          setCheckingSession(false);
          return;
        }

        const user = buildCurrentUser(backendUser);

        console.log(
          'Authenticated user:',
          backendUser
        );

        console.log(
          'Detected frontend role:',
          user.role
        );

        setCurrentUser(user);
        setAuthenticated(true);
      } catch (error) {
        console.error(
          'Session restore failed:',
          error
        );

        clearAuthStorage();
        setAuthenticated(false);
        setCurrentUser(null);
      } finally {
        setCheckingSession(false);
      }
    };

    restoreSession();
  }, []);

  /* ---------------------------------------
     Login
  --------------------------------------- */

  const handleLogin = async (loginUser: CurrentUser) => {
    /*
      Login.tsx stores the JWT.

      We immediately call /me again so that
      the role comes from the backend database,
      not from the old frontend demo role.
    */

    const token = getStoredToken();

    if (!token) {
      console.error(
        'Login succeeded but JWT token was not found.'
      );

      setCurrentUser(loginUser);
      setAuthenticated(true);
      setCurrentPage('dashboard');
      setNavigationParams({});
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/auth/me`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Unable to load user profile.'
        );
      }

      const backendUser =
        result.user ||
        result.data?.user ||
        result.data;

      const user = buildCurrentUser(backendUser);

      console.log(
        'Login user from backend:',
        backendUser
      );

      console.log(
        'Login role:',
        user.role
      );

      setCurrentUser(user);
      setAuthenticated(true);
      setCurrentPage('dashboard');
      setNavigationParams({});
    } catch (error) {
      console.error(
        'Failed to load authenticated user:',
        error
      );

      /*
        Fallback to the user supplied by Login.tsx.
      */
      setCurrentUser(loginUser);
      setAuthenticated(true);
      setCurrentPage('dashboard');
      setNavigationParams({});
    }
  };

  /* ---------------------------------------
     Logout
  --------------------------------------- */

  const handleLogout = () => {
    clearAuthStorage();

    setCurrentUser(null);
    setAuthenticated(false);

    setCurrentPage('dashboard');
    setNavigationParams({});
  };

  /* ---------------------------------------
     Navigation
  --------------------------------------- */

  const handleNavigate = (
    page: string,
    params?: Record<string, string>
  ) => {
    setCurrentPage(page as Page);

    setNavigationParams({
      studentId: params?.studentId,
    });
  };

  /* ---------------------------------------
     Page titles
  --------------------------------------- */

  const pageTitles: Record<Page, string> = {
    dashboard: 'Dashboard',
    customers: 'Customers',
    customerProfile: 'Customer Profile',
    journey: 'Journey',
    segments: 'Segments & Outreach',
    tickets: 'Service Tickets',
    predictions: 'AI Predictions',
    recommendations: 'Recommendations',
    outcomes: 'Outcomes & Feedback',
    reports: 'Reports & Analytics',
    notifications: 'Notifications',
    users: 'Users & Roles',
    audit: 'Audit Logs',
    settings: 'Settings',
  };

  /* ---------------------------------------
     Render page
  --------------------------------------- */

  const renderPage = () => {
    if (!currentUser) {
      return null;
    }

    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            role={currentUser.role}
            onNavigate={handleNavigate}
          />
        );

      case 'customers':
        return (
          <Customers
            onNavigate={handleNavigate}
          />
        );

      case 'customerProfile':
        return (
          <CustomerProfile
            studentId={navigationParams.studentId}
            onNavigate={handleNavigate}
          />
        );

      case 'journey':
        return <Journey />;

      case 'segments':
        return <Segments />;

      case 'tickets':
        return <Tickets />;

      case 'predictions':
        return <Predictions />;

      case 'recommendations':
        return <Recommendations />;

      case 'outcomes':
        return <Outcomes />;

      case 'reports':
        return <Reports />;

      case 'notifications':
        return <Notifications />;

      case 'users':
        return <Users />;

      case 'audit':
        return <AuditLogs />;

      case 'settings':
        return <Settings />;

      default:
        return (
          <Dashboard
            role={currentUser.role}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  /* ---------------------------------------
     Session checking
  --------------------------------------- */

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />

          <p className="text-sm font-medium text-slate-700">
            Checking secure session...
          </p>

          <p className="text-xs text-slate-400 mt-1">
            University AI Orchestrator
          </p>
        </div>
      </div>
    );
  }

  /* ---------------------------------------
     Login screen
  --------------------------------------- */

  if (!authenticated || !currentUser) {
    return (
      <div className="min-h-screen">
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  /* ---------------------------------------
     Authenticated application
  --------------------------------------- */

  return (
    <div className="h-screen overflow-hidden">
      <Shell
        currentPage={currentPage}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onLogout={handleLogout}
        pageTitle={pageTitles[currentPage]}
      >
        {renderPage()}
      </Shell>
    </div>
  );
}