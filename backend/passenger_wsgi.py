"""
Ponto de entrada do Phusion Passenger (cPanel "Setup Python App").

O Passenger procura este arquivo no root da aplicação e usa a variável
`application` como callable WSGI. Aqui apenas garantimos o sys.path e o
módulo de settings, e reexportamos o WSGI já existente do Django.
"""

import os
import sys

# Garante que o root do projeto (onde fica o pacote "Acapra") esteja no path.
sys.path.insert(0, os.path.dirname(__file__))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Acapra.settings")

from Acapra.wsgi import application  # noqa: E402
