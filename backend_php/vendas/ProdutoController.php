<?php

namespace vendas;

use core\Controller;
use core\Response;
use core\Validator;

/**
 * Controller de produtos
 * Equivalente aos views de vendas do Django
 */
class ProdutoController extends Controller
{
    /**
     * Lista produtos
     * GET /api/vendas/produtos/
     */
    public function get_produtos()
    {
        $query = Produto::where('id', '>', 0);

        if (!$this->getUser()) {
            $query = $query->where('ativo', '=', 1);
        }

        $produtos = $query->orderBy('id', 'DESC')->get();

        $data = [];
        foreach ($produtos as $produto) {
            $data[] = $this->serializeProduto($produto);
        }

        Response::success($data)->send();
    }

    /**
     * Cria um novo produto
     * POST /api/vendas/produtos/
     */
    public function post_produtos()
    {
        $this->requireModuleAccess('vendas');

        $data = $this->getAllParameters();

        $validator = new Validator($data, [
            'nome' => 'required|max:200',
            'tipo' => 'required',
            'preco' => 'required|numeric',
        ]);

        if (!$validator->validate()) {
            Response::validation($validator->errors())->send();
        }

        $produto = new Produto([
            'nome' => $data['nome'],
            'descricao' => $data['descricao'] ?? null,
            'tipo' => $data['tipo'],
            'preco' => $data['preco'],
            'estoque' => $data['estoque'] ?? 0,
            'ativo' => isset($data['ativo']) ? $this->toBool($data['ativo']) : true,
        ]);

        if ($this->hasFileInput('foto')) {
            $produto->attributes['foto'] = $this->storeFile('foto', 'produtos');
        }

        $produto->save();

        $this->criarImagens($produto, $this->storeFiles('fotos', 'produtos'));

        Response::success($this->serializeProduto($produto), 201)->send();
    }

    /**
     * Retorna detalhes de um produto
     * GET /api/vendas/produtos/<id>/
     */
    public function get_produto_detail()
    {
        $produto = $this->getProdutoOr404();
        Response::success($this->serializeProduto($produto))->send();
    }

    /**
     * Atualiza um produto
     * PATCH /api/vendas/produtos/<id>/
     */
    public function patch_produto_detail()
    {
        $this->requireModuleAccess('vendas');

        $produto = $this->getProdutoOr404();
        $data = $this->getAllParameters();

        foreach (['nome', 'tipo'] as $campo) {
            if (isset($data[$campo])) {
                $produto->attributes[$campo] = $data[$campo];
            }
        }
        if (array_key_exists('descricao', $data)) {
            $produto->attributes['descricao'] = $data['descricao'];
        }
        if (isset($data['preco'])) {
            $produto->attributes['preco'] = $data['preco'];
        }
        if (isset($data['estoque'])) {
            $produto->attributes['estoque'] = $data['estoque'];
        }
        if (isset($data['ativo'])) {
            $produto->attributes['ativo'] = $this->toBool($data['ativo']);
        }

        if ($this->hasFileInput('foto')) {
            $this->removeMediaFile($produto->attributes['foto']);
            $produto->attributes['foto'] = $this->storeFile('foto', 'produtos');
        }

        $produto->save();

        $this->criarImagens($produto, $this->storeFiles('fotos', 'produtos'));

        Response::success($this->serializeProduto($produto))->send();
    }

    /**
     * Remove um produto
     * DELETE /api/vendas/produtos/<id>/
     */
    public function delete_produto_detail()
    {
        $this->requireModuleAccess('vendas');

        $id = $this->params[0] ?? null;
        $produto = $this->getProdutoOr404();
        $produto->delete();

        Response::success(['detail' => "Produto {$id} removido com sucesso."], 204)->send();
    }

    /**
     * Lista produtos por tipo (humano ou pet)
     * GET /api/vendas/produtos/tipo/<tipo>/
     */
    public function get_produtos_por_tipo()
    {
        $tipo = $this->params[0] ?? null;
        $tiposValidos = ['humano', 'pet'];

        if (!in_array($tipo, $tiposValidos)) {
            Response::error('Tipo inválido. Use: ' . implode(', ', $tiposValidos), 400)->send();
        }

        $query = Produto::where('tipo', '=', $tipo);

        if (!$this->getUser()) {
            $query = $query->where('ativo', '=', 1);
        }

        $produtos = $query->orderBy('id', 'DESC')->get();

        $data = [];
        foreach ($produtos as $produto) {
            $data[] = $this->serializeProduto($produto);
        }

        Response::success($data)->send();
    }

    /**
     * Busca o produto pelo ID ou retorna 404
     */
    private function getProdutoOr404()
    {
        $id = $this->params[0] ?? null;

        if (!$id) {
            Response::notFound()->send();
        }

        $produto = Produto::find($id);

        if (!$produto) {
            Response::notFound()->send();
        }

        return $produto;
    }

    /**
     * Cria as imagens adicionais do produto
     * Equivalente a _criar_imagens_produto do Django
     */
    private function criarImagens($produto, $paths)
    {
        if (empty($paths)) {
            return;
        }

        $existentes = $produto->imagens();
        $ultimaOrdem = null;
        foreach ($existentes as $img) {
            $ordem = (int)$img->attributes['ordem'];
            if ($ultimaOrdem === null || $ordem > $ultimaOrdem) {
                $ultimaOrdem = $ordem;
            }
        }
        $proximaOrdem = $ultimaOrdem !== null ? $ultimaOrdem + 1 : 0;

        foreach (array_values($paths) as $indice => $path) {
            $imagem = new ProdutoImagem([
                'produto_id' => $produto->attributes['id'],
                'imagem' => $path,
                'ordem' => $proximaOrdem + $indice,
            ]);
            $imagem->save();
        }
    }

    /**
     * Serializa um produto (GetProdutoSerializer)
     */
    private function serializeProduto($produto)
    {
        return [
            'id' => $produto->attributes['id'],
            'nome' => $produto->attributes['nome'],
            'descricao' => $produto->attributes['descricao'],
            'tipo' => $produto->attributes['tipo'],
            'tipo_display' => $produto->getTipoDisplay(),
            'preco' => $produto->attributes['preco'],
            'foto' => $this->getFotoPrincipal($produto),
            'fotos' => $this->getFotos($produto),
            'estoque' => (int)$produto->attributes['estoque'],
            'ativo' => (bool)$produto->attributes['ativo'],
            'created_at' => $produto->attributes['created_at'],
        ];
    }

    /**
     * Retorna a foto principal (foto ou primeira imagem)
     */
    private function getFotoPrincipal($produto)
    {
        if (!empty($produto->attributes['foto'])) {
            return $this->buildFileUrl($produto->attributes['foto']);
        }

        $imagens = $produto->imagens();
        if (!empty($imagens)) {
            return $this->buildFileUrl($imagens[0]->attributes['imagem']);
        }

        return null;
    }

    /**
     * Retorna todas as fotos (foto + imagens), sem duplicatas
     */
    private function getFotos($produto)
    {
        $imagens = [];

        if (!empty($produto->attributes['foto'])) {
            $imagens[] = $this->buildFileUrl($produto->attributes['foto']);
        }

        foreach ($produto->imagens() as $img) {
            if (!empty($img->attributes['imagem'])) {
                $imagens[] = $this->buildFileUrl($img->attributes['imagem']);
            }
        }

        return array_values(array_unique(array_filter($imagens)));
    }

    /**
     * Constrói a URL pública de um arquivo de mídia
     */
    private function buildFileUrl($path)
    {
        return $path ? MEDIA_URL . $path : null;
    }
}
