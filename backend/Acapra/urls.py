# Acapra/urls.py

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve

urlpatterns = [
    path('api/admin/', admin.site.urls),

    path('api/core/',          include('core.urls',          namespace='core')),
    path('api/auditoria/',     include('auditoria.urls',     namespace='auditoria')),
    path('api/adocao/',        include('adocao.urls',        namespace='adocao')),
    path('api/doacoes/',       include('doacoes.urls',       namespace='doacoes')),
    path('api/denuncias/',     include('denuncias.urls',     namespace='denuncias')),
    path('api/gerenciamento/', include('gerenciamento.urls', namespace='gerenciamento')),
    path('api/noticias/',      include('noticias.urls',      namespace='noticias')),
    path('api/resgates/',      include('resgates.urls',      namespace='resgates')),
    path('api/transparencia/', include('transparencia.urls', namespace='transparencia')),
    path('api/vendas/',        include('vendas.urls',        namespace='vendas')),
    path('api/voluntariado/',  include('voluntariado.urls',  namespace='voluntariado')),
    path('api/meta/',          include('meta_integration.urls', namespace='meta_integration')),
    path('api/contato/',       include('contato.urls',          namespace='contato')),
    path('api/lares/',         include('lares.urls',            namespace='lares')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
elif settings.SERVE_MEDIA:
    # static() não funciona fora de DEBUG (ela mesma checa settings.DEBUG),
    # então servimos a view de arquivo estático do Django diretamente.
    urlpatterns += [
        re_path(
            r"^api/media/(?P<path>.*)$",
            serve,
            {"document_root": settings.MEDIA_ROOT},
        ),
    ]
