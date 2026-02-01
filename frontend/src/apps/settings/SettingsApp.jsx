import { useState, useEffect } from 'react';
import { useLDAPSettings } from '../../hooks/useSettings';
import { Shield, Server, Key, Search, FileText, Save, Play, AlertCircle, CheckCircle, X } from 'lucide-react';
import { settingsService } from '../../services/settingsService';

export default function SettingsApp() {
  const { settings, loading, error, saving, updateSettings, testConnection } = useLDAPSettings();
  const [formData, setFormData] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [testUsername, setTestUsername] = useState('testuser');

  useEffect(() => {
    if (settings) setFormData(settings);
  }, [settings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await updateSettings(formData);
    if (result.success) {
      setTestResult({ success: true, message: 'Settings saved successfully!' });
      setTimeout(() => setTestResult(null), 3000);
    }
  };

  const handleTest = async () => {
    try {
      const res = await settingsService.testLDAPConnection({ test_username: testUsername });
      setTestResult(res);
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    }
  };

  if (loading && !settings) return <div className="flex justify-center p-8">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Configure LDAP authentication for your organization</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
        </div>
      )}

      {testResult && (
        <div className={`mb-4 p-4 rounded-lg ${testResult.success ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'} border flex items-center gap-3`}>
          {testResult.success ? <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" /> : <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
          <span className={`text-sm ${testResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {testResult.message}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* LDAP Configuration Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">LDAP Configuration</h2>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-gray-600 dark:text-gray-400">Enable LDAP</span>
              <input type="checkbox" name="enabled" checked={formData.enabled || false} onChange={handleChange} className="w-4 h-4 rounded" />
            </label>
          </div>

          <div className="p-6 space-y-6">
            {/* Connection Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Server className="h-5 w-5" /> Connection Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Host *</label>
                  <input type="text" name="host" value={formData.host || ''} onChange={handleChange} disabled={!formData.enabled} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Port *</label>
                  <input type="number" name="port" value={formData.port || 389} onChange={handleChange} disabled={!formData.enabled} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Protocol Version</label>
                  <select name="version" value={formData.version || 3} onChange={handleChange} disabled={!formData.enabled} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800">
                    <option value="3">LDAP v3</option>
                    <option value="2">LDAP v2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timeout (seconds)</label>
                  <input type="number" name="timeout" value={formData.timeout || 5} onChange={handleChange} disabled={!formData.enabled} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-6">
                <label className="flex items-center gap-2"><input type="checkbox" name="use_ssl" checked={formData.use_ssl || false} onChange={handleChange} disabled={!formData.enabled} className="w-4 h-4 rounded" /> <span className="text-sm">Use SSL (LDAPS)</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" name="use_tls" checked={formData.use_tls || false} onChange={handleChange} disabled={!formData.enabled} className="w-4 h-4 rounded" /> <span className="text-sm">Use STARTTLS</span></label>
              </div>
            </div>

            {/* Bind Credentials */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Key className="h-5 w-5" /> Bind Credentials</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bind DN</label>
                  <input type="text" name="bind_dn" value={formData.bind_dn || ''} onChange={handleChange} disabled={!formData.enabled} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800" placeholder="CN=service,DC=company,DC=com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bind Password</label>
                  <input type="password" name="bind_password" value={formData.bind_password || ''} onChange={handleChange} disabled={!formData.enabled} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800" />
                </div>
              </div>
            </div>

            {/* Search Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Search className="h-5 w-5" /> User Search</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Base DN *</label>
                  <input type="text" name="base_dn" value={formData.base_dn || ''} onChange={handleChange} disabled={!formData.enabled} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User Search DN *</label>
                  <input type="text" name="user_search_dn" value={formData.user_search_dn || ''} onChange={handleChange} disabled={!formData.enabled} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Filter *</label>
                  <input type="text" name="user_search_filter" value={formData.user_search_filter || ''} onChange={handleChange} disabled={!formData.enabled} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800" required />
                </div>
              </div>
            </div>

            {/* Certificate Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2"><FileText className="h-5 w-5" /> Certificate</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Certificate Path</label>
                  <input type="text" name="cert_file_path" value={formData.cert_file_path || ''} onChange={handleChange} disabled={!formData.enabled} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Validation Level</label>
                  <select name="cert_require" value={formData.cert_require || 'never'} onChange={handleChange} disabled={!formData.enabled} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800">
                    <option value="never">Never (no validation)</option>
                    <option value="allow">Allow (try validation)</option>
                    <option value="demand">Demand (strict)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Test Username (optional)
        </label>
        <input
            type="text"
            value={testUsername}
            onChange={(e) => setTestUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Enter username to test search (e.g., johndoe)"
        />
        </div>
        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button type="button" onClick={handleTest} disabled={!formData.enabled || saving} className="inline-flex items-center bg-purple-600 gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            <Play className="h-4 w-4" /> Test Connection
          </button>
          <button type="submit" disabled={!formData.enabled || saving} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Important Notes</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 list-disc list-inside space-y-1">
          <li>Changes take effect immediately after saving</li>
          <li>Test connection after saving to verify credentials work</li>
          <li>Certificate file must be placed on server at specified path</li>
          <li>Both LDAP and local authentication work simultaneously</li>
        </ul>
      </div>
    </div>
  );
}