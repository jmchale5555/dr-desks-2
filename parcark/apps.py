from django.apps import AppConfig


class ParcarkConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'parcark'

    def ready(self):
        import parcark.signals