<?php

namespace denuncias;

use core\Controller;
use core\Response;
use core\Validator;

/**
 * Controller de denúncias
 * Equivalente aos views de denuncias do Django
 */
class DenunciaController extends Controller
{
    /**
     * Lista denúncias (módulo denuncias)
     * GET /api/denuncias/denuncias/
     */
    public function get_denuncias()
    {
        $this->requireModuleAccess('denuncias');

        $denuncias = Denuncia::where('id', '>', 0)->orderBy('created_at', 'DESC')->get();

        $data = [];
        foreach ($denuncias as $denuncia) {
            $data[] = $this->serializeDenuncia($denuncia);
        }

        Response::success($data)->send();
    }

    /**
     * Cria denúncia (público)
     * POST /api/denuncias/denuncias/
     */
    public function post_denuncias()
    {
        $data = $this->getAllParameters();

        $validator = new Validator($data, [
            'titulo' => 'required|max:100',
            'descricao' => 'required',
            'gravidade' => 'required',
        ]);

        if (!$validator->validate()) {
            Response::validation($validator->errors())->send();
        }

        // telefone: vazio vira null
        $telefone = $data['telefone'] ?? '';
        if ($telefone === '') {
            $telefone = null;
        }

        $denuncia = new Denuncia([
            'titulo' => $data['titulo'],
            'descricao' => $data['descricao'],
            'gravidade' => $data['gravidade'],
            'nome' => $data['nome'] ?? '',
            'telefone' => $telefone,
            'status' => Denuncia::STATUS_PENDENTE,
        ]);

        if ($this->hasFileInput('foto')) {
            $denuncia->attributes['foto'] = $this->storeFile('foto', 'fotos');
        }

        $denuncia->save();

        Response::success(
            ['detail' => 'Denúncia enviada com sucesso. Obrigado pelo contato.'],
            201
        )->send();
    }

    /**
     * Retorna detalhes de uma denúncia (módulo denuncias)
     * GET /api/denuncias/denuncias/<id>/
     */
    public function get_denuncia_detail()
    {
        $this->requireModuleAccess('denuncias');

        $denuncia = $this->getDenunciaOr404();
        Response::success($this->serializeDenuncia($denuncia))->send();
    }

    /**
     * Atualiza o status de uma denúncia (módulo denuncias)
     * PATCH /api/denuncias/denuncias/<id>/
     */
    public function patch_denuncia_detail()
    {
        $this->requireModuleAccess('denuncias');

        $denuncia = $this->getDenunciaOr404();
        $data = $this->getAllParameters();

        // DenunciaStatusSerializer: apenas o campo status
        if (isset($data['status'])) {
            $denuncia->attributes['status'] = $data['status'];
        }

        $denuncia->save();

        Response::success($this->serializeDenuncia($denuncia))->send();
    }

    /**
     * Remove uma denúncia (módulo denuncias)
     * DELETE /api/denuncias/denuncias/<id>/
     */
    public function delete_denuncia_detail()
    {
        $this->requireModuleAccess('denuncias');

        $id = $this->params[0] ?? null;
        $denuncia = $this->getDenunciaOr404();
        $denuncia->delete();

        Response::success(['detail' => "Denúncia {$id} removida com sucesso."], 204)->send();
    }

    /**
     * Busca a denúncia pelo ID ou retorna 404
     */
    private function getDenunciaOr404()
    {
        $id = $this->params[0] ?? null;

        if (!$id) {
            Response::notFound()->send();
        }

        $denuncia = Denuncia::find($id);

        if (!$denuncia) {
            Response::notFound()->send();
        }

        return $denuncia;
    }

    /**
     * Serializa uma denúncia (DenunciaAdminSerializer)
     */
    private function serializeDenuncia($denuncia)
    {
        return [
            'id' => $denuncia->attributes['id'],
            'titulo' => $denuncia->attributes['titulo'],
            'descricao' => $denuncia->attributes['descricao'],
            'gravidade' => $denuncia->attributes['gravidade'],
            'gravidade_display' => $denuncia->getGravidadeDisplay(),
            'nome' => $denuncia->attributes['nome'],
            'telefone' => $denuncia->attributes['telefone'],
            'foto' => $denuncia->attributes['foto'] ? MEDIA_URL . $denuncia->attributes['foto'] : null,
            'status' => $denuncia->attributes['status'],
            'status_display' => $denuncia->getStatusDisplay(),
            'created_at' => $denuncia->attributes['created_at'],
            'updated_at' => $denuncia->attributes['updated_at'],
        ];
    }

}
