import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Panel } from "../ui/Panel.jsx";
import {
  hashesEqual,
  pathForTimetableView,
  readStaffSession,
  sha256Hex,
  STAFF_PIN_HASH,
  timetableViewFromPath,
  writeStaffSession,
} from "./staff.js";

const StaffAuthContext = createContext(null);

export function StaffAuthProvider({ children }) {
  const [signedIn, setSignedIn] = useState(readStaffSession);
  const [loginOpen, setLoginOpen] = useState(false);

  const openLogin = useCallback(() => setLoginOpen(true), []);
  const closeLogin = useCallback(() => setLoginOpen(false), []);

  const signIn = useCallback(async (pin) => {
    const digest = await sha256Hex(String(pin || "").trim());
    if (!hashesEqual(digest, STAFF_PIN_HASH)) return false;
    writeStaffSession(true);
    setSignedIn(true);
    setLoginOpen(false);
    return true;
  }, []);

  const signOut = useCallback(() => {
    writeStaffSession(false);
    setSignedIn(false);
    setLoginOpen(false);
  }, []);

  const value = useMemo(
    () => ({ signedIn, loginOpen, openLogin, closeLogin, signIn, signOut }),
    [signedIn, loginOpen, openLogin, closeLogin, signIn, signOut]
  );

  return (
    <StaffAuthContext.Provider value={value}>
      {children}
      {loginOpen ? <StaffLoginDialog /> : null}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuth() {
  const ctx = useContext(StaffAuthContext);
  if (!ctx) throw new Error("useStaffAuth must be used inside StaffAuthProvider");
  return ctx;
}

export function LoginButton() {
  const { signedIn, openLogin, signOut } = useStaffAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (signedIn) {
    return (
      <button
        type="button"
        className="login-quiet"
        onClick={() => {
          signOut();
          if (timetableViewFromPath(pathname) !== "section") {
            navigate(pathForTimetableView("section"), { replace: true });
          }
        }}
      >
        Sign out
      </button>
    );
  }

  return (
    <button type="button" className="login-quiet" onClick={openLogin}>
      Login
    </button>
  );
}

function StaffLoginDialog() {
  const { signIn, closeLogin, signedIn } = useStaffAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onCancel = useCallback(() => {
    closeLogin();
    if (!signedIn && timetableViewFromPath(pathname) !== "section") {
      navigate(pathForTimetableView("section"), { replace: true });
    }
  }, [closeLogin, signedIn, pathname, navigate]);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const ok = await signIn(pin);
      if (!ok) setError("That PIN does not match.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="staff-backdrop" role="presentation" onClick={onCancel}>
      <Panel
        className="staff-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-login-title"
        onClick={(event) => event.stopPropagation()}
      >
        <form className="staff-form" onSubmit={onSubmit}>
          <label className="field">
            <span id="staff-login-title">PIN</span>
            <input
              type="password"
              name="staff-pin"
              autoComplete="off"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              disabled={busy}
              autoFocus
            />
          </label>
          {error ? <p className="staff-error">{error}</p> : null}
          <button type="submit" className="btn btn-primary" disabled={busy || !pin.trim()}>
            {busy ? "Checking…" : "Sign in"}
          </button>
        </form>
      </Panel>
    </div>
  );
}
