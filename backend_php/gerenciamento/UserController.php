<?php

namespace gerenciamento;

use core\Controller;
use core\Response;
use core\Validator;

/**
 * Controller de usuário
 * Equivalente aos views de usuário do Django
 */
class UserController extends Controller
{
    /**
     * Obtém dados do usuário logado
     * GET /api/gerenciamento/user/me/
     */
    public function get_me()
    {
        $this->requireAuth();

        $user = $this->getUser();
        $perfil = PerfilAdministrativo::where('usuario_id', '=', $user->attributes['id'])->first();

        $response = [
            'id' => $user->attributes['id'],
            'nome' => $user->attributes['nome'],
            'email' => $user->attributes['email'],
            'telefone' => $user->attributes['telefone'],
            'perfil_admin' => null
        ];

        if ($perfil) {
            $response['perfil_admin'] = [
                'nivel' => $perfil->attributes['nivel'],
                'nivel_display' => $perfil->getNivelDisplay(),
                'cargo' => $perfil->attributes['cargo'],
                'setor' => $perfil->attributes['setor'],
                'ativo' => (bool)$perfil->attributes['ativo']
            ];
        }

        Response::success($response)->send();
    }

    /**
     * Atualiza dados do usuário logado
     * PATCH /api/gerenciamento/user/me/
     */
    public function patch_me()
    {
        $this->requireAuth();

        $data = $this->getAllParameters();
        $user = $this->getUser();

        $validator = new Validator($data, [
            'nome' => 'string',
            'telefone' => 'phone',
        ]);

        if (!$validator->validate()) {
            Response::validation($validator->errors())->send();
        }

        if (!empty($data['nome'])) {
            $user->attributes['nome'] = $data['nome'];
        }

        if (!empty($data['telefone'])) {
            $user->attributes['telefone'] = $data['telefone'];
        }

        $user->save();

        $response = [
            'id' => $user->attributes['id'],
            'nome' => $user->attributes['nome'],
            'email' => $user->attributes['email'],
            'telefone' => $user->attributes['telefone'],
        ];

        Response::success($response)->send();
    }

    /**
     * Altera a senha do usuário
     * POST /api/gerenciamento/user/change-password/
     */
    public function post_change_password()
    {
        $this->requireAuth();

        $data = $this->getAllParameters();
        $user = $this->getUser();

        $validator = new Validator($data, [
            'old_password' => 'required',
            'new_password' => 'required|min:8',
        ]);

        if (!$validator->validate()) {
            Response::validation($validator->errors())->send();
        }

        if (!$user->validatePassword($data['old_password'])) {
            Response::error('Senha atual incorreta', 400)->send();
        }

        $user->attributes['password'] = password_hash($data['new_password'], PASSWORD_BCRYPT);
        $user->save();

        Response::success(['detail' => 'Senha alterada com sucesso'])->send();
    }
}
