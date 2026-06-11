<?php

namespace noticias;

use core\Controller;
use core\Response;
use core\Validator;

/**
 * Controller de publicações/notícias
 * Equivalente aos views de publicações do Django
 */
class PublicacaoController extends Controller
{
    /**
     * Lista publicações
     * GET /api/noticias/publicacoes/
     */
    public function get_publicacoes()
    {
        $categoria = $this->getParameter('categoria');
        $page = (int)$this->getParameter('page', 1);
        $page_size = (int)$this->getParameter('page_size', PAGE_SIZE);

        $query = Publicacao::where('id', '>', 0);

        // Filtra por categoria se fornecida
        if ($categoria && in_array($categoria, array_keys(Publicacao::CATEGORIAS))) {
            $query = Publicacao::where('categoria', '=', $categoria);
        }

        // Filtra por status (apenas ativas para usuários não autenticados)
        if (!$this->getUser()) {
            $query = $query->where('ativo', '=', 1);
        }

        $query = $query->orderBy('created_at', 'DESC');

        $result = $query->paginate($page, $page_size);

        $publicacoes = [];
        foreach ($result['data'] as $pub) {
            $publicacoes[] = $this->serializePublicacao($pub);
        }

        Response::paginated($publicacoes, $result['total'], $page, $page_size)->send();
    }

    /**
     * Cria uma nova publicação
     * POST /api/noticias/publicacoes/
     */
    public function post_publicacoes()
    {
        $this->requireModuleAccess('noticias');

        $data = $this->getAllParameters();

        $validator = new Validator($data, [
            'categoria' => 'required',
            'titulo' => 'required|max:200',
            'resumo' => 'max:280',
            'texto' => 'required',
        ]);

        if (!$validator->validate()) {
            Response::validation($validator->errors())->send();
        }

        if (!in_array($data['categoria'], array_keys(Publicacao::CATEGORIAS))) {
            Response::error('Categoria inválida', 400)->send();
        }

        $publicacao = new Publicacao([
            'categoria' => $data['categoria'],
            'titulo' => $data['titulo'],
            'resumo' => $data['resumo'] ?? '',
            'texto' => $data['texto'],
            'ativo' => isset($data['ativo']) ? $this->toBool($data['ativo']) : true,
        ]);

        // Upload de foto (se fornecida)
        if ($this->hasFileInput('foto')) {
            $publicacao->attributes['foto'] = $this->storeFile('foto', 'noticias');
        }

        $publicacao->save();

        Response::success($this->serializePublicacao($publicacao), 201)->send();
    }

    /**
     * Obtém uma publicação específica
     * GET /api/noticias/publicacoes/<id>/
     */
    public function get_publicacao_detail()
    {
        $id = $this->params[0] ?? null;

        if (!$id) {
            Response::notFound()->send();
        }

        $publicacao = Publicacao::find($id);

        if (!$publicacao) {
            Response::notFound()->send();
        }

        if (!$publicacao->attributes['ativo'] && !$this->getUser()) {
            Response::notFound()->send();
        }

        Response::success($this->serializePublicacao($publicacao))->send();
    }

    /**
     * Atualiza uma publicação
     * PATCH /api/noticias/publicacoes/<id>/
     */
    public function patch_publicacao_detail()
    {
        $this->requireModuleAccess('noticias');

        $id = $this->params[0] ?? null;

        if (!$id) {
            Response::notFound()->send();
        }

        $publicacao = Publicacao::find($id);

        if (!$publicacao) {
            Response::notFound()->send();
        }

        $data = $this->getAllParameters();

        if (!empty($data['titulo'])) {
            $publicacao->attributes['titulo'] = $data['titulo'];
        }

        if (!empty($data['resumo'])) {
            $publicacao->attributes['resumo'] = $data['resumo'];
        }

        if (!empty($data['texto'])) {
            $publicacao->attributes['texto'] = $data['texto'];
        }

        if (isset($data['ativo'])) {
            $publicacao->attributes['ativo'] = $this->toBool($data['ativo']);
        }

        if ($this->hasFileInput('foto')) {
            // Deleta foto anterior
            $this->removeMediaFile($publicacao->attributes['foto']);
            $publicacao->attributes['foto'] = $this->storeFile('foto', 'noticias');
        }

        $publicacao->save();

        Response::success($this->serializePublicacao($publicacao))->send();
    }

    /**
     * Deleta uma publicação
     * DELETE /api/noticias/publicacoes/<id>/
     */
    public function delete_publicacao_detail()
    {
        $this->requireModuleAccess('noticias');

        $id = $this->params[0] ?? null;

        if (!$id) {
            Response::notFound()->send();
        }

        $publicacao = Publicacao::find($id);

        if (!$publicacao) {
            Response::notFound()->send();
        }

        $publicacao->delete();

        Response::success(['detail' => "Publicação {$id} removida com sucesso"], 204)->send();
    }

    /**
     * Serializa uma publicação para resposta JSON
     */
    private function serializePublicacao($publicacao)
    {
        return [
            'id' => $publicacao->attributes['id'],
            'categoria' => $publicacao->attributes['categoria'],
            'categoria_display' => $publicacao->getCategoriaDisplay(),
            'titulo' => $publicacao->attributes['titulo'],
            'resumo' => $publicacao->attributes['resumo'],
            'foto' => $publicacao->attributes['foto'] ? MEDIA_URL . $publicacao->attributes['foto'] : null,
            'texto' => $publicacao->attributes['texto'],
            'ativo' => (bool)$publicacao->attributes['ativo'],
            'created_at' => $publicacao->attributes['created_at'],
            'updated_at' => $publicacao->attributes['updated_at'],
        ];
    }

}
