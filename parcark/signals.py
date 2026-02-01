from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Room, Desk

User = get_user_model()

@receiver(post_save, sender=Room)
def create_desks_for_room(sender, instance, created, **kwargs):
    """
    Automatically create desks when a room is created or updated
    """
    if created:
        # Room just created - create all desks
        for i in range(1, instance.number_of_desks + 1):
            Desk.objects.create(
                room=instance,
                desk_number=i,
                location_description=f'Desk {i}'
            )
    else:
        # Room updated - adjust desk count
        current_desk_count = instance.desks.count()
        target_desk_count = instance.number_of_desks
        
        if target_desk_count > current_desk_count:
            # Add more desks
            for i in range(current_desk_count + 1, target_desk_count + 1):
                Desk.objects.create(
                    room=instance,
                    desk_number=i,
                    location_description=f'Desk {i}'
                )
        elif target_desk_count < current_desk_count:
            # Remove excess desks (only if they have no bookings)
            desks_to_remove = instance.desks.order_by('-desk_number')[:(current_desk_count - target_desk_count)]
            for desk in desks_to_remove:
                if not desk.bookings.exists():
                    desk.delete()


@receiver(post_save, sender=User)
def mark_ldap_users(sender, instance, created, **kwargs):
    """Mark users created by LDAP"""
    if created and hasattr(instance, 'ldap_user'):
        # User was created by LDAP
        instance.is_ldap_user = True
        instance.ldap_dn = instance.ldap_user.dn
        instance.save(update_fields=['is_ldap_user', 'ldap_dn'])