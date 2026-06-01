const envBase = import.meta.env.VITE_API_BASE_URL;

function getApiBase() {
  if (envBase !== undefined && envBase !== '') {
    return String(envBase).replace(/\/$/, '');
  }
  return '/api';
}

function buildUrl(path, query) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBase();
  let url;
  if (base.startsWith('http')) {
    url = new URL(`${base}${normalizedPath}`);
  } else {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    url = new URL(`${base}${normalizedPath}`, origin);
  }

  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.append(key, String(value));
    });
  }

  return url.toString();
}

async function parseResponseBody(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    return text || null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function request(method, path, { body, query, headers } = {}) {
  const response = await fetch(buildUrl(path, query), {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(headers || {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    const error = new Error(
      payload?.message || payload?.error || `Request failed with status ${response.status}`
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export const api = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options = {}) => request('POST', path, { ...options, body }),
  put: (path, body, options = {}) => request('PUT', path, { ...options, body }),
  patch: (path, body, options = {}) => request('PATCH', path, { ...options, body }),
  delete: (path, options) => request('DELETE', path, options),
};

export { getApiBase };
