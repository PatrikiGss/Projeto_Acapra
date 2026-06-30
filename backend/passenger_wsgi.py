"""
Ponto de entrada do Phusion Passenger (cPanel "Setup Python App").

O Passenger procura este arquivo no root da aplicação e usa a variável
`application` como callable WSGI.

A app é montada no sub-URI "/api" (PassengerBaseURI), então o Passenger move
esse prefixo de PATH_INFO para SCRIPT_NAME. As urls.py do projeto esperam o
prefixo "api/" dentro do próprio PATH_INFO (igual ao runserver local), então
devolvemos o prefixo ao PATH_INFO e zeramos o SCRIPT_NAME antes de entregar
para o Django.
"""

import os
import sys

# Garante que o root do projeto (onde fica o pacote "Acapra") esteja no path.
sys.path.insert(0, os.path.dirname(__file__))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Acapra.settings")

from Acapra.wsgi import application as django_application  # noqa: E402


def application(environ, start_response):
    script_name = environ.get("SCRIPT_NAME", "")
    if script_name:
        environ["PATH_INFO"] = script_name + environ.get("PATH_INFO", "")
        environ["SCRIPT_NAME"] = ""
    return django_application(environ, start_response)
