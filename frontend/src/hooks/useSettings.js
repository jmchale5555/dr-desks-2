import { useState, useEffect, useCallback } from 'react';
import { settingsService } from '../services/settingsService';

export function useLDAPSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await settingsService.getLDAPSettings();
      setSettings(data);
    } catch (err) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (updatedSettings) => {
    setSaving(true);
    try {
      const data = await settingsService.updateLDAPSettings(updatedSettings);
      setSettings(data);
      return { success: true, data };
    } catch (err) {
      setError(err.message || 'Failed to update settings');
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, []);

  const testConnection = useCallback(async () => {
    try {
      return await settingsService.testLDAPConnection();
    } catch (err) {
      setError(err.message || 'Connection test failed');
      throw err;
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return { settings, loading, error, saving, loadSettings, updateSettings, testConnection };
}