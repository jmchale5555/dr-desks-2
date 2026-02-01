from django.core.management.base import BaseCommand
from django.contrib.auth import authenticate
from parcark.ldap_config import get_ldap_settings, configure_ldap
import ldap

class Command(BaseCommand):
    help = 'Test LDAP connection and authentication'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='LDAP username to test')
        parser.add_argument('password', type=str, help='Password')

    def handle(self, *args, **options):
        username = options['username']
        password = options['password']
        
        config = get_ldap_settings()
        
        if not config['enabled']:
            self.stdout.write(self.style.WARNING('LDAP is disabled in settings'))
            return
        
        self.stdout.write(f"Testing LDAP connection to {config['host']}...")
        self.stdout.write(f"Protocol: {config['protocol']}")
        self.stdout.write(f"Port: {config['port']}")
        self.stdout.write(f"SSL: {config['use_ssl']}, TLS: {config['use_tls']}")
        
        # Test connection
        try:
            server_uri = f"{config['protocol']}{config['host']}:{config['port']}"
            self.stdout.write(f"Connecting to: {server_uri}")
            
            conn = ldap.initialize(server_uri)
            conn.set_option(ldap.OPT_PROTOCOL_VERSION, config['version'])
            conn.set_option(ldap.OPT_NETWORK_TIMEOUT, config['timeout'])
            conn.set_option(ldap.OPT_REFERRALS, 0)
            
            # TLS/SSL configuration
            if config.get('use_ssl') or config.get('use_tls'):
                self.stdout.write("Configuring TLS/SSL options...")
                
                # Certificate validation settings
                cert_file = config.get('cert_file')
                if cert_file:
                    self.stdout.write(f"Using certificate: {cert_file}")
                    conn.set_option(ldap.OPT_X_TLS_CACERTFILE, cert_file)
                
                # Set certificate requirement level
                cert_require = config.get('cert_require', ldap.OPT_X_TLS_NEVER)
                conn.set_option(ldap.OPT_X_TLS_REQUIRE_CERT, cert_require)
                
                cert_level_names = {
                    ldap.OPT_X_TLS_NEVER: "NEVER",
                    ldap.OPT_X_TLS_HARD: "HARD",
                    ldap.OPT_X_TLS_DEMAND: "DEMAND",
                    ldap.OPT_X_TLS_ALLOW: "ALLOW",
                    ldap.OPT_X_TLS_TRY: "TRY"
                }
                self.stdout.write(f"Certificate validation: {cert_level_names.get(cert_require, cert_require)}")
                
                # Start TLS if using ldap:// with STARTTLS
                if config.get('use_tls') and config['protocol'] == 'ldap://':
                    self.stdout.write("Initiating STARTTLS...")
                    conn.start_tls_s()
            
            self.stdout.write(self.style.SUCCESS('✓ LDAP server connection successful'))
            
            # Test bind with service account first if configured
            if config.get('bind_dn') and config.get('bind_password'):
                self.stdout.write(f"\nTesting service account bind: {config['bind_dn']}")
                try:
                    conn.simple_bind_s(config['bind_dn'], config['bind_password'])
                    self.stdout.write(self.style.SUCCESS('✓ Service account bind successful'))
                    conn.unbind()
                    
                    # Reconnect for user bind test
                    conn = ldap.initialize(server_uri)
                    conn.set_option(ldap.OPT_PROTOCOL_VERSION, config['version'])
                    conn.set_option(ldap.OPT_NETWORK_TIMEOUT, config['timeout'])
                    conn.set_option(ldap.OPT_REFERRALS, 0)
                    
                    if config.get('use_ssl') or config.get('use_tls'):
                        if config.get('cert_file'):
                            conn.set_option(ldap.OPT_X_TLS_CACERTFILE, config['cert_file'])
                        conn.set_option(ldap.OPT_X_TLS_REQUIRE_CERT, config.get('cert_require', ldap.OPT_X_TLS_DEMAND))
                        if config.get('use_tls') and config['protocol'] == 'ldap://':
                            conn.start_tls_s()
                    
                except ldap.INVALID_CREDENTIALS:
                    self.stdout.write(self.style.ERROR('✗ Service account invalid credentials'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'✗ Service account bind failed: {str(e)}'))
            
            # Test user bind
            user_dn = f"CN={username},{config['user_dn']}"
            self.stdout.write(f"\nAttempting user bind as: {user_dn}")
            
            conn.simple_bind_s(user_dn, password)
            self.stdout.write(self.style.SUCCESS('✓ LDAP user bind successful'))
            
            # Search for user attributes
            try:
                self.stdout.write("\nSearching for user attributes...")
                result = conn.search_s(
                    user_dn,
                    ldap.SCOPE_BASE,
                    '(objectClass=*)',
                    ['givenName', 'sn', 'mail', 'sAMAccountName', 'memberOf']
                )
                
                if result:
                    dn, attrs = result[0]
                    self.stdout.write(self.style.SUCCESS('✓ User attributes retrieved'))
                    self.stdout.write(f"  Given Name: {attrs.get('givenName', [b''])[0].decode('utf-8')}")
                    self.stdout.write(f"  Surname: {attrs.get('sn', [b''])[0].decode('utf-8')}")
                    self.stdout.write(f"  Email: {attrs.get('mail', [b''])[0].decode('utf-8')}")
                    self.stdout.write(f"  SAM Account: {attrs.get('sAMAccountName', [b''])[0].decode('utf-8')}")
                    
                    groups = attrs.get('memberOf', [])
                    if groups:
                        self.stdout.write(f"  Groups: {len(groups)} group(s)")
                        for group in groups[:3]:  # Show first 3 groups
                            self.stdout.write(f"    - {group.decode('utf-8')}")
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'  Could not retrieve attributes: {str(e)}'))
            
            conn.unbind()
            
            # Test Django authentication
            self.stdout.write("\n" + "="*50)
            self.stdout.write("Testing Django LDAP authentication...")
            self.stdout.write("="*50)
            
            user = authenticate(username=username, password=password)
            
            if user:
                self.stdout.write(self.style.SUCCESS('✓ Django authentication successful'))
                self.stdout.write(f"  User ID: {user.id}")
                self.stdout.write(f"  Username: {user.username}")
                self.stdout.write(f"  Email: {user.email}")
                self.stdout.write(f"  Name: {user.get_full_name()}")
                self.stdout.write(f"  LDAP User: {user.is_ldap_user}")
                self.stdout.write(f"  LDAP DN: {user.ldap_dn}")
                self.stdout.write(f"  Staff: {user.is_staff}")
                self.stdout.write(f"  Active: {user.is_active}")
            else:
                self.stdout.write(self.style.ERROR('✗ Django authentication failed'))
                self.stdout.write("\nPossible issues:")
                self.stdout.write("  1. User search base DN may be incorrect")
                self.stdout.write("  2. User does not exist in specified OU")
                self.stdout.write("  3. AUTH_LDAP_USER_SEARCH filter may be wrong")
                self.stdout.write("  4. Certificate validation failing")
            
        except ldap.INVALID_CREDENTIALS:
            self.stdout.write(self.style.ERROR('✗ Invalid credentials'))
        except ldap.SERVER_DOWN:
            self.stdout.write(self.style.ERROR('✗ Cannot connect to LDAP server'))
            self.stdout.write("\nTroubleshooting:")
            self.stdout.write("  1. Check if server is reachable")
            self.stdout.write("  2. Verify port is correct (636 for ldaps://, 389 for ldap://)")
            self.stdout.write("  3. Check firewall rules")
            self.stdout.write("  4. Verify certificate is valid and trusted")
        except ldap.CONNECT_ERROR as e:
            self.stdout.write(self.style.ERROR(f'✗ Connection error: {str(e)}'))
            self.stdout.write("\nThis often means:")
            self.stdout.write("  - Certificate validation failed")
            self.stdout.write("  - Certificate file not found or invalid")
            self.stdout.write("  - Certificate doesn't match server hostname")
        except ldap.OPERATIONS_ERROR as e:
            self.stdout.write(self.style.ERROR(f'✗ Operations error: {str(e)}'))
            self.stdout.write("\nThis might mean:")
            self.stdout.write("  - STARTTLS failed")
            self.stdout.write("  - Server doesn't support the requested operation")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error: {str(e)}'))
            self.stdout.write(f"\nException type: {type(e).__name__}")
            import traceback
            self.stdout.write("\nFull traceback:")
            self.stdout.write(traceback.format_exc())