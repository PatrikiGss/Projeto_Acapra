from django.apps import AppConfig

class GerenciamentoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'gerenciamento'

    def ready(self):
        import gerenciamento.signals