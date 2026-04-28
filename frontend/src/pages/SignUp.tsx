import { BACKEND_URL, AGENT_URL } from "../api";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const navigate = useNavigate();
  const { setUser, isAuthenticated } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/storage-overview", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const handleGoogleOAuth = () => {
    setIsLoading(true);
    window.location.href = `${BACKEND_URL}/auth/login/google`;
  };

  const handleGithubOAuth = () => {
    setIsLoading(true);
    window.location.href = `${BACKEND_URL}/auth/login/github`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        setUser({
          username: data.username,
          email: data.email,
          profile_picture: data.profile_picture || "",
        });

        if (data.access_token) {
          fetch(`${AGENT_URL}/auth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jwt_token: data.access_token, backend_url: `${BACKEND_URL}` }),
          }).catch(console.error);
        }

        setSuccess("Login successful!");
        setTimeout(() => navigate("/storage-overview", { replace: true }), 800);
      } else {
        setError(data.error || "Invalid email or password.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error during login:", error);
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    if (!validateEmail(email)) {
      setError("Invalid email format.");
      return;
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${BACKEND_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        setUser(data.user);

        fetch(`${BACKEND_URL}/auth/check-auth`, { credentials: "include" })
          .then((res) => res.json())
          .then((authData) => {
            if (authData.token) {
              fetch(`${AGENT_URL}/auth`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jwt_token: authData.token, backend_url: `${BACKEND_URL}` }),
              }).catch(console.error);
            }
          });

        setSuccess("Signup successful! Logging you in...");
        setTimeout(() => navigate("/storage-overview", { replace: true }), 1200);
      } else {
        setError(data.error || "Signup failed.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error during signup:", error);
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setError("");
    setSuccess("");
  }, [isLogin]);

  return (
    <div className="bg-surface-container-lowest text-on-surface font-body selection:bg-primary/30">
      <main className="flex min-h-screen w-full">
        {/* Left Panel: Branding */}
        <section className="hidden lg:flex w-1/2 bg-surface-container-lowest flex-col justify-between p-12 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#6C63FF]/5 blur-[150px] rounded-full"></div>

          <header className="relative z-10 flex items-center gap-2">
            <span className="text-2xl font-semibold tracking-tighter text-on-surface">ZenXplor</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#c4c0ff]"></span>
          </header>

          <div className="relative z-10 max-w-md">
            <h1 className="text-[36px] font-bold leading-tight tracking-tight text-on-surface mb-4">
              Find anything. Everywhere.
            </h1>
            <p className="text-on-surface-variant text-base leading-relaxed mb-10">
              Search your local files, Google Drive, Dropbox, and Gmail from one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-lg text-sm font-medium">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#6C63FF" }}></span>
                <span>Local files</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-lg text-sm font-medium">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#4285F4" }}></span>
                <span>Google Drive</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-lg text-sm font-medium">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#0061FF" }}></span>
                <span>Dropbox</span>
              </div>
            </div>
          </div>

          <footer className="relative z-10 text-xs font-mono text-outline-variant tracking-widest uppercase">
            Architecture v2.04 // Midnight Protocol
          </footer>
        </section>

        {/* Right Panel: Login Form */}
        <section className="w-full lg:w-1/2 bg-surface-dim lg:border-l border-outline-variant/10 flex flex-col items-center justify-center p-8 lg:p-24">
          <div className="w-full max-w-[400px]">
            <div className="lg:hidden flex items-center gap-2 mb-12">
              <span className="text-xl font-semibold tracking-tighter text-on-surface">ZenXplor</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#c4c0ff]"></span>
            </div>

            <div className="mb-10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-on-surface mb-2">
                  {isLogin ? "Welcome back" : "Create Account"}
                </h2>
                <p className="text-on-surface-variant text-sm">
                  {isLogin
                    ? "Enter your credentials to access your workspace."
                    : "Join ZenXplor to unify your files."}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start text-sm">
                <span className="material-symbols-outlined text-[18px] mr-2">error</span>
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-start text-sm">
                <span className="material-symbols-outlined text-[18px] mr-2">check_circle</span>
                <p>{success}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={isLogin ? handleLogin : handleSignup}>
              {!isLogin && (
                <div className="space-y-2">
                  <label
                    className="block text-[11px] font-bold text-outline uppercase tracking-[0.5px] ml-1"
                    htmlFor="username"
                  >
                    Username
                  </label>
                  <div className="border border-outline-variant/15 bg-surface-container-lowest rounded-xl flex items-center px-4 py-3.5 transition-all focus-within:border-primary/50 focus-within:shadow-[0_0_0_2px_rgba(196,192,255,0.1)]">
                    <span className="material-symbols-outlined text-outline mr-3 text-[20px]">person</span>
                    <input
                      className="bg-transparent border-none focus:ring-0 text-sm text-on-surface placeholder:text-outline-variant w-full outline-none"
                      id="username"
                      name="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="johndoe"
                      required
                      type="text"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label
                  className="block text-[11px] font-bold text-outline uppercase tracking-[0.5px] ml-1"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <div className="border border-outline-variant/15 bg-surface-container-lowest rounded-xl flex items-center px-4 py-3.5 transition-all focus-within:border-primary/50 focus-within:shadow-[0_0_0_2px_rgba(196,192,255,0.1)]">
                  <span className="material-symbols-outlined text-outline mr-3 text-[20px]">mail</span>
                  <input
                    className="bg-transparent border-none focus:ring-0 text-sm text-on-surface placeholder:text-outline-variant w-full outline-none"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    type="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end mb-1">
                  <label
                    className="block text-[11px] font-bold text-outline uppercase tracking-[0.5px] ml-1"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  {isLogin && (
                    <a
                      className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                      onClick={(e) => e.preventDefault()}
                    >
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="border border-outline-variant/15 bg-surface-container-lowest rounded-xl flex items-center px-4 py-3.5 transition-all focus-within:border-primary/50 focus-within:shadow-[0_0_0_2px_rgba(196,192,255,0.1)]">
                  <span className="material-symbols-outlined text-outline mr-3 text-[20px]">lock</span>
                  <input
                    className="bg-transparent border-none focus:ring-0 text-sm text-on-surface placeholder:text-outline-variant w-full outline-none"
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    type="password"
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <label
                    className="block text-[11px] font-bold text-outline uppercase tracking-[0.5px] ml-1"
                    htmlFor="confirmPassword"
                  >
                    Confirm Password
                  </label>
                  <div className="border border-outline-variant/15 bg-surface-container-lowest rounded-xl flex items-center px-4 py-3.5 transition-all focus-within:border-primary/50 focus-within:shadow-[0_0_0_2px_rgba(196,192,255,0.1)]">
                    <span className="material-symbols-outlined text-outline mr-3 text-[20px]">lock_reset</span>
                    <input
                      className="bg-transparent border-none focus:ring-0 text-sm text-on-surface placeholder:text-outline-variant w-full outline-none"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      type="password"
                    />
                  </div>
                </div>
              )}

              <button
                className="w-full bg-gradient-to-r from-[#c4c0ff] to-[#8781ff] text-[#1a1b23] font-bold py-4 rounded-xl shadow-[0_4px_14px_0_rgba(196,192,255,0.2)] hover:shadow-[0_6px_20px_rgba(196,192,255,0.23)] transition-all active:scale-[0.98] mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
                type="submit"
                disabled={isLoading}
              >
                {isLoading && (
                  <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                )}
                {isLogin ? "Sign in" : "Create account"}
              </button>
            </form>

            <div className="relative my-8 flex items-center">
              <div className="flex-grow border-t border-outline-variant/10"></div>
              <span className="mx-4 text-xs font-mono text-outline-variant uppercase">or</span>
              <div className="flex-grow border-t border-outline-variant/10"></div>
            </div>

            <button
              onClick={handleGoogleOAuth}
              type="button"
              disabled={isLoading}
              className="w-full border border-outline-variant/15 bg-transparent text-on-surface font-medium py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-surface-container transition-all active:scale-[0.98] disabled:opacity-50 mb-3"
            >
              <img
                alt="Google Logo"
                className="w-5 h-5"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2vT_Z-nunce_uLhgpcby1NUO_ZWdRjcw-jP769B-k4MDiWoaNOeN93UGP5-Ds-ss_ZQ4StOaamPNlVZP4sCN_iG1hy0Z53m2K9tC_joDFI5Y4iroF1cuIny7DI10CKqmUGBwpObv1KzHn7SjV6QfIieZ4-5kiVMpIt9INnvkx9ZeuKQ9nVtwRxBcjZ0LF8vZkLjxUHoDKzIOvcr_WdzGqu6rFbCQfP1MWc69Cjtc41JUkxJi1Jy3ewsaR-IsVD3Xe1zBns4rKeKU"
              />
              Continue with Google
            </button>

            <button
              onClick={handleGithubOAuth}
              type="button"
              disabled={isLoading}
              className="w-full border border-outline-variant/15 bg-transparent text-on-surface font-medium py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-surface-container transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>

            <p className="mt-10 text-center text-sm text-on-surface-variant">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-semibold hover:underline ml-1 cursor-pointer"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </section>
      </main>

      {/* Ambient UI Overlay */}
      <div className="fixed top-8 right-8 pointer-events-none hidden lg:block">
        <div className="bg-surface-container-low/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-outline-variant/10 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></span>
          <span className="text-[10px] font-mono text-outline tracking-wider uppercase">
            System Operational
          </span>
        </div>
      </div>
    </div>
  );
};

export default Auth;