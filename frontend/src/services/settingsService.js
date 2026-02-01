import { api } from './api';

export const settingsService = {
  getLDAPSettings: () => api.get('/settings/ldap/'),
  updateLDAPSettings: (settings) => api.put('/settings/ldap/1/', settings),
  testLDAPConnection: (testData = {}) => api.post('/settings/ldap/1/test-connection/', testData),
};