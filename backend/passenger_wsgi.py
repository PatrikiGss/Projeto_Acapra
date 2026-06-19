import os
import sys

# Adiciona o diretório do backend ao path para o Passenger encontrar os módulos
sys.path.insert(0, os.path.dirname(__file__))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Acapra.settings")

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
