<?php

namespace gerenciamento;

use core\Controller;
use core\Response;
use core\JWT;
use core\Validator;

/**
 * Controller de autenticação
 * Equivalente aos views de autenticação do Django
 */
class AuthController extends Controller
{
    /**
     * Registro de novo usuário
     * POST /api/gerenciamento/auth/register/
     */
    public function post_register()
    {
        $data = $this->getAllParameters();

        $validator = new Validator($data, [
            'nome' => 'required|string',
            'email' => 'required|email',
            'telefone' => 'required|phone',
            'password' => 'required|min:8'
        ]);

        if (!$validator->validate()) {
            Response::validation($validator->errors())->send();
        }

        try {
            $user = Usuario::createUser(
                $data['email'],
                $data['password'],
                [
                    'nome' => $data['nome'],
                    'telefone' => $data['telefone']
                ]
            );

            // Cria perfil administrativo padrão
            PerfilAdministrativo::getOrCreateForUser($user);

            $response = [
                'id' => $user->attributes['id'],
                'nome' => $user->attributes['nome'],
                'email' => $user->attributes['email'],
                'telefone' => $user->attributes['telefone'],
            ];

            Response::success($response, 201)->send();
        } catch (\Exception $e) {
            Response::error($e->getMessage(), 400)->send();
        }
    }

    /**
     * Login / Obter tokens
     * POST /api/gerenciamento/auth/login/
     */
    public function post_login()
    {
        $data = $this->getAllParameters();

        $validator = new Validator($data, [
            'email' => 'required|email',
            'password' => 'required'
        ]);

        if (!$validator->validate()) {
            Response::validation($validator->errors())->send();
        }

        $user = Usuario::findByEmail($data['email']);

        if (!$user || !$user->validatePassword($data['password'])) {
            Response::error('Email ou senha inválidos', 401)->send();
        }

        $perfil = PerfilAdministrativo::where('usuario_id', '=', $user->attributes['id'])->first();
        $nivel = $perfil ? $perfil->attributes['nivel'] : PerfilAdministrativo::NIVEL_USUARIO;

        $userData = [
            'nome' => $user->attributes['nome'],
            'email' => $user->attributes['email'],
            'nivel' => $nivel
        ];

        $tokens = JWT::createTokenPair($user->attributes['id'], $userData);

        Response::success($tokens, 200)->send();
    }

    /**
     * Refresh do token de acesso
     * POST /api/gerenciamento/auth/refresh/
     */
    public function post_refresh()
    {
        $data = $this->getAllParameters();

        if (empty($data['refresh'])) {
            Response::error('Token de atualização não fornecido', 400)->send();
        }

        $payload = JWT::verifyToken($data['refresh']);

        if (!$payload || $payload['type'] !== 'refresh') {
            Response::error('Token de atualização inválido', 401)->send();
        }

        $user = Usuario::find($payload['user_id']);

        if (!$user) {
            Response::error('Usuário não encontrado', 404)->send();
        }

        $perfil = PerfilAdministrativo::where('usuario_id', '=', $user->attributes['id'])->first();
        $nivel = $perfil ? $perfil->attributes['nivel'] : PerfilAdministrativo::NIVEL_USUARIO;

        $userData = [
            'nome' => $user->attributes['nome'],
            'email' => $user->attributes['email'],
            'nivel' => $nivel
        ];

        $accessToken = JWT::createAccessToken($user->attributes['id'], $userData);

        Response::success(['access' => $accessToken], 200)->send();
    }

    /**
     * Logout (blacklist de token)
     * POST /api/gerenciamento/auth/logout/
     */
    public function post_logout()
    {
        $this->requireAuth();

        // Em uma aplicação real, você manteria uma lista de tokens blacklist
        // Por simplicidade, apenas confirmamos que o logout foi solicitado
        Response::success(['detail' => 'Logout realizado com sucesso'], 200)->send();
    }
}
