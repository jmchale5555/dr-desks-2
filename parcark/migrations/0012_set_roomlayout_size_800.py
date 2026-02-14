from django.db import migrations


def set_existing_room_layouts_to_800x800(apps, schema_editor):
    RoomLayout = apps.get_model('parcark', 'RoomLayout')
    RoomLayout.objects.all().update(canvas_width=800, canvas_height=800)


class Migration(migrations.Migration):

    dependencies = [
        ('parcark', '0011_alter_roomlayout_canvas_width'),
    ]

    operations = [
        migrations.RunPython(set_existing_room_layouts_to_800x800, migrations.RunPython.noop),
    ]
