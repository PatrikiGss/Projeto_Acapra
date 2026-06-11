<?php

namespace transparencia;

use core\Controller;
use core\Response;
use core\Validator;

/**
 * Controller de transparência
 * Equivalente aos views de transparencia do Django
 */
class TransparenciaController extends Controller
{
    // =====================================================
    // CATEGORIAS
    // =====================================================

    /**
     * GET  /api/transparencia/categorias/  (público)
     * POST /api/transparencia/categorias/  (módulo transparencia)
     */
    public function get_categorias()
    {
        $auth = (bool)$this->getUser();

        $query = Categoria::where('id', '>', 0);
        if (!$auth) {
            $query = $query->where('ativo', '=', 1);
        }

        $tipo = $this->getParameter('tipo');
        if (in_array($tipo, ['entrada', 'saida'])) {
            $query = $query->where('tipo', '=', $tipo);
        }

        $categorias = $query->orderBy('tipo', 'ASC')->get();

        $data = [];
        foreach ($categorias as $categoria) {
            $data[] = $this->serializeCategoria($categoria, $auth);
        }

        Response::success($data)->send();
    }

    public function post_categorias()
    {
        $this->requireModuleAccess('transparencia');

        $data = $this->getAllParameters();

        $validator = new Validator($data, [
            'nome' => 'required|max:100',
            'tipo' => 'required',
        ]);

        if (!$validator->validate()) {
            Response::validation($validator->errors())->send();
        }

        $categoria = new Categoria([
            'nome' => $data['nome'],
            'tipo' => $data['tipo'],
            'ativo' => isset($data['ativo']) ? $this->toBool($data['ativo']) : true,
        ]);
        $categoria->save();

        Response::success($this->serializeCategoria($categoria, true), 201)->send();
    }

    /**
     * GET    /api/transparencia/categorias/<id>/  (público)
     * PATCH  /api/transparencia/categorias/<id>/  (módulo transparencia)
     * DELETE /api/transparencia/categorias/<id>/  (módulo transparencia)
     */
    public function get_categoria_detail()
    {
        $categoria = $this->findOr404(Categoria::class);
        Response::success($this->serializeCategoria($categoria, (bool)$this->getUser()))->send();
    }

    public function patch_categoria_detail()
    {
        $this->requireModuleAccess('transparencia');

        $categoria = $this->findOr404(Categoria::class);
        $data = $this->getAllParameters();

        foreach (['nome', 'tipo'] as $campo) {
            if (array_key_exists($campo, $data)) {
                $categoria->attributes[$campo] = $data[$campo];
            }
        }
        if (isset($data['ativo'])) {
            $categoria->attributes['ativo'] = $this->toBool($data['ativo']);
        }

        $categoria->save();

        Response::success($this->serializeCategoria($categoria, true))->send();
    }

    public function delete_categoria_detail()
    {
        $this->requireModuleAccess('transparencia');

        $id = $this->params[0] ?? null;
        $categoria = $this->findOr404(Categoria::class);
        $categoria->delete();

        Response::success(['detail' => "Categoria {$id} removida."], 204)->send();
    }

    // =====================================================
    // MOVIMENTOS
    // =====================================================

    /**
     * GET  /api/transparencia/movimentos/  (público)
     * POST /api/transparencia/movimentos/  (módulo transparencia)
     */
    public function get_movimentos()
    {
        $auth = (bool)$this->getUser();

        $query = Movimento::where('id', '>', 0);
        if (!$auth) {
            $query = $query->where('ativo', '=', 1);
        }

        $categoriaId = $this->getParameter('categoria');
        if ($categoriaId) {
            $query = $query->where('categoria_id', '=', $categoriaId);
        }

        $movimentos = $query->orderBy('data', 'DESC')->get();

        // Filtro por tipo da categoria
        $tipo = $this->getParameter('tipo');

        $data = [];
        foreach ($movimentos as $movimento) {
            if (in_array($tipo, ['entrada', 'saida'])) {
                $categoria = $movimento->categoria();
                if (!$categoria || $categoria->attributes['tipo'] !== $tipo) {
                    continue;
                }
            }
            $data[] = $this->serializeMovimento($movimento);
        }

        Response::success($data)->send();
    }

    public function post_movimentos()
    {
        $this->requireModuleAccess('transparencia');

        $data = $this->getAllParameters();

        $validator = new Validator($data, [
            'categoria' => 'required',
            'descricao' => 'required|max:300',
            'valor' => 'required|numeric',
            'data' => 'required|date',
        ]);

        if (!$validator->validate()) {
            Response::validation($validator->errors())->send();
        }

        $movimento = new Movimento([
            'categoria_id' => $data['categoria'],
            'descricao' => $data['descricao'],
            'valor' => $data['valor'],
            'data' => $data['data'],
            'ativo' => isset($data['ativo']) ? $this->toBool($data['ativo']) : true,
        ]);

        if ($this->hasFileInput('comprovante')) {
            $movimento->attributes['comprovante'] = $this->storeFile('comprovante', 'transparencia');
        }

        $movimento->save();

        Response::success($this->serializeMovimento($movimento), 201)->send();
    }

    /**
     * PATCH  /api/transparencia/movimentos/<id>/  (módulo transparencia)
     * DELETE /api/transparencia/movimentos/<id>/  (módulo transparencia)
     */
    public function patch_movimento_detail()
    {
        $this->requireModuleAccess('transparencia');

        $movimento = $this->findOr404(Movimento::class);
        $data = $this->getAllParameters();

        $remover = $this->toBool($data['remover_comprovante'] ?? false);
        $novoComprovante = $this->hasFileInput('comprovante');

        if (($remover || $novoComprovante) && !empty($movimento->attributes['comprovante'])) {
            $this->removeMediaFile($movimento->attributes['comprovante']);
            if (!$novoComprovante) {
                $movimento->attributes['comprovante'] = null;
            }
        }

        if ($novoComprovante) {
            $movimento->attributes['comprovante'] = $this->storeFile('comprovante', 'transparencia');
        }

        if (array_key_exists('categoria', $data)) {
            $movimento->attributes['categoria_id'] = $data['categoria'];
        }
        foreach (['descricao', 'valor', 'data'] as $campo) {
            if (array_key_exists($campo, $data)) {
                $movimento->attributes[$campo] = $data[$campo];
            }
        }
        if (isset($data['ativo'])) {
            $movimento->attributes['ativo'] = $this->toBool($data['ativo']);
        }

        $movimento->save();

        Response::success($this->serializeMovimento($movimento))->send();
    }

    public function delete_movimento_detail()
    {
        $this->requireModuleAccess('transparencia');

        $id = $this->params[0] ?? null;
        $movimento = $this->findOr404(Movimento::class);
        $movimento->delete();

        Response::success(['detail' => "Movimento {$id} removido."], 204)->send();
    }

    // =====================================================
    // DOCUMENTOS INSTITUCIONAIS
    // =====================================================

    /**
     * GET  /api/transparencia/documentos/  (público)
     * POST /api/transparencia/documentos/  (módulo transparencia)
     */
    public function get_documentos()
    {
        $auth = (bool)$this->getUser();

        $query = DocumentoInstitucional::where('id', '>', 0);
        if (!$auth) {
            $query = $query->where('ativo', '=', 1);
        }

        $documentos = $query->orderBy('ordem', 'ASC')->get();

        $data = [];
        foreach ($documentos as $documento) {
            $data[] = $this->serializeDocumento($documento);
        }

        Response::success($data)->send();
    }

    public function post_documentos()
    {
        $this->requireModuleAccess('transparencia');

        $data = $this->getAllParameters();

        $validator = new Validator($data, [
            'nome' => 'required|max:200',
        ]);

        if (!$validator->validate()) {
            Response::validation($validator->errors())->send();
        }

        $documento = new DocumentoInstitucional([
            'nome' => $data['nome'],
            'descricao' => $data['descricao'] ?? '',
            'ativo' => isset($data['ativo']) ? $this->toBool($data['ativo']) : true,
            'ordem' => $data['ordem'] ?? 0,
        ]);

        if ($this->hasFileInput('arquivo')) {
            $documento->attributes['arquivo'] = $this->storeFile('arquivo', 'transparencia/documentos');
        }

        $documento->save();

        Response::success($this->serializeDocumento($documento), 201)->send();
    }

    /**
     * PATCH  /api/transparencia/documentos/<id>/  (módulo transparencia)
     * DELETE /api/transparencia/documentos/<id>/  (módulo transparencia)
     */
    public function patch_documento_detail()
    {
        $this->requireModuleAccess('transparencia');

        $documento = $this->findOr404(DocumentoInstitucional::class);
        $data = $this->getAllParameters();

        $remover = $this->toBool($data['remover_arquivo'] ?? false);
        $novoArquivo = $this->hasFileInput('arquivo');

        if (($remover || $novoArquivo) && !empty($documento->attributes['arquivo'])) {
            $this->removeMediaFile($documento->attributes['arquivo']);
            if (!$novoArquivo) {
                $documento->attributes['arquivo'] = null;
            }
        }

        if ($novoArquivo) {
            $documento->attributes['arquivo'] = $this->storeFile('arquivo', 'transparencia/documentos');
        }

        foreach (['nome', 'descricao'] as $campo) {
            if (array_key_exists($campo, $data)) {
                $documento->attributes[$campo] = $data[$campo];
            }
        }
        if (isset($data['ativo'])) {
            $documento->attributes['ativo'] = $this->toBool($data['ativo']);
        }
        if (array_key_exists('ordem', $data)) {
            $documento->attributes['ordem'] = $data['ordem'];
        }

        $documento->save();

        Response::success($this->serializeDocumento($documento))->send();
    }

    public function delete_documento_detail()
    {
        $this->requireModuleAccess('transparencia');

        $id = $this->params[0] ?? null;
        $documento = $this->findOr404(DocumentoInstitucional::class);
        $documento->delete();

        Response::success(['detail' => "Documento {$id} removido."], 204)->send();
    }

    // =====================================================
    // INDICADORES
    // =====================================================

    /**
     * GET /api/transparencia/indicadores/  (público)
     */
    public function get_indicadores()
    {
        // Garante que os três indicadores existam para leitura/edição
        foreach (array_keys(Indicador::CHAVES) as $chave) {
            $existe = Indicador::where('chave', '=', $chave)->first();
            if (!$existe) {
                $indicador = new Indicador(['chave' => $chave, 'valor' => 0]);
                $indicador->save();
            }
        }

        $indicadores = Indicador::where('id', '>', 0)->orderBy('chave', 'ASC')->get();

        $data = [];
        foreach ($indicadores as $indicador) {
            $data[] = $this->serializeIndicador($indicador);
        }

        Response::success($data)->send();
    }

    /**
     * PATCH /api/transparencia/indicadores/<id>/  (módulo transparencia)
     */
    public function patch_indicador_detail()
    {
        $this->requireModuleAccess('transparencia');

        $indicador = $this->findOr404(Indicador::class);
        $data = $this->getAllParameters();

        if (array_key_exists('chave', $data)) {
            $indicador->attributes['chave'] = $data['chave'];
        }
        if (array_key_exists('valor', $data)) {
            $indicador->attributes['valor'] = $data['valor'];
        }

        $indicador->save();

        Response::success($this->serializeIndicador($indicador))->send();
    }

    // =====================================================
    // HELPERS
    // =====================================================

    /**
     * Busca um registro pelo ID ou retorna 404
     */
    private function findOr404($modelClass)
    {
        $id = $this->params[0] ?? null;

        if (!$id) {
            Response::notFound()->send();
        }

        $instance = $modelClass::find($id);

        if (!$instance) {
            Response::notFound()->send();
        }

        return $instance;
    }

    /**
     * Serializa uma categoria (CategoriaReadSerializer)
     */
    private function serializeCategoria($categoria, $auth)
    {
        $movimentosQuery = $categoria->movimentos();
        if (!$auth) {
            $movimentosQuery = $movimentosQuery->where('ativo', '=', 1);
        }

        $movimentos = [];
        foreach ($movimentosQuery->get() as $movimento) {
            $movimentos[] = $this->serializeMovimento($movimento);
        }

        return [
            'id' => $categoria->attributes['id'],
            'nome' => $categoria->attributes['nome'],
            'tipo' => $categoria->attributes['tipo'],
            'tipo_display' => $categoria->getTipoDisplay(),
            'ativo' => (bool)$categoria->attributes['ativo'],
            'movimentos' => $movimentos,
        ];
    }

    /**
     * Serializa um movimento (MovimentoReadSerializer)
     */
    private function serializeMovimento($movimento)
    {
        return [
            'id' => $movimento->attributes['id'],
            'categoria' => $movimento->attributes['categoria_id'],
            'descricao' => $movimento->attributes['descricao'],
            'valor' => $movimento->attributes['valor'],
            'data' => $movimento->attributes['data'],
            'comprovante' => $movimento->attributes['comprovante'] ? MEDIA_URL . $movimento->attributes['comprovante'] : null,
            'ativo' => (bool)$movimento->attributes['ativo'],
            'created_at' => $movimento->attributes['created_at'],
        ];
    }

    /**
     * Serializa um documento (DocumentoInstitucionalReadSerializer)
     */
    private function serializeDocumento($documento)
    {
        return [
            'id' => $documento->attributes['id'],
            'nome' => $documento->attributes['nome'],
            'descricao' => $documento->attributes['descricao'],
            'arquivo' => $documento->attributes['arquivo'] ? MEDIA_URL . $documento->attributes['arquivo'] : null,
            'ativo' => (bool)$documento->attributes['ativo'],
            'ordem' => (int)$documento->attributes['ordem'],
            'created_at' => $documento->attributes['created_at'],
        ];
    }

    /**
     * Serializa um indicador (IndicadorReadSerializer)
     */
    private function serializeIndicador($indicador)
    {
        return [
            'id' => $indicador->attributes['id'],
            'chave' => $indicador->attributes['chave'],
            'chave_display' => $indicador->getChaveDisplay(),
            'valor' => (int)$indicador->attributes['valor'],
            'updated_at' => $indicador->attributes['updated_at'],
        ];
    }

}
