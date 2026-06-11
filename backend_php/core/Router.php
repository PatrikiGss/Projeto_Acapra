<?php

namespace core;

/**
 * Roteador de requisições
 * Equivalente aos urls.py do Django
 */
class Router
{
    private $routes = [];

    public function __construct()
    {
        $this->registerRoutes();
    }

    /**
     * Registra as rotas da aplicação
     */
    private function registerRoutes()
    {
        // =========================================================
        // GERENCIAMENTO / AUTENTICAÇÃO
        // =========================================================

        $this->post('/api/gerenciamento/auth/register/', 'gerenciamento\AuthController', 'register');
        $this->post('/api/gerenciamento/auth/login/', 'gerenciamento\AuthController', 'login');
        $this->post('/api/gerenciamento/auth/refresh/', 'gerenciamento\AuthController', 'refresh');
        $this->post('/api/gerenciamento/auth/logout/', 'gerenciamento\AuthController', 'logout');

        $this->get('/api/gerenciamento/user/me/', 'gerenciamento\UserController', 'me');
        $this->patch('/api/gerenciamento/user/me/', 'gerenciamento\UserController', 'me');
        $this->post('/api/gerenciamento/user/change-password/', 'gerenciamento\UserController', 'change_password');

        // =========================================================
        // NOTÍCIAS
        // =========================================================

        $this->get('/api/noticias/publicacoes/', 'noticias\PublicacaoController', 'publicacoes');
        $this->post('/api/noticias/publicacoes/', 'noticias\PublicacaoController', 'publicacoes');
        $this->get('/api/noticias/publicacoes/(\d+)/', 'noticias\PublicacaoController', 'publicacao_detail');
        $this->patch('/api/noticias/publicacoes/(\d+)/', 'noticias\PublicacaoController', 'publicacao_detail');
        $this->delete('/api/noticias/publicacoes/(\d+)/', 'noticias\PublicacaoController', 'publicacao_detail');

        // =========================================================
        // CONTATO
        // =========================================================

        $this->get('/api/contato/', 'contato\ContatoController', 'contato');
        $this->patch('/api/contato/', 'contato\ContatoController', 'contato');

        // =========================================================
        // ADOÇÃO
        // =========================================================

        $this->get('/api/adocao/animais/', 'adocao\AnimalController', 'animais');
        $this->post('/api/adocao/animais/', 'adocao\AnimalController', 'animais');
        $this->get('/api/adocao/animais/(\d+)/', 'adocao\AnimalController', 'animal_detail');
        $this->patch('/api/adocao/animais/(\d+)/', 'adocao\AnimalController', 'animal_detail');
        $this->delete('/api/adocao/animais/(\d+)/', 'adocao\AnimalController', 'animal_detail');

        // =========================================================
        // DOAÇÕES / PIX
        // =========================================================

        $this->get('/api/doacoes/pix/', 'doacoes\DadosPixController', 'pix');
        $this->post('/api/doacoes/pix/', 'doacoes\DadosPixController', 'pix');
        $this->get('/api/doacoes/pix/(\d+)/', 'doacoes\DadosPixController', 'pix_detail');
        $this->patch('/api/doacoes/pix/(\d+)/', 'doacoes\DadosPixController', 'pix_detail');
        $this->delete('/api/doacoes/pix/(\d+)/', 'doacoes\DadosPixController', 'pix_detail');

        // =========================================================
        // VENDAS / PRODUTOS
        // =========================================================

        $this->get('/api/vendas/produtos/', 'vendas\ProdutoController', 'produtos');
        $this->post('/api/vendas/produtos/', 'vendas\ProdutoController', 'produtos');
        $this->get('/api/vendas/produtos/tipo/([^/]+)/', 'vendas\ProdutoController', 'produtos_por_tipo');
        $this->get('/api/vendas/produtos/(\d+)/', 'vendas\ProdutoController', 'produto_detail');
        $this->patch('/api/vendas/produtos/(\d+)/', 'vendas\ProdutoController', 'produto_detail');
        $this->delete('/api/vendas/produtos/(\d+)/', 'vendas\ProdutoController', 'produto_detail');

        // =========================================================
        // VOLUNTARIADO
        // =========================================================

        $this->get('/api/voluntariado/voluntarios/', 'voluntariado\VoluntarioController', 'voluntarios');
        $this->post('/api/voluntariado/voluntarios/', 'voluntariado\VoluntarioController', 'voluntarios');
        $this->get('/api/voluntariado/voluntarios/(\d+)/', 'voluntariado\VoluntarioController', 'voluntario_detail');
        $this->patch('/api/voluntariado/voluntarios/(\d+)/', 'voluntariado\VoluntarioController', 'voluntario_detail');
        $this->delete('/api/voluntariado/voluntarios/(\d+)/', 'voluntariado\VoluntarioController', 'voluntario_detail');

        // =========================================================
        // DENÚNCIAS
        // =========================================================

        $this->get('/api/denuncias/denuncias/', 'denuncias\DenunciaController', 'denuncias');
        $this->post('/api/denuncias/denuncias/', 'denuncias\DenunciaController', 'denuncias');
        $this->get('/api/denuncias/denuncias/(\d+)/', 'denuncias\DenunciaController', 'denuncia_detail');
        $this->patch('/api/denuncias/denuncias/(\d+)/', 'denuncias\DenunciaController', 'denuncia_detail');
        $this->delete('/api/denuncias/denuncias/(\d+)/', 'denuncias\DenunciaController', 'denuncia_detail');

        // =========================================================
        // TRANSPARÊNCIA
        // =========================================================

        $this->get('/api/transparencia/categorias/', 'transparencia\TransparenciaController', 'categorias');
        $this->post('/api/transparencia/categorias/', 'transparencia\TransparenciaController', 'categorias');
        $this->get('/api/transparencia/categorias/(\d+)/', 'transparencia\TransparenciaController', 'categoria_detail');
        $this->patch('/api/transparencia/categorias/(\d+)/', 'transparencia\TransparenciaController', 'categoria_detail');
        $this->delete('/api/transparencia/categorias/(\d+)/', 'transparencia\TransparenciaController', 'categoria_detail');

        $this->get('/api/transparencia/movimentos/', 'transparencia\TransparenciaController', 'movimentos');
        $this->post('/api/transparencia/movimentos/', 'transparencia\TransparenciaController', 'movimentos');
        $this->patch('/api/transparencia/movimentos/(\d+)/', 'transparencia\TransparenciaController', 'movimento_detail');
        $this->delete('/api/transparencia/movimentos/(\d+)/', 'transparencia\TransparenciaController', 'movimento_detail');

        $this->get('/api/transparencia/documentos/', 'transparencia\TransparenciaController', 'documentos');
        $this->post('/api/transparencia/documentos/', 'transparencia\TransparenciaController', 'documentos');
        $this->patch('/api/transparencia/documentos/(\d+)/', 'transparencia\TransparenciaController', 'documento_detail');
        $this->delete('/api/transparencia/documentos/(\d+)/', 'transparencia\TransparenciaController', 'documento_detail');

        $this->get('/api/transparencia/indicadores/', 'transparencia\TransparenciaController', 'indicadores');
        $this->patch('/api/transparencia/indicadores/(\d+)/', 'transparencia\TransparenciaController', 'indicador_detail');

        // =========================================================
        // GERENCIAMENTO - DASHBOARD / ADMIN
        // =========================================================

        $this->get('/api/gerenciamento/dashboard/', 'gerenciamento\DashboardController', 'dashboard');
        $this->get('/api/gerenciamento/admin/usuarios/', 'gerenciamento\AdminController', 'usuarios');
        $this->patch('/api/gerenciamento/admin/usuarios/(\d+)/perfil/', 'gerenciamento\AdminController', 'usuario_perfil');

        // =========================================================
        // LARES VOLUNTÁRIOS
        // =========================================================

        $this->get('/api/lares/lares/', 'lares\LarVoluntarioController', 'lares');
        $this->post('/api/lares/lares/', 'lares\LarVoluntarioController', 'lares');
        $this->get('/api/lares/lares/(\d+)/', 'lares\LarVoluntarioController', 'lar_detail');
        $this->patch('/api/lares/lares/(\d+)/', 'lares\LarVoluntarioController', 'lar_detail');
        $this->delete('/api/lares/lares/(\d+)/', 'lares\LarVoluntarioController', 'lar_detail');

        // =========================================================
        // META / FACEBOOK / INSTAGRAM
        // =========================================================

        $this->post('/api/meta/auth/initiate/', 'meta_integration\MetaController', 'initiate');
        $this->get('/api/meta/auth/callback/', 'meta_integration\MetaController', 'callback');
        $this->get('/api/meta/pages/', 'meta_integration\MetaController', 'pages');
        $this->post('/api/meta/save/', 'meta_integration\MetaController', 'save');
        $this->get('/api/meta/status/', 'meta_integration\MetaController', 'status');
        $this->delete('/api/meta/disconnect/(\d+)/', 'meta_integration\MetaController', 'disconnect');
    }

    /**
     * Registra uma rota GET
     */
    public function get($path, $controller, $action)
    {
        $this->routes['GET'][$path] = ['controller' => $controller, 'action' => $action];
    }

    /**
     * Registra uma rota POST
     */
    public function post($path, $controller, $action)
    {
        $this->routes['POST'][$path] = ['controller' => $controller, 'action' => $action];
    }

    /**
     * Registra uma rota PUT
     */
    public function put($path, $controller, $action)
    {
        $this->routes['PUT'][$path] = ['controller' => $controller, 'action' => $action];
    }

    /**
     * Registra uma rota PATCH
     */
    public function patch($path, $controller, $action)
    {
        $this->routes['PATCH'][$path] = ['controller' => $controller, 'action' => $action];
    }

    /**
     * Registra uma rota DELETE
     */
    public function delete($path, $controller, $action)
    {
        $this->routes['DELETE'][$path] = ['controller' => $controller, 'action' => $action];
    }

    /**
     * Processa uma requisição
     */
    public function dispatch($method, $path)
    {
        // Remove query string
        $path = parse_url($path, PHP_URL_PATH);

        if (!isset($this->routes[$method])) {
            Response::error('Método não permitido', 405)->send();
        }

        foreach ($this->routes[$method] as $routePath => $route) {
            $pattern = '@^' . preg_replace('/\(\\d\+\)/', '(\\d+)', $routePath) . '$@';

            if (preg_match($pattern, $path, $matches)) {
                // Remove a URL completa dos matches
                array_shift($matches);
                $params = $matches;

                $controller = new $route['controller']();
                $action = $route['action'];

                return $controller->dispatch($action, $params);
            }
        }

        Response::notFound()->send();
    }
}
