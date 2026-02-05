from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient


class LoginTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username='alice',
            password='password123',
            email='alice@example.com',
        )

    def test_login_invalid_credentials_returns_401(self):
        response = self.client.post(
            '/api/auth/login/',
            {'username': self.user.username, 'password': 'wrong-password'},
            format='json',
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.data.get('detail'), 'Invalid username or password')

    def test_login_unknown_username_returns_401(self):
        response = self.client.post(
            '/api/auth/login/',
            {'username': 'does-not-exist', 'password': 'password123'},
            format='json',
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.data.get('detail'), 'Invalid username or password')

    def test_login_success_returns_user(self):
        response = self.client.post(
            '/api/auth/login/',
            {'username': self.user.username, 'password': 'password123'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.get('message'), 'Login successful')
        self.assertEqual(response.data.get('user', {}).get('username'), self.user.username)

    def test_login_sets_session_cookie(self):
        response = self.client.post(
            '/api/auth/login/',
            {'username': self.user.username, 'password': 'password123'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('sessionid', response.cookies)
        self.assertTrue(response.cookies['sessionid'].value)

        me_response = self.client.get('/api/auth/me/', format='json')
        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.data.get('username'), self.user.username)

    def test_current_user_requires_authentication(self):
        response = self.client.get('/api/auth/me/', format='json')
        self.assertEqual(response.status_code, 403)

    def test_login_disabled_user_returns_403(self):
        disabled_user = get_user_model().objects.create_user(
            username='disabled',
            password='password123',
            email='disabled@example.com',
            is_active=False,
        )

        response = self.client.post(
            '/api/auth/login/',
            {'username': disabled_user.username, 'password': 'password123'},
            format='json',
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data.get('detail'), 'User account is disabled')

    def test_logout_invalidates_session(self):
        login_response = self.client.post(
            '/api/auth/login/',
            {'username': self.user.username, 'password': 'password123'},
            format='json',
        )
        self.assertEqual(login_response.status_code, 200)

        logout_response = self.client.post('/api/auth/logout/', format='json')
        self.assertEqual(logout_response.status_code, 200)

        me_response = self.client.get('/api/auth/me/', format='json')
        self.assertEqual(me_response.status_code, 403)


class AuthSecurityTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='alice',
            password='password123',
            email='alice@example.com',
        )

    def test_logout_requires_csrf_token(self):
        csrf_client = APIClient(enforce_csrf_checks=True)
        csrf_client.login(username=self.user.username, password='password123')

        response = csrf_client.post('/api/auth/logout/', format='json')

        self.assertEqual(response.status_code, 403)
        self.assertIn('CSRF', str(response.data.get('detail', '')))

    def test_ldap_settings_requires_admin(self):
        client = APIClient()
        client.force_authenticate(user=self.user)

        response = client.get('/api/settings/ldap/', format='json')

        self.assertEqual(response.status_code, 403)
