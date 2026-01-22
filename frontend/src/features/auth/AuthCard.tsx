import { useState, type FormEvent } from "react";
import { useMutation } from "@apollo/client/react";
import {
  LOGIN_MUTATION,
  LOGOUT_MUTATION,
  REGISTER_MUTATION,
} from "../../graphql/operations";
import type {
  LoginData,
  LoginVars,
  LogoutData,
  RegisterData,
  RegisterVars,
  User,
} from "../../types";

type AuthMode = "login" | "register";

type AuthCardProps = {
  user: User | null;
  loading: boolean;
  onAuthSuccess: () => Promise<unknown> | void;
};

export const AuthCard = ({ user, loading, onAuthSuccess }: AuthCardProps) => {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  const [registerUser, { loading: registerLoading }] = useMutation<
    RegisterData,
    RegisterVars
  >(REGISTER_MUTATION);

  const [loginUser, { loading: loginLoading }] = useMutation<
    LoginData,
    LoginVars
  >(LOGIN_MUTATION);

  const [logoutUser, { loading: logoutLoading }] =
    useMutation<LogoutData>(LOGOUT_MUTATION);

  const handleAuthSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setAuthError(null);

    const email = authForm.email.trim().toLowerCase();
    const password = authForm.password;

    if (!email || !password) {
      setAuthError("Email and password are required.");
      return;
    }

    try {
      if (authMode === "login") {
        await loginUser({ variables: { input: { email, password } } });
      } else {
        await registerUser({
          variables: {
            input: {
              email,
              password,
              confirmPassword: authForm.confirmPassword,
              name: authForm.name.trim() || null,
            },
          },
        });
      }

      await onAuthSuccess();
      setAuthForm({ email: "", password: "", confirmPassword: "", name: "" });
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleLogout = async () => {
    setAuthError(null);
    try {
      await logoutUser();
      await onAuthSuccess();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Logout failed");
    }
  };

  return (
    <div className="card animate-fade-up p-6">
      <h3 className="text-lg font-semibold text-ink-900">
        {user ? "Account" : "Sign in"}
      </h3>

      {loading && (
        <p className="mt-3 text-sm text-ink-500">Checking session...</p>
      )}

      {!user && !loading && (
        <div className="mt-4">
          <div className="flex gap-2">
            <button
              type="button"
              className={
                authMode === "login" ? "primary-button" : "ghost-button"
              }
              onClick={() => setAuthMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={
                authMode === "register" ? "primary-button" : "ghost-button"
              }
              onClick={() => setAuthMode("register")}
            >
              Register
            </button>
          </div>

          <form className="mt-4 space-y-3" onSubmit={handleAuthSubmit}>
            {authMode === "register" && (
              <input
                className="soft-input"
                placeholder="Name (optional)"
                value={authForm.name}
                onChange={(event) =>
                  setAuthForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            )}
            <input
              className="soft-input"
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(event) =>
                setAuthForm((prev) => ({ ...prev, email: event.target.value }))
              }
              required
            />
            <input
              className="soft-input"
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(event) =>
                setAuthForm((prev) => ({
                  ...prev,
                  password: event.target.value,
                }))
              }
              required
            />
            {authMode === "register" && (
              <input
                className="soft-input"
                type="password"
                placeholder="Confirm password"
                value={authForm.confirmPassword}
                onChange={(event) =>
                  setAuthForm((prev) => ({
                    ...prev,
                    confirmPassword: event.target.value,
                  }))
                }
                required
              />
            )}
            {authError && <p className="text-sm text-red-600">{authError}</p>}
            <button
              className="primary-button w-full"
              type="submit"
              disabled={loginLoading || registerLoading}
            >
              {authMode === "login"
                ? loginLoading
                  ? "Signing in..."
                  : "Sign in"
                : registerLoading
                  ? "Creating account..."
                  : "Create account"}
            </button>
          </form>
        </div>
      )}

      {user && (
        <div className="mt-4 space-y-3 text-sm text-ink-700">
          <p>
            You are signed in as <strong>{user.email}</strong>. Create a poll to
            start collecting votes.
          </p>
          <button
            className="ghost-button"
            type="button"
            onClick={handleLogout}
            disabled={logoutLoading}
          >
            {logoutLoading ? "Signing out..." : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
};
