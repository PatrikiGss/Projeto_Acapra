<?php

namespace meta_integration;

use core\Controller;
use core\Response;

/**
 * Controller de integração com a Meta (Facebook/Instagram)
 * Equivalente aos views de meta_integration do Django
 */
class MetaController extends Controller
{
    const SCOPES = [
        'pages_manage_posts',
        'pages_read_engagement',
        'instagram_content_publish',
        'instagram_basic',
        'business_management',
    ];

    const STATE_TTL_MINUTES = 10;

    /**
     * Inicia o fluxo OAuth
     * POST /api/meta/auth/initiate/
     */
    public function post_initiate()
    {
        $this->requireAuth();

        $user = $this->getUser();

        // Remove estados anteriores do usuário
        MetaOAuthState::where('usuario_id', '=', $user->attributes['id'])->delete();

        $stateObj = new MetaOAuthState([
            'state' => MetaOAuthState::gerarState(),
            'usuario_id' => $user->attributes['id'],
            'user_access_token' => '',
        ]);
        $stateObj->save();

        $params = http_build_query([
            'client_id' => META_APP_ID,
            'redirect_uri' => META_REDIRECT_URI,
            'scope' => implode(',', self::SCOPES),
            'state' => $stateObj->attributes['state'],
            'response_type' => 'code',
        ]);

        $authUrl = "https://www.facebook.com/" . Services::GRAPH_API_VERSION . "/dialog/oauth?{$params}";

        Response::success(['auth_url' => $authUrl])->send();
    }

    /**
     * Callback do OAuth (redireciona para o frontend)
     * GET /api/meta/auth/callback/
     */
    public function get_callback()
    {
        $code = $_GET['code'] ?? null;
        $state = $_GET['state'] ?? null;
        $error = $_GET['error'] ?? null;

        $frontendUrl = rtrim(FRONTEND_URL, '/');

        if ($error || !$code || !$state) {
            $reason = $error ?: 'missing_params';
            $this->redirect("{$frontendUrl}/meta/configurar?erro={$reason}");
        }

        $stateObj = MetaOAuthState::where('state', '=', $state)->first();
        if (!$stateObj) {
            $this->redirect("{$frontendUrl}/meta/configurar?erro=invalid_state");
        }

        if ($this->stateExpirado($stateObj)) {
            $stateObj->delete();
            $this->redirect("{$frontendUrl}/meta/configurar?erro=state_expired");
        }

        try {
            $tokenResp = Services::httpGet(
                Services::GRAPH_API_BASE . "/oauth/access_token",
                [
                    'client_id' => META_APP_ID,
                    'client_secret' => META_APP_SECRET,
                    'redirect_uri' => META_REDIRECT_URI,
                    'code' => $code,
                ]
            );
            $userAccessToken = $tokenResp['access_token'];
        } catch (\Exception $exc) {
            error_log("Falha ao trocar código por token Meta: " . $exc->getMessage());
            $this->redirect("{$frontendUrl}/meta/configurar?erro=token_exchange_failed");
        }

        $stateObj->attributes['user_access_token'] = $userAccessToken;
        $stateObj->save();

        $this->redirect("{$frontendUrl}/meta/configurar?state={$state}");
    }

    /**
     * Lista páginas do Facebook do usuário
     * GET /api/meta/pages/?state=
     */
    public function get_pages()
    {
        $this->requireAuth();

        $user = $this->getUser();
        $state = $_GET['state'] ?? null;

        if (!$state) {
            Response::error('Parâmetro state obrigatório.', 400)->send();
        }

        $stateObj = MetaOAuthState::where('state', '=', $state)
            ->where('usuario_id', '=', $user->attributes['id'])->first();

        if (!$stateObj) {
            Response::error('State inválido ou expirado.', 400)->send();
        }

        if ($this->stateExpirado($stateObj)) {
            $stateObj->delete();
            Response::error('State expirado. Conecte novamente.', 400)->send();
        }

        if (empty($stateObj->attributes['user_access_token'])) {
            Response::error('Token não disponível.', 400)->send();
        }

        try {
            $pagesResp = Services::httpGet(
                Services::GRAPH_API_BASE . "/me/accounts",
                ['access_token' => $stateObj->attributes['user_access_token']]
            );
            $pages = $pagesResp['data'] ?? [];
        } catch (\Exception $exc) {
            error_log("Falha ao buscar páginas Meta: " . $exc->getMessage());
            Response::error('Falha ao buscar páginas do Facebook.', 502)->send();
        }

        $resultado = [];
        foreach ($pages as $p) {
            $resultado[] = ['id' => $p['id'], 'name' => $p['name']];
        }

        Response::success([
            'pages' => $resultado,
            'state' => $state,
        ])->send();
    }

    /**
     * Salva a conexão com uma página
     * POST /api/meta/save/
     */
    public function post_save()
    {
        $this->requireAuth();

        $user = $this->getUser();
        $data = $this->getAllParameters();

        $state = $data['state'] ?? null;
        $pageId = $data['page_id'] ?? null;
        $pageName = $data['page_name'] ?? '';

        if (!$state || !$pageId) {
            Response::error('Campos state e page_id são obrigatórios.', 400)->send();
        }

        $stateObj = MetaOAuthState::where('state', '=', $state)
            ->where('usuario_id', '=', $user->attributes['id'])->first();

        if (!$stateObj) {
            Response::error('State inválido ou expirado.', 400)->send();
        }

        if ($this->stateExpirado($stateObj)) {
            $stateObj->delete();
            Response::error('State expirado. Conecte novamente.', 400)->send();
        }

        $userAccessToken = $stateObj->attributes['user_access_token'];

        // Obtém o token da página em /me/accounts
        try {
            $accountsResp = Services::httpGet(
                Services::GRAPH_API_BASE . "/me/accounts",
                ['access_token' => $userAccessToken]
            );
            $accounts = $accountsResp['data'] ?? [];

            $pageData = null;
            foreach ($accounts as $a) {
                if ($a['id'] === $pageId) {
                    $pageData = $a;
                    break;
                }
            }

            if (!$pageData) {
                Response::error('Página não encontrada.', 404)->send();
            }

            $pageAccessToken = $pageData['access_token'];
        } catch (\Exception $exc) {
            error_log("Falha ao obter token da página Meta: " . $exc->getMessage());
            Response::error('Falha ao obter token da página.', 502)->send();
        }

        // Obtém a conta Instagram Business vinculada à página
        $instagramId = '';
        try {
            $igResp = Services::httpGet(
                Services::GRAPH_API_BASE . "/{$pageId}",
                [
                    'fields' => 'instagram_business_account',
                    'access_token' => $pageAccessToken,
                ]
            );
            $instagramId = $igResp['instagram_business_account']['id'] ?? '';
        } catch (\Exception $exc) {
            error_log("Não foi possível obter Instagram vinculado à página: " . $exc->getMessage());
        }

        // update_or_create
        $connection = MetaConnection::where('usuario_id', '=', $user->attributes['id'])
            ->where('page_id', '=', $pageId)->first();

        $created = false;
        if (!$connection) {
            $connection = new MetaConnection([
                'usuario_id' => $user->attributes['id'],
                'page_id' => $pageId,
            ]);
            $created = true;
        }

        $connection->attributes['page_name'] = $pageName;
        $connection->attributes['page_access_token'] = $pageAccessToken;
        $connection->attributes['instagram_id'] = $instagramId;
        $connection->attributes['is_active'] = true;
        $connection->save();

        $stateObj->delete();

        Response::success([
            'detail' => 'Conexão salva com sucesso.',
            'page_name' => $connection->attributes['page_name'],
            'instagram_connected' => (bool)$instagramId,
        ], $created ? 201 : 200)->send();
    }

    /**
     * Retorna o status das conexões ativas
     * GET /api/meta/status/
     */
    public function get_status()
    {
        $this->requireAuth();

        $user = $this->getUser();

        $connections = MetaConnection::where('usuario_id', '=', $user->attributes['id'])
            ->where('is_active', '=', 1)->get();

        $data = [];
        foreach ($connections as $connection) {
            $data[] = [
                'id' => $connection->attributes['id'],
                'page_name' => $connection->attributes['page_name'],
                'page_id' => $connection->attributes['page_id'],
                'instagram_id' => $connection->attributes['instagram_id'],
                'created_at' => $connection->attributes['created_at'],
            ];
        }

        Response::success(['connections' => $data])->send();
    }

    /**
     * Remove uma conexão
     * DELETE /api/meta/disconnect/<id>/
     */
    public function delete_disconnect()
    {
        $this->requireAuth();

        $user = $this->getUser();
        $pk = $this->params[0] ?? null;

        $connection = MetaConnection::where('id', '=', $pk)
            ->where('usuario_id', '=', $user->attributes['id'])->first();

        if (!$connection) {
            Response::error('Conexão não encontrada.', 404)->send();
        }

        $connection->delete();

        Response::success(['detail' => 'Conexão removida com sucesso.'], 204)->send();
    }

    /**
     * Verifica se o state OAuth expirou (TTL)
     */
    private function stateExpirado($stateObj)
    {
        $criadoEm = strtotime($stateObj->attributes['created_at']);
        $expiracao = $criadoEm + (self::STATE_TTL_MINUTES * 60);
        return time() > $expiracao;
    }

    /**
     * Redireciona para uma URL e encerra
     */
    private function redirect($url)
    {
        http_response_code(302);
        header("Location: {$url}");
        exit;
    }
}
