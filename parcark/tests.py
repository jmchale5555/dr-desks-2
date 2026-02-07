from django.contrib.auth import get_user_model
from django.test import TestCase
from django.test.utils import override_settings
from rest_framework.test import APIClient
from datetime import date, timedelta
from unittest import skip

from .models import Room, Booking


@override_settings(AUTHENTICATION_BACKENDS=['django.contrib.auth.backends.ModelBackend'])
class LoginTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username='alice',
            password='password123',
            email='alice@example.com',
        )

    def test_login_invalid_credentials_returns_403(self):
        response = self.client.post(
            '/api/auth/login/',
            {'username': self.user.username, 'password': 'wrong-password'},
            format='json',
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data.get('detail'), 'Invalid username or password')

    def test_login_unknown_username_returns_403(self):
        response = self.client.post(
            '/api/auth/login/',
            {'username': 'does-not-exist', 'password': 'password123'},
            format='json',
        )

        self.assertEqual(response.status_code, 403)
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
        self.assertEqual(response.data.get('detail'), 'Invalid username or password')

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


@override_settings(AUTHENTICATION_BACKENDS=['django.contrib.auth.backends.ModelBackend'])
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


@override_settings(AUTHENTICATION_BACKENDS=['django.contrib.auth.backends.ModelBackend'])
class AnalyticsDateRangeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username='analytics_user',
            password='password123',
            email='analytics@example.com',
        )
        self.client.force_authenticate(user=self.user)

        self.room = Room.objects.create(name='Room A', number_of_desks=1)
        self.desk = self.room.desks.first()

    def test_analytics_defaults_to_30_day_window_when_no_params(self):
        response = self.client.get('/api/analytics/', format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data.get('startDate'),
            (date.today() - timedelta(days=30)).isoformat(),
        )
        self.assertEqual(
            response.data.get('endDate'),
            (date.today() + timedelta(days=30)).isoformat(),
        )

    def test_analytics_uses_explicit_date_range(self):
        start_date = date.today() + timedelta(days=1)
        end_date = date.today() + timedelta(days=3)

        Booking.objects.create(
            user=self.user,
            desk=self.desk,
            date=start_date + timedelta(days=1),
            period='am',
        )
        Booking.objects.create(
            user=self.user,
            desk=self.desk,
            date=end_date + timedelta(days=2),
            period='pm',
        )

        response = self.client.get(
            '/api/analytics/',
            {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.get('startDate'), start_date.isoformat())
        self.assertEqual(response.data.get('endDate'), end_date.isoformat())
        self.assertEqual(response.data.get('totalBookings'), 1)

    def test_analytics_rejects_invalid_start_date_format(self):
        response = self.client.get(
            '/api/analytics/',
            {'start_date': '2026/01/01', 'end_date': '2026-01-10'},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data.get('error'),
            'Invalid start_date format. Use YYYY-MM-DD.',
        )

    def test_analytics_rejects_start_date_after_end_date(self):
        response = self.client.get(
            '/api/analytics/',
            {'start_date': '2026-02-10', 'end_date': '2026-02-01'},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.data.get('error'),
            'start_date cannot be after end_date.',
        )


@skip('LDAP auth tests temporarily disabled until LDAP backend is re-enabled')
class LDAPAuthTests(TestCase):
    """Placeholder suite for LDAP authentication behavior tests."""

    def test_ldap_login_flow_placeholder(self):
        pass
