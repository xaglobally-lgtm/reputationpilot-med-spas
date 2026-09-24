// ================================================================
// APP TEMPLATE - REACT 19 FRONTEND
// ================================================================
// Production-grade React component with:
// - Tailwind CSS v4 styling
// - i18n support (14 languages)
// - Multi-currency display
// - API integration
// - Error handling
// - Responsive design
// ================================================================

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  database: {
    status: 'connected' | 'error';
    responseTime?: number;
  };
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
}

interface ApiTestResult {
  message: string;
  user: string;
  timestamp: string;
  environment: string;
  app: string;
}

function App() {
  const { t, i18n } = useTranslation();
  const [apiStatus, setApiStatus] = useState<HealthStatus | null>(null);
  const [testResult, setTestResult] = useState<ApiTestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [darkMode, setDarkMode] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Fetch API health status
  const checkApiHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<HealthStatus>(`${API_URL}/health`);
      setApiStatus(response.data);
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
      setApiStatus(null);
    } finally {
      setLoading(false);
    }
  };

  // Test API endpoint
  const testApi = async () => {
    setLoading(true);
    setError(null);
    try {
      // No key is sent: a public page must never contain one. A 401 proves the API is protected.
      const response = await axios.get<ApiTestResult>(`${API_URL}/api/test`);
      setTestResult(response.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('API is protected: it only answers requests that carry a valid API key or sign-in. This is expected.');
      } else {
        setError(String(err instanceof Error ? err.message : err));
      }
    } finally {
      setLoading(false);
    }
  };

  // Check health on mount
  useEffect(() => {
    checkApiHealth();
    const interval = setInterval(checkApiHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Format memory
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        {/* Header */}
        <header className="border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">
                  {t('common:app_name', 'App Template')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {t('common:tagline', 'Production-grade template for 100 apps')}
                </p>
              </div>
              <div className="flex gap-4">
                {/* Language selector */}
                <select
                  value={i18n.language}
                  onChange={(e) => i18n.changeLanguage(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">日本語</option>
                  <option value="zh">中文</option>
                  <option value="ko">한국어</option>
                  <option value="pt">Português</option>
                </select>

                {/* Currency selector */}
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="USD">USD $</option>
                  <option value="EUR">EUR €</option>
                  <option value="GBP">GBP £</option>
                  <option value="JPY">JPY ¥</option>
                  <option value="CNY">CNY ¥</option>
                  <option value="INR">INR ₹</option>
                </select>

                {/* Dark mode toggle */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Toggle dark mode"
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Status cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* API Status */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🔌</span>
                {t('common:api_status', 'API Status')}
              </h2>
              {apiStatus ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`font-semibold ${
                      apiStatus.status === 'healthy' ? 'text-green-600' :
                      apiStatus.status === 'degraded' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {apiStatus.status === 'healthy' ? '✅' : 
                       apiStatus.status === 'degraded' ? '⚠️' : 
                       '❌'} {apiStatus.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">DB Response:</span>
                    <span>{apiStatus.database.responseTime}ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Uptime:</span>
                    <span>{Math.floor(apiStatus.uptime)}s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Memory:</span>
                    <span>{formatBytes(apiStatus.memory.heapUsed)} / {formatBytes(apiStatus.memory.heapTotal)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  {loading ? 'Loading...' : error ? `Error: ${error}` : 'No data'}
                </p>
              )}
            </div>

            {/* Test API */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🧪</span>
                {t('common:api_test', 'API Test')}
              </h2>
              <button
                onClick={testApi}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition mb-4"
              >
                {loading ? 'Testing...' : 'Run Test'}
              </button>
              {testResult && (
                <div className="text-sm space-y-2">
                  <p><span className="text-gray-600 dark:text-gray-400">Message:</span> {testResult.message}</p>
                  <p><span className="text-gray-600 dark:text-gray-400">User:</span> {testResult.user}</p>
                  <p><span className="text-gray-600 dark:text-gray-400">Environment:</span> {testResult.environment}</p>
                  <p><span className="text-gray-600 dark:text-gray-400">App:</span> {testResult.app}</p>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: '⚡', title: 'Fast', desc: 'React 19 + Vite for lightning speed' },
                { icon: '🎨', title: 'Styled', desc: 'Tailwind CSS v4 with dark mode' },
                { icon: '🌍', title: 'Multilingual', desc: '14 languages built-in' },
                { icon: '💰', title: 'Multi-Currency', desc: 'Display prices in any currency' },
                { icon: '🔐', title: 'Secure', desc: 'API key validation & CORS' },
                { icon: '📊', title: 'Monitored', desc: 'Health checks & error alerts' },
              ].map((feature, i) => (
                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-3xl mb-2">{feature.icon}</div>
                  <h3 className="font-bold text-lg">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Documentation links */}
          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-bold mb-3">📚 Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="https://github.com/xaglobally-lgtm/reputationpilot-med-spas" target="_blank" rel="noopener" className="text-blue-600 hover:underline">→ GitHub Repository</a></li>
              <li><a href="#" className="text-blue-600 hover:underline">→ API Documentation</a></li>
              <li><a href="#" className="text-blue-600 hover:underline">→ Deployment Guide</a></li>
              <li><a href="#" className="text-blue-600 hover:underline">→ Customization Guide</a></li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
