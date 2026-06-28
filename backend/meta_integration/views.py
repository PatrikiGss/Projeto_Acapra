import logging
from datetime import timedelta
from urllib.parse import urlencode

import requests
from django.conf import settings
from django.shortcuts import redirect
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import MetaConnection, MetaOAuthState
from .services import GRAPH_API_BASE, GRAPH_API_VERSION

logger = logging.getLogger(__name__)

SCOPES = [
    'pages_manage_posts',
    'pages_read_engagement',
    'instagram_content_publish',
    'instagram_basic',
    'business_management',
]

STATE_TTL_MINUTES = 10


class InitiateOAuthView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        MetaOAuthState.objects.filter(user=request.user).delete()
        state_obj = MetaOAuthState.objects.create(user=request.user)

        params = urlencode({
            'client_id': settings.META_APP_ID,
            'redirect_uri': settings.META_REDIRECT_URI,
            'scope': ','.join(SCOPES),
            'state': str(state_obj.state),
            'response_type': 'code',
        })

        auth_url = f"https://www.facebook.com/{GRAPH_API_VERSION}/dialog/oauth?{params}"
        return Response({'auth_url': auth_url})


def meta_callback(request):
    code = request.GET.get('code')
    state = request.GET.get('state')
    error = request.GET.get('error')

    frontend_url = settings.FRONTEND_URL.rstrip('/')

    if error or not code or not state:
        reason = error or 'missing_params'
        return redirect(f"{frontend_url}/meta/configurar?erro={reason}")

    try:
        state_obj = MetaOAuthState.objects.get(state=state)
    except MetaOAuthState.DoesNotExist:
        return redirect(f"{frontend_url}/meta/configurar?erro=invalid_state")

    expiry = state_obj.created_at + timedelta(minutes=STATE_TTL_MINUTES)
    if timezone.now() > expiry:
        state_obj.delete()
        return redirect(f"{frontend_url}/meta/configurar?erro=state_expired")

    try:
        token_resp = requests.get(
            f"{GRAPH_API_BASE}/oauth/access_token",
            params={
                'client_id': settings.META_APP_ID,
                'client_secret': settings.META_APP_SECRET,
                'redirect_uri': settings.META_REDIRECT_URI,
                'code': code,
            },
            timeout=15,
        )
        token_resp.raise_for_status()
        user_access_token = token_resp.json()['access_token']
    except Exception as exc:
        logger.error("Falha ao trocar código por token Meta: %s", exc)
        return redirect(f"{frontend_url}/meta/configurar?erro=token_exchange_failed")

    state_obj.user_access_token = user_access_token
    state_obj.save()

    return redirect(f"{frontend_url}/meta/configurar?state={state}")


class MetaPagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        state = request.GET.get('state')
        if not state:
            return Response(
                {'detail': 'Parâmetro state obrigatório.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            state_obj = MetaOAuthState.objects.get(state=state, user=request.user)
        except MetaOAuthState.DoesNotExist:
            return Response(
                {'detail': 'State inválido ou expirado.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        expiry = state_obj.created_at + timedelta(minutes=STATE_TTL_MINUTES)
        if timezone.now() > expiry:
            state_obj.delete()
            return Response(
                {'detail': 'State expirado. Conecte novamente.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not state_obj.user_access_token:
            return Response(
                {'detail': 'Token não disponível.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            pages_resp = requests.get(
                f"{GRAPH_API_BASE}/me/accounts",
                params={'access_token': state_obj.user_access_token},
                timeout=15,
            )
            pages_resp.raise_for_status()
            pages = pages_resp.json().get('data', [])
        except Exception as exc:
            logger.error("Falha ao buscar páginas Meta: %s", exc)
            return Response(
                {'detail': 'Falha ao buscar páginas do Facebook.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({
            'pages': [{'id': p['id'], 'name': p['name']} for p in pages],
            'state': state,
        })


class MetaSaveConnectionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        state = request.data.get('state')
        page_id = request.data.get('page_id')
        page_name = request.data.get('page_name', '')

        if not state or not page_id:
            return Response(
                {'detail': 'Campos state e page_id são obrigatórios.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            state_obj = MetaOAuthState.objects.get(state=state, user=request.user)
        except MetaOAuthState.DoesNotExist:
            return Response(
                {'detail': 'State inválido ou expirado.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        expiry = state_obj.created_at + timedelta(minutes=STATE_TTL_MINUTES)
        if timezone.now() > expiry:
            state_obj.delete()
            return Response(
                {'detail': 'State expirado. Conecte novamente.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_access_token = state_obj.user_access_token

        # Get page access token from /me/accounts
        try:
            accounts_resp = requests.get(
                f"{GRAPH_API_BASE}/me/accounts",
                params={'access_token': user_access_token},
                timeout=15,
            )
            accounts_resp.raise_for_status()
            accounts = accounts_resp.json().get('data', [])

            page_data = next((a for a in accounts if a['id'] == page_id), None)
            if not page_data:
                return Response(
                    {'detail': 'Página não encontrada.'},
                    status=status.HTTP_404_NOT_FOUND,
                )

            page_access_token = page_data['access_token']
        except Exception as exc:
            logger.error("Falha ao obter token da página Meta: %s", exc)
            return Response(
                {'detail': 'Falha ao obter token da página.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Get Instagram business account linked to this page
        instagram_id = ''
        try:
            ig_resp = requests.get(
                f"{GRAPH_API_BASE}/{page_id}",
                params={
                    'fields': 'instagram_business_account',
                    'access_token': page_access_token,
                },
                timeout=15,
            )
            ig_resp.raise_for_status()
            instagram_id = ig_resp.json().get('instagram_business_account', {}).get('id', '')
        except Exception as exc:
            logger.warning("Não foi possível obter Instagram vinculado à página: %s", exc)

        connection, created = MetaConnection.objects.update_or_create(
            user=request.user,
            page_id=page_id,
            defaults={
                'page_name': page_name,
                'page_access_token': page_access_token,
                'instagram_id': instagram_id,
                'is_active': True,
            },
        )

        state_obj.delete()

        return Response(
            {
                'detail': 'Conexão salva com sucesso.',
                'page_name': connection.page_name,
                'instagram_connected': bool(instagram_id),
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class MetaStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        connections = MetaConnection.objects.filter(
            user=request.user,
            is_active=True,
        ).values('id', 'page_name', 'page_id', 'instagram_id', 'created_at')

        return Response({'connections': list(connections)})


class MetaDisconnectView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            connection = MetaConnection.objects.get(pk=pk, user=request.user)
        except MetaConnection.DoesNotExist:
            return Response(
                {'detail': 'Conexão não encontrada.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        connection.delete()
        # 204 não pode ter corpo (quebra parsers/proxies HTTP). Resposta vazia.
        return Response(status=status.HTTP_204_NO_CONTENT)
