import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import Wordmark from '../components/Wordmark.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setPending(true);
    try {
      const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
      await signUp(email.trim(), password, {
        username: username.trim(),
        displayName,
        phone: phone.trim(),
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err?.message || 'Could not create the account.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-t6 text-center">
        <Wordmark to={null} />
        <p className="legend mt-t3 text-tick text-lume-faint">Create account</p>
      </div>

      <form onSubmit={handleSubmit} className="register space-y-t4 p-t5">
        <div className="grid gap-t4 sm:grid-cols-2">
          <div>
            <label htmlFor="first-name" className="field-label">
              First name
            </label>
            <input
              id="first-name"
              type="text"
              autoComplete="given-name"
              required
              minLength={1}
              maxLength={40}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="last-name" className="field-label">
              Last name
            </label>
            <input
              id="last-name"
              type="text"
              autoComplete="family-name"
              required
              minLength={1}
              maxLength={40}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="field"
            />
          </div>
        </div>

        <div>
          <label htmlFor="username" className="field-label">
            Username
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            required
            minLength={3}
            maxLength={30}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="field"
            aria-describedby="username-help"
          />
          <p id="username-help" className="mt-t2 text-micro text-lume-faint">
            Shown on the bid tape.
          </p>
        </div>

        <div>
          <label htmlFor="phone" className="field-label">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            required
            minLength={7}
            maxLength={20}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="555-123-4567"
            className="field"
          />
        </div>

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
          />
        </div>

        <div>
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
            aria-describedby="password-help"
          />
          <p id="password-help" className="mt-t2 text-micro text-lume-faint">
            At least 8 characters.
          </p>
        </div>

        {error && <Alert title="Could not register">{error}</Alert>}

        <button type="submit" disabled={pending} className="ctl-primary w-full">
          {pending ? 'Creating' : 'Create account'}
        </button>
      </form>

      <p className="mt-t4 text-center text-body text-lume-faint">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-lume no-underline hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
