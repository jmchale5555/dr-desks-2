import logging
from django_auth_ldap.backend import LDAPBackend
from django_auth_ldap.config import LDAPSettings, LDAPSearch
from parcark.ldap_config import configure_ldap, get_ldap_settings

logger = logging.getLogger(__name__)

class DynamicLDAPBackend(LDAPBackend):
    """LDAP backend that reloads settings from DB on every auth attempt"""
    
    def _reload_settings(self):
        """Update Django settings and force backend to refresh its config"""
        from django.conf import settings
        
        # Get fresh LDAP settings from DB
        ldap_settings = configure_ldap()
        if not ldap_settings:
            logger.debug("LDAP disabled or not configured; skipping LDAP settings reload")
            return False
        
        # Apply to Django settings object
        for key, value in ldap_settings.items():
            setattr(settings, key, value)
            logger.debug(f"Set {key} = {type(value)}")
        
        # Force reinitialize django-auth-ldap settings from Django conf
        self.settings = LDAPSettings()
        
        # Verify USER_SEARCH is correct type
        if not hasattr(self.settings, 'USER_SEARCH') or not self.settings.USER_SEARCH:
            logger.error("USER_SEARCH is not set or is None!")
        elif not isinstance(self.settings.USER_SEARCH, LDAPSearch):
            logger.error(f"USER_SEARCH is wrong type: {type(self.settings.USER_SEARCH)}")
        else:
            logger.debug(f"✓ USER_SEARCH is correct: {self.settings.USER_SEARCH}")

        return True
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        if not username or not password:
            return None

        ldap_runtime = get_ldap_settings()
        if not ldap_runtime.get('enabled', False):
            logger.debug("LDAP disabled; skipping LDAP auth backend")
            return None
        
        try:
            # Reload settings BEFORE each auth attempt
            loaded = self._reload_settings()
            if not loaded:
                return None
            
            # Now proceed with authentication
            return super().authenticate(request, username=username, password=password, **kwargs)
            
        except Exception as e:
            logger.error(f"LDAP auth error for {username}: {e}", exc_info=True)
            return None
