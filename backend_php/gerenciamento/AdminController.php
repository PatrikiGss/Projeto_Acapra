<?php

namespace gerenciamento;

use core\Controller;
use core\Response;

/**
 * Controller de administração de usuários (somente master)
 * Equivalente ao AdminUsuariosView e AdminPerfilUpdateView do Django
 */
class AdminController extends Controller
{
    /**
     * Lista todos os usuários
     * GET /api/gerenciamento/admin/usuarios/
     */
    public function get_usuarios()
    {
        $this->requireMaster();

        $usuarios = Usuario::where('id', '>', 0)->orderBy('nome', 'ASC')->get();

        $data = [];
        foreach ($usuarios as $usuario) {
            $data[] = $this->serializeAdminUsuario($usuario);
        }

        Response::success($data)->send();
    }

    /**
     * Atualiza o perfil administrativo de um usuário
     * PATCH /api/gerenciamento/admin/usuarios/<id>/perfil/
     */
    public function patch_usuario_perfil()
    {
        $this->requireMaster();

        $pk = $this->params[0] ?? null;

        if (!$pk) {
            Response::notFound()->send();
        }

        $usuario = Usuario::find($pk);

        if (!$usuario) {
            Response::notFound()->send();
        }

        $perfil = PerfilAdministrativo::getOrCreateForUser($usuario);

        $data = $this->getAllParameters();

        // validate_nivel
        if (array_key_exists('nivel', $data)) {
            if (!isset(PerfilAdministrativo::NIVEIS[$data['nivel']])) {
                Response::validation(['nivel' => ['Nível administrativo inválido.']])->send();
            }
        }

        // validate: o diretor não pode remover o próprio vínculo
        $requestUser = $this->getUser();
        if (
            $requestUser
            && $usuario->attributes['id'] == $requestUser->attributes['id']
            && ($data['nivel'] ?? null) === PerfilAdministrativo::NIVEL_USUARIO
            && PerfilAdministrativo::getNivelUsuario($requestUser) === PerfilAdministrativo::NIVEL_MASTER
        ) {
            Response::validation([
                'detail' => ['O diretor não pode remover o próprio vínculo administrativo.']
            ])->send();
        }

        // Campos editáveis: nivel, cargo, setor, ativo, observacoes
        foreach (['nivel', 'cargo', 'setor', 'observacoes'] as $campo) {
            if (array_key_exists($campo, $data)) {
                $perfil->attributes[$campo] = $data[$campo];
            }
        }
        if (isset($data['ativo'])) {
            $perfil->attributes['ativo'] = (bool)$data['ativo'];
        }

        // save(promovido_por=request.user)
        $perfil->attributes['promovido_por'] = $requestUser->attributes['id'];
        $perfil->save();

        Response::success($this->serializeAdminUsuario($usuario))->send();
    }

    /**
     * Serializa um usuário para administração (AdminUsuarioSerializer)
     */
    private function serializeAdminUsuario($usuario)
    {
        $perfil = PerfilAdministrativo::where('usuario_id', '=', $usuario->attributes['id'])->first();

        $perfilData = null;
        if ($perfil) {
            $perfilData = [
                'nivel' => $perfil->attributes['nivel'],
                'nivel_display' => $perfil->getNivelDisplay(),
                'cargo' => $perfil->attributes['cargo'],
                'setor' => $perfil->attributes['setor'],
                'ativo' => (bool)$perfil->attributes['ativo'],
            ];
        }

        return [
            'id' => $usuario->attributes['id'],
            'nome' => $usuario->attributes['nome'],
            'email' => $usuario->attributes['email'],
            'telefone' => $usuario->attributes['telefone'],
            'date_joined' => $usuario->attributes['date_joined'],
            'perfil_admin' => $perfilData,
        ];
    }
}
