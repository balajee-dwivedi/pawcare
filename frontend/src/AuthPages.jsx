import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { api } from './client.js';
import { Alert, PawMark } from './UI.jsx';
import PasswordInput from './PasswordInput.jsx';

function destinationFor(role) {
  return ({ user: '/dashboard', volunteer: '/volunteer', shelter: '/shelter', admin: '/admin' })[role] || '/dashboard';
}

// Code screen used after registering and after logging in to an unverified account.
function VerifyStep({ account, token, onDone }) {
  const { startSession } = useAuth();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const sentInitialRef = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function sendCode() {
    setError('');
    setNotice('');
    try {
      const result = await api.sendVerificationCode(token);
      setNotice(result.message);
      setCooldown(60);
    } catch (e) {
      setError(e.message);
    }
  }

  // Send the first code once as soon as the screen opens.
  useEffect(() => {
    if (sentInitialRef.current) return;
    sentInitialRef.current = true;
    sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitCode(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const code = String(new FormData(event.currentTarget).get('code') || '').trim();
    try {
      await api.verifyEmailCode(token, code);
      startSession({ user: { ...account, emailVerified: true }, token });
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function verifyLater() {
    startSession({ user: account, token });
    onDone();
  }

  return (
    <main className="auth-section">
      <section className="auth-card">
        <PawMark />
        <div className="eyebrow">ONE LAST STEP</div>
        <h1>Check your email.</h1>
        <p>We sent a 6-digit code to <strong>{account.email}</strong>. It expires in 10 minutes.</p>
        {error && <div style={{ marginBottom: 15 }}><Alert kind="error">{error}</Alert></div>}
        {notice && <p className="form-hint" style={{ marginBottom: 15 }}>{notice}</p>}
        <form className="auth-fields" onSubmit={submitCode}>
          <div className="form-field">
            <label htmlFor="code">Verification code</label>
            <input id="code" name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code" placeholder="123456" />
          </div>
          <button className="button button-primary" disabled={busy}>{busy ? 'Verifying…' : 'Verify email'}</button>
        </form>
        <div className="auth-bottom">
          <button type="button" className="button button-outline button-small" disabled={cooldown > 0 || busy} onClick={sendCode}>
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </button>
        </div>
        <div className="auth-bottom">
          <button type="button" className="button button-outline button-small" onClick={verifyLater}>Verify later</button>
        </div>
      </section>
    </main>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const form = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const { user, token } = await login(form);
      if (!user.emailVerified) {
        setPending({ account: user, token });
        return;
      }
      navigate(location.state?.from || destinationFor(user.role), { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (pending) {
    return (
      <VerifyStep
        account={pending.account}
        token={pending.token}
        onDone={() => navigate(destinationFor(pending.account.role), { replace: true })}
      />
    );
  }

  return (
    <main className="auth-section">
      <section className="auth-card">
        <PawMark />
        <div className="eyebrow">GOOD TO SEE YOU</div>
        <h1>Welcome back.</h1>
        <p>Sign in to follow a report, coordinate a rescue, or manage a shelter listing.</p>
        {error && <div style={{ marginBottom: 15 }}><Alert kind="error">{error}</Alert></div>}
        <form className="auth-fields" onSubmit={submit}>
          <div className="form-field">
            <label htmlFor="email">Email address</label>
            <input type="email" id="email" name="email" required autoComplete="email" placeholder="you@example.com" />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <PasswordInput id="password" name="password" required autoComplete="current-password" placeholder="Your password" />
          </div>
          <div style={{ textAlign: 'right', marginTop: -6 }}>
            <Link
              to="/forgot-password"
              style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}
            >
              Forgot password?
            </Link>
          </div>
          <button className="button button-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <div className="auth-bottom">New to PawCare? <Link to="/register">Create an account</Link></div>
      </section>
    </main>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submitForm(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const form = Object.fromEntries(new FormData(event.currentTarget));
    if (form.password !== form.confirmPassword) {
      setError('Those passwords do not match.');
      setBusy(false);
      return;
    }
    delete form.confirmPassword;
    try {
      const result = await register(form);
      setSession(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (session) {
    return (
      <VerifyStep
        account={session.user}
        token={session.token}
        onDone={() => navigate(destinationFor(session.user.role), { replace: true })}
      />
    );
  }

  return (
    <main className="auth-section">
      <section className="auth-card">
        <PawMark />
        <div className="eyebrow">JOIN YOUR NEIGHBORS</div>
        <h1>Make care count.</h1>
        <p>Create a community account to report an animal, follow updates, or help reunite a lost pet.</p>
        {error && <div style={{ marginBottom: 15 }}><Alert kind="error">{error}</Alert></div>}
        <form className="auth-fields" onSubmit={submitForm}>
          <div className="form-field">
            <label htmlFor="name">Your name</label>
            <input id="name" name="name" required maxLength="90" autoComplete="name" placeholder="Name" />
          </div>
          <div className="form-field">
            <label htmlFor="role">I am joining as</label>
            <select id="role" name="role" required defaultValue="user">
              <option value="user">A community member (report animals)</option>
              <option value="volunteer">A volunteer (help with rescues)</option>
              <option value="shelter">A shelter or rescue group</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="email">Email address</label>
            <input type="email" id="email" name="email" required autoComplete="email" placeholder="you@example.com" />
          </div>
          <div className="form-field">
            <label htmlFor="phone">Phone number</label>
            <input id="phone" name="phone" required autoComplete="tel" placeholder="How a rescuer can reach you" />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <PasswordInput id="password" name="password" required minLength="8" autoComplete="new-password" placeholder="At least 8 characters" />
          </div>
          <div className="form-field">
            <label htmlFor="confirmPassword">Confirm password</label>
            <PasswordInput id="confirmPassword" name="confirmPassword" required minLength="8" autoComplete="new-password" placeholder="Type it again" />
          </div>
          <button className="button button-primary" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        </form>
        <div className="auth-bottom">Already have an account? <Link to="/login">Sign in</Link></div>
      </section>
    </main>
  );
}

export function ForgotPasswordPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    const email = String(new FormData(event.currentTarget).get('email') || '');
    try {
      const result = await api.forgotPassword(email);
      setMessage(result.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-section">
      <section className="auth-card">
        <PawMark />
        <div className="eyebrow">ACCOUNT HELP</div>
        <h1>Forgot your password?</h1>
        <p>Enter the email you signed up with and we'll send you a link to set a new password.</p>
        {error && <div style={{ marginBottom: 15 }}><Alert kind="error">{error}</Alert></div>}
        {message && <div style={{ marginBottom: 15 }}><Alert kind="success">{message}</Alert></div>}
        <form className="auth-fields" onSubmit={submit}>
          <div className="form-field">
            <label htmlFor="email">Email address</label>
            <input type="email" id="email" name="email" required autoComplete="email" placeholder="you@example.com" />
          </div>
          <button className="button button-primary" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
        </form>
        <div className="auth-bottom"><Link to="/login">Back to sign in</Link></div>
      </section>
    </main>
  );
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    const form = Object.fromEntries(new FormData(event.currentTarget));
    if (form.password !== form.confirmPassword) {
      setError('Those passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const result = await api.resetPassword(token, form.password);
      setMessage(result.message);
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-section">
      <section className="auth-card">
        <PawMark />
        <div className="eyebrow">NEW PASSWORD</div>
        <h1>Set a new password.</h1>
        {!token && <Alert kind="error">This reset link is incomplete. Please request a new one.</Alert>}
        {error && <div style={{ marginBottom: 15 }}><Alert kind="error">{error}</Alert></div>}
        {done ? (
          <>
            <div style={{ marginBottom: 15 }}><Alert kind="success">{message}</Alert></div>
            <div className="auth-bottom"><Link to="/login">Sign in with your new password</Link></div>
          </>
        ) : (
          token && (
            <form className="auth-fields" onSubmit={submit}>
              <div className="form-field">
                <label htmlFor="password">New password</label>
                <PasswordInput id="password" name="password" required minLength="8" autoComplete="new-password" placeholder="At least 8 characters" />
              </div>
              <div className="form-field">
                <label htmlFor="confirmPassword">Confirm new password</label>
                <PasswordInput id="confirmPassword" name="confirmPassword" required minLength="8" autoComplete="new-password" placeholder="Type it again" />
              </div>
              <button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</button>
            </form>
          )
        )}
        <div className="auth-bottom"><Link to="/forgot-password">Request a new link</Link></div>
      </section>
    </main>
  );
}