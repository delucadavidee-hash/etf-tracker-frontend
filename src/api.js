/**
 * ETF Tracker API Client v3
 * Handles auth tokens, all API calls, live data from yfinance backend
 */

const BASE = typeof __API_URL__ !== 'undefined' && __API_URL__
  ? __API_URL__
  : (import.meta.env.DEV ? '' : '');

// ─── Token storage ───
export const getToken = () => localStorage.getItem('etf_token');
export const setToken = (t) => localStorage.setItem('etf_token', t);
export const clearToken = () => localStorage.removeItem('etf_token');

// ─── HTTP helper ───
async function req(method, path, body, params) {
  const url = new URL(`${BASE}/api${path}`, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });

  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000),
  });

  if (res.status === 401) { clearToken(); window.location.reload(); }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

const get = (path, params) => req('GET', path, null, params);
const post = (path, body) => req('POST', path, body);
const put = (path, body) => req('PUT', path, body);
const del = (path) => req('DELETE', path);

// ─── Auth ───
export async function register(email, name, password) {
  const data = await post('/auth/register', { email, name, password });
  setToken(data.access_token);
  return data;
}

export async function login(email, password) {
  const form = new URLSearchParams({ username: email, password });
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Login fallito'); }
  const data = await res.json();
  setToken(data.access_token);
  return data;
}

export async function logout() { clearToken(); }
export const getMe = () => get('/auth/me');
export const saveOnboarding = (data) => put('/auth/onboarding', data);
export const savePreferences = (data) => put('/auth/preferences', data);

// ─── Portfolios ───
export const getPortfolios = () => get('/portfolios');
export const createPortfolio = (data) => post('/portfolios', data);
export const updatePortfolio = (id, data) => put(`/portfolios/${id}`, data);
export const deletePortfolio = (id) => del(`/portfolios/${id}`);
export const addHolding = (portfolioId, data) => post(`/portfolios/${portfolioId}/holdings`, data);
export const removeHolding = (portfolioId, isin) => del(`/portfolios/${portfolioId}/holdings/${isin}`);

// ─── ETFs ───
export const searchEtfs = (q) => get('/search', { q });
export const getEtfs = (filters = {}, live = false) => get('/etfs', { ...filters, live });
export const getQuote = (ticker) => get(`/etfs/${ticker}/quote`);
export const getHistory = (ticker, period = '1y', interval = '1d') =>
  get(`/etfs/${ticker}/history`, { period, interval });

// ─── Market & News ───
export const getMarketSummary = () => get('/market/summary');
export const getNews = (tickers = []) => get('/news', { tickers: tickers.join(',') });

// ─── Alerts ───
export const getAlerts = () => get('/alerts');
export const createAlert = (data) => post('/alerts', data);
export const toggleAlert = (id) => put(`/alerts/${id}/toggle`);
export const deleteAlert = (id) => del(`/alerts/${id}`);

// ─── Health ───
export const getHealth = () => get('/health');
