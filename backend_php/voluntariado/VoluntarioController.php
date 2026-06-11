<?php

namespace voluntariado;

use core\Controller;
use core\Response;
use core\Validator;

/**
 * Controller de voluntários
 * Equivalente aos views de voluntariado do Django
 */
class VoluntarioController extends Controller
{
    /**
     * Lista voluntários (autenticado)
     * GET /api/voluntariado/voluntarios/
     */
    public function get_voluntarios()
    {
        $this->requireModuleAccess('voluntariado');

        $voluntarios = Voluntario::where('id', '>', 0)->orderBy('created_at', 'DESC')->get();

        $data = [];
        foreach ($voluntarios as $voluntario) {
            $data[] = $this->serializeVoluntario($voluntario);
        }

        Response::success($data)->send();
    }

    /**
     * Cria novo voluntário (público)
     * POST /api/voluntariado/voluntarios/
     */
    public function post_voluntarios()
    {
        $data = $this->getAllParameters();

        $validator = new Validator($data, [
            'nome' => 'required|max:200',
            'telefone' => 'required|phone',
            'idade' => 'required|numeric',
            'motivo' => 'required',
        ]);

        if (!$validator->validate()) {
            Response::validation($validator->errors())->send();
        }

        // validate_idade: entre 0 e 150
        $idade = (int)$data['idade'];
        if ($idade < 0 || $idade > 150) {
            Response::validation(['idade' => ['A idade deve estar entre 0 e 150 anos.']])->send();
        }

        // validate_motivo: pelo menos 10 caracteres
        if (strlen($data['motivo']) < 10) {
            Response::validation(['motivo' => ['O motivo deve ter pelo menos 10 caracteres.']])->send();
        }

        $voluntario = new Voluntario([
            'nome' => $data['nome'],
            'telefone' => $data['telefone'],
            'idade' => $idade,
            'motivo' => $data['motivo'],
            'email' => $data['email'] ?? null,
        ]);
        $voluntario->save();

        Response::success([
            'detail' => 'Obrigado por se voluntariar! Entraremos em contato em breve.',
            'id' => $voluntario->attributes['id'],
            'nome' => $voluntario->attributes['nome'],
        ], 201)->send();
    }

    /**
     * Retorna detalhes de um voluntário (autenticado)
     * GET /api/voluntariado/voluntarios/<id>/
     */
    public function get_voluntario_detail()
    {
        $this->requireModuleAccess('voluntariado');

        $voluntario = $this->getVoluntarioOr404();
        Response::success($this->serializeVoluntario($voluntario))->send();
    }

    /**
     * Atualiza um voluntário (autenticado)
     * PATCH /api/voluntariado/voluntarios/<id>/
     */
    public function patch_voluntario_detail()
    {
        $this->requireModuleAccess('voluntariado');

        $voluntario = $this->getVoluntarioOr404();
        $data = $this->getAllParameters();

        foreach (['nome', 'telefone', 'motivo'] as $campo) {
            if (isset($data[$campo])) {
                $voluntario->attributes[$campo] = $data[$campo];
            }
        }
        if (isset($data['idade'])) {
            $voluntario->attributes['idade'] = (int)$data['idade'];
        }
        if (array_key_exists('email', $data)) {
            $voluntario->attributes['email'] = $data['email'];
        }

        $voluntario->save();

        // VoluntarioSerializer: id, nome, telefone, idade, motivo, email, ativo
        Response::success([
            'id' => $voluntario->attributes['id'],
            'nome' => $voluntario->attributes['nome'],
            'telefone' => $voluntario->attributes['telefone'],
            'idade' => (int)$voluntario->attributes['idade'],
            'motivo' => $voluntario->attributes['motivo'],
            'email' => $voluntario->attributes['email'],
            'ativo' => (bool)$voluntario->attributes['ativo'],
        ])->send();
    }

    /**
     * Remove um voluntário (autenticado)
     * DELETE /api/voluntariado/voluntarios/<id>/
     */
    public function delete_voluntario_detail()
    {
        $this->requireModuleAccess('voluntariado');

        $id = $this->params[0] ?? null;
        $voluntario = $this->getVoluntarioOr404();
        $voluntario->delete();

        Response::success(['detail' => "Voluntário {$id} removido com sucesso."], 204)->send();
    }

    /**
     * Busca o voluntário pelo ID ou retorna 404
     */
    private function getVoluntarioOr404()
    {
        $id = $this->params[0] ?? null;

        if (!$id) {
            Response::error('Voluntário não encontrado.', 404)->send();
        }

        $voluntario = Voluntario::find($id);

        if (!$voluntario) {
            Response::error('Voluntário não encontrado.', 404)->send();
        }

        return $voluntario;
    }

    /**
     * Serializa um voluntário (GetVoluntarioSerializer)
     */
    private function serializeVoluntario($voluntario)
    {
        return [
            'id' => $voluntario->attributes['id'],
            'nome' => $voluntario->attributes['nome'],
            'telefone' => $voluntario->attributes['telefone'],
            'idade' => (int)$voluntario->attributes['idade'],
            'motivo' => $voluntario->attributes['motivo'],
            'email' => $voluntario->attributes['email'],
            'ativo' => (bool)$voluntario->attributes['ativo'],
            'created_at' => $voluntario->attributes['created_at'],
        ];
    }
}
