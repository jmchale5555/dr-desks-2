import logging
import ldap

logger = logging.getLogger(__name__)

def get_ldap_settings():
    """Fetch settings from DB - safe to call anytime"""
    # ALL imports INSIDE function
    from django.core.cache import cache
    from .models import LDAPSettings
    
    cached = cache.get('ldap_settings')
    if cached:
        return cached
    
    try:
        db = LDAPSettings.get_settings()
        
        if not db.enabled:
            settings = {'enabled': False}
        else:
            settings = {
                'enabled': True,
                'host': db.host,
                'port': db.port,
                'base_dn': db.base_dn,
                'user_dn': db.user_search_dn,
                'use_ssl': db.use_ssl,
                'use_tls': db.use_tls,
                'protocol': 'ldaps://' if db.use_ssl else 'ldap://',
                'version': db.version,
                'timeout': db.timeout,
                'bind_dn': db.bind_dn,
                'bind_password': db.get_bind_password(),
                'cert_file': db.cert_file_path,
                'cert_require': {
                    'never': ldap.OPT_X_TLS_NEVER, 
                    'allow': ldap.OPT_X_TLS_ALLOW, 
                    'demand': ldap.OPT_X_TLS_DEMAND
                }[db.cert_require],
                'user_search_filter': db.user_search_filter,
                'attr_map': {
                    "first_name": db.attr_map_first_name,
                    "last_name": db.attr_map_last_name,
                    "email": db.attr_map_email,
                },
            }
        
        cache.set('ldap_settings', settings, 300)
        return settings
    except Exception as e:
        logger.error(f"Error loading LDAP settings: {e}", exc_info=True)
        return {'enabled': False}

def configure_ldap():
    """Convert DB settings to django-auth-ldap format"""
    config = get_ldap_settings()
    if not config.get('enabled', False):
        return {}
    
    # Import here, not at top
    from django_auth_ldap.config import LDAPSearch
    
    connection_options = {
        ldap.OPT_REFERRALS: 0,
        ldap.OPT_PROTOCOL_VERSION: config['version'],
        ldap.OPT_NETWORK_TIMEOUT: config['timeout'],
    }
    
    if config['use_ssl'] or config['use_tls']:
        connection_options[ldap.OPT_X_TLS_REQUIRE_CERT] = config['cert_require']
        if config['cert_file']:
            connection_options[ldap.OPT_X_TLS_CACERTFILE] = config['cert_file']
    
    return {
        'AUTH_LDAP_SERVER_URI': f"{config['protocol']}{config['host']}:{config['port']}",
        'AUTH_LDAP_CONNECTION_OPTIONS': connection_options,
        'AUTH_LDAP_BIND_DN': config['bind_dn'],
        'AUTH_LDAP_BIND_PASSWORD': config['bind_password'],
        'AUTH_LDAP_USER_SEARCH': LDAPSearch(config['user_dn'], ldap.SCOPE_SUBTREE, config['user_search_filter']),
        'AUTH_LDAP_USER_ATTR_MAP': config['attr_map'],
        'AUTH_LDAP_ALWAYS_UPDATE_USER': True,
        'AUTH_LDAP_FIND_GROUP_PERMS': False,
        'AUTH_LDAP_MIRROR_GROUPS': False,
        'AUTH_LDAP_START_TLS': config['use_tls'],
    }