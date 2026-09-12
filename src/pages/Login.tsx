import { useState } from 'react';

import { Button, Input } from '../components/ui';
import type { Role } from '../data';

interface LoginProps {
  onLogin: (user: {
    name: string;
    role: Role;
    avatar: string;
  }) => void;
}

type Screen = 'login' | 'mfa' | 'forgot';

const API_URL = 'http://localhost:5000';

function getRole(backendRole: string): Role {
  switch (String(backendRole || '').toUpperCase()) {
    case 'ADMIN':
      return 'admin';
    case 'SERVICE_AGENT':
      return 'agent';
    case 'MARKETING_MANAGER':
      return 'marketing';
    case 'SALES_MANAGER':
      return 'sales';
    case 'CUSTOMER':
      return 'customer';
    default:
      return 'customer';
  }
}

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

function saveToken(token: string, remember: boolean) {
  /*
   * Store BOTH supported keys.
   * This prevents protected pages from failing because
   * one page looks for authToken and another for auth_token.
   */
  if (remember) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('authToken', token);

    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('authToken');
  } else {
    sessionStorage.setItem('auth_token', token);
    sessionStorage.setItem('authToken', token);

    localStorage.removeItem('auth_token');
    localStorage.removeItem('authToken');
  }
}

export default function Login({ onLogin }: LoginProps) {
  const [screen, setScreen] = useState<Screen>('login');

  const [email, setEmail] = useState('admin@university.edu');
  const [password, setPassword] = useState('Admin@123');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [mfaCode, setMfaCode] = useState('');

  const [pendingUser, setPendingUser] = useState<{
    name: string;
    role: Role;
    avatar: string;
  } | null>(null);

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  const handleLogin = async () => {
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      let result: any = {};

      try {
        result = await response.json();
      } catch {
        throw new Error('Invalid response from the backend server.');
      }

      if (!response.ok || !result.success || !result.token) {
        throw new Error(
          result.message || 'Invalid email or password.'
        );
      }

      const token = result.token;

      // Save token consistently for the entire application.
      saveToken(token, remember);

      // Get the actual logged-in user from backend.
      const meResponse = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let meResult: any = {};

      try {
        meResult = await meResponse.json();
      } catch {
        throw new Error('Unable to read user details from the server.');
      }

      if (!meResponse.ok || !meResult.success) {
        throw new Error('Unable to load user details.');
      }

      const backendUser =
        meResult.user ||
        meResult.data?.user;

      if (!backendUser) {
        throw new Error(
          'User details were not returned by the server.'
        );
      }

      const name =
        backendUser.name || 'University User';

      const user = {
        name,
        role: getRole(
          backendUser.role ||
            backendUser.role_name ||
            'CUSTOMER'
        ),
        avatar:
          backendUser.avatar ||
          createAvatar(name),
      };

      /*
       * Keep the JWT in storage.
       * App.tsx and protected pages can now use it.
       */
      setPendingUser(user);
      setScreen('mfa');
    } catch (err) {
      console.error('Login error:', err);

      if (err instanceof TypeError) {
        setError(
          'Unable to connect to the server. Make sure the backend is running on port 5000.'
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to sign in. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // MFA
  // --------------------------------------------------

  const handleMfa = async () => {
    setError('');

    if (!/^\d{6}$/.test(mfaCode)) {
      setError('Enter the 6-digit verification code.');
      return;
    }

    if (!pendingUser) {
      setError('Login session expired. Please sign in again.');
      setScreen('login');
      return;
    }

    setLoading(true);

    /*
     * Current project UI uses a demo MFA step.
     * Backend authentication has already succeeded.
     */
    await new Promise((resolve) =>
      setTimeout(resolve, 500)
    );

    setLoading(false);

    onLogin(pendingUser);
  };

  // --------------------------------------------------
  // FORGOT PASSWORD
  // --------------------------------------------------

  const handleForgot = async () => {
    setError('');

    if (!forgotEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    /*
     * UI placeholder for password-reset workflow.
     * Actual email delivery can be connected later.
     */
    await new Promise((resolve) =>
      setTimeout(resolve, 700)
    );

    setLoading(false);
    setForgotSent(true);
  };

  // --------------------------------------------------
  // BACK TO LOGIN
  // --------------------------------------------------

  const backToLogin = () => {
    setScreen('login');
    setError('');
    setMfaCode('');
    setPendingUser(null);
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="min-h-full flex">

      {/* ================================================
          LEFT PANEL
      ================================================= */}

      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-[#0f1f3d] p-12 relative overflow-hidden">

        <div className="absolute inset-0 opacity-10">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white/30"
              style={{
                width: `${200 + i * 120}px`,
                height: `${200 + i * 120}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%)',
              }}
            />
          ))}
        </div>

        <div className="relative">

          <div className="flex items-center gap-3 mb-16">

            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
              <svg
                width="20"
                height="20"
                fill="white"
                viewBox="0 0 24 24"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>

            <div>
              <p className="text-sm font-bold text-white">
                University AI
              </p>

              <p className="text-xs text-white/40">
                Journey Orchestrator
              </p>
            </div>

          </div>

          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Unify every student journey. Intelligently.
          </h2>

          <p className="text-white/60 text-sm leading-relaxed">
            A single platform that connects admission, teaching,
            placement and graduation — powered by AI decision
            support that keeps humans in control.
          </p>

        </div>

        <div className="relative space-y-4">

          {[
            {
              stat: '94%',
              label: 'Prediction accuracy',
            },
            {
              stat: '3.2×',
              label: 'Faster issue resolution',
            },
            {
              stat: '847',
              label: 'Active student journeys',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-4"
            >
              <span className="text-2xl font-bold text-indigo-400">
                {item.stat}
              </span>

              <span className="text-white/50 text-sm">
                {item.label}
              </span>
            </div>
          ))}

          <p className="text-white/30 text-xs pt-4">
            © 2026 University AI Orchestrator. All rights reserved.
          </p>

        </div>

      </div>

      {/* ================================================
          RIGHT PANEL
      ================================================= */}

      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">

        <div className="w-full max-w-sm">

          {/* MOBILE LOGO */}

          <div className="lg:hidden flex items-center gap-2 mb-8">

            <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
              <svg
                width="16"
                height="16"
                fill="white"
                viewBox="0 0 24 24"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>

            <span className="font-bold text-slate-900 text-sm">
              University AI Orchestrator
            </span>

          </div>

          {/* ================================================
              LOGIN SCREEN
          ================================================= */}

          {screen === 'login' && (
            <>
              <div className="mb-8">

                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                  Sign in
                </h1>

                <p className="text-slate-500 text-sm">
                  Access your University AI Orchestrator dashboard
                </p>

              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 text-xs text-indigo-700">

                <p className="font-semibold mb-2">
                  Admin demo account
                </p>

                <div className="font-mono text-[11px]">
                  <p>admin@university.edu</p>
                  <p>Admin@123</p>
                </div>

              </div>

              <div className="space-y-4">

                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={setEmail}
                  icon={
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect
                        x="2"
                        y="4"
                        width="20"
                        height="16"
                        rx="2"
                      />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  }
                />

                <Input
                  label="Password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={setPassword}
                  error={error}
                  icon={
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect
                        x="3"
                        y="11"
                        width="18"
                        height="11"
                        rx="2"
                      />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  }
                  rightElement={
                    <button
                      type="button"
                      onClick={() =>
                        setShowPw((v) => !v)
                      }
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {showPw ? 'Hide' : 'Show'}
                    </button>
                  }
                />

                <div className="flex items-center justify-between">

                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">

                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) =>
                        setRemember(e.target.checked)
                      }
                      className="rounded border-slate-300"
                    />

                    Remember me

                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setScreen('forgot');
                      setError('');
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Forgot password?
                  </button>

                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full justify-center"
                  onClick={handleLogin}
                  disabled={loading}
                >
                  {loading
                    ? 'Signing in…'
                    : 'Sign in'}
                </Button>

              </div>
            </>
          )}

          {/* ================================================
              MFA SCREEN
          ================================================= */}

          {screen === 'mfa' && (
            <>
              <div className="mb-8">

                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">

                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="#6366f1"
                    strokeWidth="2"
                  >
                    <rect
                      x="5"
                      y="2"
                      width="14"
                      height="20"
                      rx="2"
                    />

                    <line
                      x1="12"
                      y1="18"
                      x2="12"
                      y2="18"
                    />
                  </svg>

                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                  Verify your identity
                </h1>

                <p className="text-slate-500 text-sm">
                  Enter the 6-digit verification code.
                </p>

              </div>

              <div className="space-y-4">

                <Input
                  label="Verification code"
                  placeholder="000000"
                  value={mfaCode}
                  onChange={setMfaCode}
                  error={error}
                />

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full justify-center"
                  onClick={handleMfa}
                  disabled={loading}
                >
                  {loading
                    ? 'Verifying…'
                    : 'Verify & Sign In'}
                </Button>

                <button
                  type="button"
                  onClick={backToLogin}
                  className="w-full text-sm text-slate-500 hover:text-slate-700"
                >
                  ← Back to sign in
                </button>

                <p className="text-center text-xs text-slate-400 bg-slate-100 rounded-lg p-2">
                  Demo: enter any 6 digits
                </p>

              </div>
            </>
          )}

          {/* ================================================
              FORGOT PASSWORD
          ================================================= */}

          {screen === 'forgot' && (
            <>
              <div className="mb-8">

                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                  Reset password
                </h1>

                <p className="text-slate-500 text-sm">
                  Enter your university email and we'll send a
                  reset link.
                </p>

              </div>

              {forgotSent ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">

                  <p className="text-emerald-800 text-sm font-semibold">
                    Reset link sent
                  </p>

                  <p className="text-emerald-600 text-xs mt-1">
                    Check your email for instructions.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setScreen('login');
                      setForgotSent(false);
                      setError('');
                    }}
                    className="mt-4 text-sm text-indigo-600 font-medium"
                  >
                    Back to sign in
                  </button>

                </div>
              ) : (
                <div className="space-y-4">

                  <Input
                    label="Email address"
                    type="email"
                    placeholder="you@university.edu"
                    value={forgotEmail}
                    onChange={setForgotEmail}
                    error={error}
                  />

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full justify-center"
                    onClick={handleForgot}
                    disabled={loading}
                  >
                    {loading
                      ? 'Sending…'
                      : 'Send reset link'}
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setScreen('login');
                      setError('');
                    }}
                    className="w-full text-sm text-slate-500 hover:text-slate-700"
                  >
                    ← Back to sign in
                  </button>

                </div>
              )}

            </>
          )}

        </div>

      </div>

    </div>
  );
}