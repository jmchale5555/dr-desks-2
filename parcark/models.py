from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator, FileExtensionValidator
from django.core.exceptions import ValidationError
from datetime import date, datetime
from cryptography.fernet import Fernet
import uuid
import os

class User(AbstractUser):
    """
    Custom user model that works with both local and LDAP authentication
    """
    # LDAP-specific fields
    is_ldap_user = models.BooleanField(default=False, help_text="True if user authenticates via LDAP/Active Directory")
    ldap_dn = models.CharField(max_length=255, blank=True, null=True, help_text="LDAP Distinguished Name")
    
    # Additional user info (can be populated from LDAP or manual entry)
    department = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    # Inherits from AbstractUser:
    # - username, password, email
    # - first_name, last_name
    # - is_staff, is_active, is_superuser
    # - date_joined, last_login
    
    class Meta:
        ordering = ['username']
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.username})"
    
    @property
    def auth_source(self):
        """Return authentication source for display"""
        return "LDAP" if self.is_ldap_user else "Local"

def validate_image_size(image):
    """Validate image file size (max 2MB)"""
    file_size = image.size
    limit_mb = 2
    if file_size > limit_mb * 1024 * 1024:
        raise ValidationError(f'Image file too large. Maximum size is {limit_mb}MB.')

def room_image_upload_path(instance, filename):
    """Generate upload path for room images"""
    # Extract file extension
    ext = filename.split('.')[-1].lower()
    # Generate clean filename using room name or UUID
    if instance.id:
        # Use room ID and slugified name
        clean_name = slugify(instance.name)[:50]  # Limit length
        filename = f'room_{instance.id}_{clean_name}.{ext}'
    else:
        # For new rooms without ID yet, use UUID
        filename = f'room_{uuid.uuid4().hex[:8]}.{ext}'
    
    return os.path.join('rooms', filename)

class Room(models.Model):
    name = models.CharField(max_length=100, help_text="Name of the room")

    number_of_desks = models.PositiveIntegerField(
        validators=[
            MinValueValidator(1, message="Must have at least 1 desk"),
            MaxValueValidator(100, message="Cannot exceed 100 desks")
        ],
        help_text="Total number of desks in this room"
    )

    image = models.ImageField(upload_to=room_image_upload_path, null=True, blank=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=['jpg', 'jpeg', 'png', 'webp'],
                message='Only JPG, PNG, and WebP images are allowed.'
            ),
            validate_image_size,
        ],
        help_text="Room photo (max 2MB, JPG/PNG/WebP)"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Room'
        verbose_name_plural = 'Rooms'

    def __str__(self):
        return f"{self.name} ({self.number_of_desks} desks)"
    
    def delete(self, *args, **kwargs):
        """Override delete to check for bookings"""
        # Check if any desk in this room has bookings
        from .models import Booking  # Import here to avoid circular import
        
        desk_ids = self.desks.values_list('id', flat=True)
        booking_count = Booking.objects.filter(desk_id__in=desk_ids).count()
        
        if booking_count > 0:
            raise ValidationError(
                f"Cannot delete room '{self.name}' - it has {booking_count} existing booking(s). "
                "Please cancel all bookings first or set desks to inactive."
            )
        
        # Delete associated image if it exists
        if self.image:
            if os.path.isfile(self.image.path):
                os.remove(self.image.path)
        
        super().delete(*args, **kwargs)


class Desk(models.Model):
    """Individual desk in a room"""
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='desks', help_text="Room this desk belongs to")
    desk_number = models.PositiveIntegerField(help_text="Desk number within the room")
    location_description = models.CharField(max_length=100, blank=True, help_text="e.g. 'Window side', 'Near door', 'Corner'")
    is_active = models.BooleanField(default=True, help_text="Set to False to temporarily disable a desk")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['room', 'desk_number']
        unique_together = ['room', 'desk_number']
        verbose_name = 'Desk'
        verbose_name_plural = 'Desks'

    def __str__(self):
        return f"{self.room.name} - Desk {self.desk_number}"


def default_room_layout_json():
    return {
        'schemaVersion': 1,
        'grid': {
            'enabled': True,
            'size': 20,
            'snap': True,
        },
        'objects': [],
    }


class RoomLayout(models.Model):
    """Versioned room layout for the Room Builder editor."""
    room = models.OneToOneField(Room, on_delete=models.CASCADE, related_name='layout')
    version = models.PositiveIntegerField(default=1)
    canvas_width = models.PositiveIntegerField(default=800)
    canvas_height = models.PositiveIntegerField(default=800)
    layout_json = models.JSONField(default=default_room_layout_json)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='room_layout_updates',
    )

    class Meta:
        verbose_name = 'Room Layout'
        verbose_name_plural = 'Room Layouts'

    def __str__(self):
        return f"Layout for {self.room.name}"

class Booking(models.Model):
    """Desk booking"""
    PERIOD_CHOICES = [
        ('am', 'Morning (AM)'),
        ('pm', 'Afternoon (PM)'),
        ('full', 'Full Day'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings', help_text="User who made the booking")
    desk = models.ForeignKey(Desk, on_delete=models.CASCADE, related_name='bookings', help_text="Booked desk")
    date = models.DateField(help_text="Date of booking")
    period = models.CharField(max_length=4, choices=PERIOD_CHOICES, help_text="Time period for booking")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date', 'period']
        unique_together = ['desk', 'date', 'period']
        verbose_name = 'Booking'
        verbose_name_plural = 'Bookings'
        indexes = [
            models.Index(fields=['date', 'period']),
            models.Index(fields=['user', 'date']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.desk} - {self.date} ({self.period})"

    def clean(self):
        """Validate booking"""
        # Check date is not in the past
        if self.date < date.today():
            raise ValidationError("Cannot book a desk in the past")
        
        # Check user doesn't already have a booking for this date/period
        conflicting_bookings = Booking.objects.filter(
            user=self.user,
            date=self.date
        ).exclude(pk=self.pk)
        
        # Check for period conflicts
        if self.period == 'full':
            # Full day conflicts with any booking
            if conflicting_bookings.exists():
                raise ValidationError(
                    f"You already have a booking on {self.date}"
                )
        else:
            # AM/PM conflicts with full day or same period
            if conflicting_bookings.filter(
                models.Q(period='full') | models.Q(period=self.period)
            ).exists():
                period_name = 'Morning' if self.period == 'am' else 'Afternoon'
                raise ValidationError(
                    f"You already have a booking for {period_name} on {self.date}"
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class LDAPSettings(models.Model):
    """Singleton model to store LDAP configuration - only one record (pk=1) allowed"""
    # Connection settings
    enabled = models.BooleanField(default=False, help_text="Enable LDAP authentication")
    host = models.CharField(max_length=255, default="", help_text="LDAP server hostname")
    port = models.PositiveIntegerField(default=389, help_text="LDAP port (389 for LDAP, 636 for LDAPS)")
    use_ssl = models.BooleanField(default=False, help_text="Use LDAPS (port 636)")
    use_tls = models.BooleanField(default=False, help_text="Use STARTTLS")
    version = models.PositiveIntegerField(default=3, choices=[(2, "v2"), (3, "v3")], help_text="LDAP protocol version")
    timeout = models.PositiveIntegerField(default=5, help_text="Connection timeout in seconds")
    
    # Bind credentials (optional)
    bind_dn = models.CharField(max_length=255, blank=True, default="", help_text="Service account DN")
    bind_password = models.CharField(max_length=255, blank=True, default="", help_text="Service account password")
    
    # Search configuration
    base_dn = models.CharField(max_length=255, default="", help_text="Base DN for searches")
    user_search_dn = models.CharField(max_length=255, default="", help_text="DN to search for users")
    user_search_filter = models.CharField(max_length=255, default="(sAMAccountName=%(user)s)", help_text="Search filter (use %(user)s)")
    
    # User attribute mapping
    attr_map_username = models.CharField(max_length=50, default="sAMAccountName", help_text="Username attribute")
    attr_map_first_name = models.CharField(max_length=50, default="givenName", help_text="First name attribute")
    attr_map_last_name = models.CharField(max_length=50, default="sn", help_text="Last name attribute")
    attr_map_email = models.CharField(max_length=50, default="mail", help_text="Email attribute")
    
    # Certificate settings
    cert_file_path = models.CharField(max_length=500, blank=True, default="/app/ldap-cert-chain.crt", help_text="Path to cert file")
    cert_require = models.CharField(max_length=10, choices=[
        ('never', 'Never (no validation)'),
        ('allow', 'Allow (try validation)'),
        ('demand', 'Demand (strict)')
    ], default='never', help_text="Certificate validation level")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ldap_settings_updates')

    class Meta:
        verbose_name = "LDAP Settings"
        verbose_name_plural = "LDAP Settings"

    def save(self, *args, **kwargs):
        from django.core.cache import cache
        """Ensure only one settings record exists (pk=1)"""
        self.pk = 1
        super().save(*args, **kwargs)
        cache.delete('ldap_settings')

    @classmethod
    def get_settings(cls):
        """Get or create default settings"""
        settings, created = cls.objects.get_or_create(pk=1, defaults={
            'host': 'AD-DC-sl02.ad.ucl.ac.uk',
            'port': 636,
            'use_ssl': True,
            'base_dn': 'DC=ad,DC=ucl,DC=ac,DC=uk',
            'user_search_dn': 'OU=EENG,OU=ENG,OU=Accounts,DC=ad,DC=ucl,DC=ac,DC=uk',
            'bind_dn': 'CN=EENGuceemj2,OU=Administrators,OU=Administration,DC=ad,DC=ucl,DC=ac,DC=uk',
        })
        return settings

    bind_password = models.CharField(max_length=1000, blank=True, default="")
    
    def set_bind_password(self, password):
        """Encrypt password before saving"""
        if not password:
            self.bind_password = ""
            return
        
        key = os.environ.get('LDAP_ENCRYPTION_KEY')
        if not key:
            raise ValueError("LDAP_ENCRYPTION_KEY environment variable not set")
        
        cipher = Fernet(key)
        encrypted = cipher.encrypt(password.encode())
        self.bind_password = encrypted.decode()  # Store as base64 string
    
    def get_bind_password(self):
        """Decrypt password when needed"""
        if not self.bind_password:
            return ""
        
        key = os.environ.get('LDAP_ENCRYPTION_KEY')
        if not key:
            raise ValueError("LDAP_ENCRYPTION_KEY environment variable not set")
        
        cipher = Fernet(key)
        try:
            # Try to decrypt
            decrypted = cipher.decrypt(self.bind_password.encode())
            return decrypted.decode()
        except:
            # If decryption fails, assume it's plaintext (migration scenario)
            return self.bind_password
    
    def save(self, *args, **kwargs):
        # Auto-encrypt if plain text password is detected
        if self.bind_password and not self.bind_password.startswith('gAAAAAB'):  # Fernet token prefix
            self.set_bind_password(self.bind_password)
        super().save(*args, **kwargs)
