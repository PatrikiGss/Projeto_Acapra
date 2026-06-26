import os
import sys

# Adiciona o diretório do backend ao path para o Passenger encontrar os módulos
sys.path.insert(0, os.path.dirname(__file__))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Acapra.settings")

from django.core.wsgi import get_wsgi_application
django_application = get_wsgi_application()


def application(environ, start_response):
    # O cPanel monta a app Python no sub-URI "/api" (PassengerBaseURI), o que
    # faz o Passenger mover esse prefixo de PATH_INFO para SCRIPT_NAME. As
    # urls.py do projeto esperam o prefixo "api/" dentro do próprio PATH_INFO
    # (igual ao "runserver" local), então devolvemos o prefixo para o
    # PATH_INFO e zeramos o SCRIPT_NAME antes de entregar pro Django.
    script_name = environ.get("SCRIPT_NAME", "")

    if script_name:
        environ["PATH_INFO"] = script_name + environ.get("PATH_INFO", "")
        environ["SCRIPT_NAME"] = ""

    return django_application(environ, start_response)
