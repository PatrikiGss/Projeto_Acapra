<?php

namespace lares;

use core\Controller;
use core\Response;
use core\Validator;

/**
 * Controller de lares voluntários
 * Equivalente aos views de lares do Django
 */
class LarVoluntarioController extends Controller
{
    private static $tiposValidos = ['todos', 'caes', 'gatos', 'caes_gatos'];

    private static $tiposDisplay = [
        'todos'      => 'Todos',
        'caes'       => 'Cães',
        'gatos'      => 'Gatos',
        'caes_gatos' => 'Cães e Gatos',
    ];

    /**
     * Lista lares voluntários (autenticado)
     * GET /api/lares/lares/
     */
    public function get_lares()
    {
        $this->requireModuleAccess('voluntariado');

        $lares = LarVoluntario::where('id', '>', 0)->orderBy('created_at', 'DESC')->get();

        $data = [];
        foreach ($lares as $lar) {
            $data[] = $this->serializeLar($lar, true);
        }

        Response::success($data)->send();
    }

    /**
     * Cria novo lar voluntário (público)
     * POST /api/lares/lares/
     */
    public function post_lares()
    {
        $data = $this->getAllParameters();

        $validator = new Validator($data, [
            'nome_responsavel' => 'required|max:200',
            'telefone'         => 'required|phone',
            'cidade'           => 'required|max:100',
            'tipos_animais'    => 'required',
            'capacidade'       => 'required|numeric',
            'descricao'        => 'required',
        ]);

        if (!$validator->validate()) {
            Response::validation($validator->errors())->send();
        }

        $tipos_animais = $data['tipos_animais'] ?? '';
        if (!in_array($tipos_animais, self::$tiposValidos, true)) {
            Response::validation(['tipos_animais' => ['Tipo de animal inválido.']])->send();
        }

        $capacidade = (int)$data['capacidade'];
        if ($capacidade < 1) {
            Response::validation(['capacidade' => ['A capacidade deve ser de pelo menos 1 animal.']])->send();
        }
        if ($capacidade > 50) {
            Response::validation(['capacidade' => ['A capacidade não pode ultrapassar 50 animais.']])->send();
        }

        if (strlen($data['descricao']) < 20) {
            Response::validation(['descricao' => ['A descrição deve ter pelo menos 20 caracteres.']])->send();
        }

        $lar = new LarVoluntario([
            'nome_responsavel' => $data['nome_responsavel'],
            'telefone'         => $data['telefone'],
            'email'            => $data['email'] ?? null,
            'cidade'           => $data['cidade'],
            'tipos_animais'    => $tipos_animais,
            'capacidade'       => $capacidade,
            'descricao'        => $data['descricao'],
        ]);
        $lar->save();

        Response::success([
            'detail'            => 'Cadastro de lar voluntário enviado! Entraremos em contato em breve.',
            'id'                => $lar->attributes['id'],
            'nome_responsavel'  => $lar->attributes['nome_responsavel'],
        ], 201)->send();
    }

    /**
     * Retorna detalhes de um lar (autenticado)
     * GET /api/lares/lares/<id>/
     */
    public function get_lar_detail()
    {
        $this->requireModuleAccess('voluntariado');
        $lar = $this->getLarOr404();
        Response::success($this->serializeLar($lar, true))->send();
    }

    /**
     * Atualiza um lar (autenticado)
     * PATCH /api/lares/lares/<id>/
     */
    public function patch_lar_detail()
    {
        $this->requireModuleAccess('voluntariado');
        $lar = $this->getLarOr404();
        $data = $this->getAllParameters();

        foreach (['nome_responsavel', 'telefone', 'cidade', 'descricao'] as $campo) {
            if (isset($data[$campo])) {
                $lar->attributes[$campo] = $data[$campo];
            }
        }
        if (array_key_exists('email', $data)) {
            $lar->attributes['email'] = $data['email'];
        }
        if (isset($data['tipos_animais']) && in_array($data['tipos_animais'], self::$tiposValidos, true)) {
            $lar->attributes['tipos_animais'] = $data['tipos_animais'];
        }
        if (isset($data['capacidade'])) {
            $lar->attributes['capacidade'] = (int)$data['capacidade'];
        }
        if (isset($data['ativo'])) {
            $lar->attributes['ativo'] = (bool)$data['ativo'];
        }

        $lar->save();

        Response::success($this->serializeLar($lar, false))->send();
    }

    /**
     * Remove um lar (autenticado)
     * DELETE /api/lares/lares/<id>/
     */
    public function delete_lar_detail()
    {
        $this->requireModuleAccess('voluntariado');
        $id = $this->params[0] ?? null;
        $lar = $this->getLarOr404();
        $lar->delete();

        Response::success(['detail' => "Lar voluntário {$id} removido com sucesso."], 204)->send();
    }

    private function getLarOr404()
    {
        $id = $this->params[0] ?? null;
        if (!$id) {
            Response::error('Lar voluntário não encontrado.', 404)->send();
        }
        $lar = LarVoluntario::find($id);
        if (!$lar) {
            Response::error('Lar voluntário não encontrado.', 404)->send();
        }
        return $lar;
    }

    private function serializeLar($lar, bool $includeCreatedAt)
    {
        $tipos = $lar->attributes['tipos_animais'] ?? 'todos';
        $result = [
            'id'                   => $lar->attributes['id'],
            'nome_responsavel'     => $lar->attributes['nome_responsavel'],
            'telefone'             => $lar->attributes['telefone'],
            'email'                => $lar->attributes['email'],
            'cidade'               => $lar->attributes['cidade'],
            'tipos_animais'        => $tipos,
            'tipos_animais_display' => self::$tiposDisplay[$tipos] ?? $tipos,
            'capacidade'           => (int)$lar->attributes['capacidade'],
            'descricao'            => $lar->attributes['descricao'],
            'ativo'                => (bool)$lar->attributes['ativo'],
        ];
        if ($includeCreatedAt) {
            $result['created_at'] = $lar->attributes['created_at'];
        }
        return $result;
    }
}
