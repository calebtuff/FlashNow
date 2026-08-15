import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import Wordmark from '../components/Wordmark.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setPending(true);
    try {
      await signIn(email.trim(), password);
      navigate(params.get('redirect') || '/', { replace: true });
    } catch (err) {
      setError(err?.message || 'Could not sign in.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-t6 text-center">
        <Wordmark to={null} />
        <p className="legend mt-t3 text-tick text-lume-faint">Sign in</p>
      </div>

      <form onSubmit={handleSubmit} className="register space-y-t4 p-t5">
        <div>
          <label htmlFor="email" className="field-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
            aria-invalid={Boolean(error)}
          />
        </div>

        <div>
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
            aria-invalid={Boolean(error)}
          />
        </div>

        {error && <Alert title="Sign in failed">{error}</Alert>}

        <button type="submit" disabled={pending} className="ctl-primary w-full">
          {pending ? 'Signing in' : 'Sign in'}
        </button>
      </form>

      <p className="mt-t4 text-center text-body text-lume-faint">
        No account?{' '}
        <Link to="/register" className="font-semibold text-lume no-underline hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
