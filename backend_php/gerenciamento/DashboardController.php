<?php

namespace gerenciamento;

use core\Controller;
use core\Response;
use adocao\Animal;
use doacoes\DadosPix;
use noticias\Publicacao;
use vendas\Produto;
use voluntariado\Voluntario;

/**
 * Controller do dashboard administrativo
 * Equivalente ao DashboardView do Django
 */
class DashboardController extends Controller
{
    /**
     * GET /api/gerenciamento/dashboard/
     * Requer autenticação (TemAcessoDashboard)
     */
    public function get_dashboard()
    {
        $this->requireAuth();

        $user = $this->getUser();

        $nivel = PerfilAdministrativo::getNivelUsuario($user);
        $modulos = PerfilAdministrativo::getModulosUsuario($user);
        sort($modulos);

        $estatisticas = [];

        if ($nivel === PerfilAdministrativo::NIVEL_MASTER) {
            $estatisticas = [
                'animais' => Animal::where('id', '>', 0)->count(),
                'publicacoes' => Publicacao::where('id', '>', 0)->count(),
                'produtos' => Produto::where('id', '>', 0)->count(),
                'dados_pix' => DadosPix::where('id', '>', 0)->count(),
                'usuarios' => Usuario::where('id', '>', 0)->count(),
                'voluntarios' => Voluntario::where('id', '>', 0)->count(),
            ];
        } elseif ($nivel === PerfilAdministrativo::NIVEL_FINANCEIRO) {
            $estatisticas = [
                'dados_pix' => DadosPix::where('id', '>', 0)->count(),
            ];
        } elseif ($nivel === PerfilAdministrativo::NIVEL_DOACOES) {
            $estatisticas = [
                'animais' => Animal::where('id', '>', 0)->count(),
                'publicacoes' => Publicacao::where('id', '>', 0)->count(),
            ];
        }

        $perfil = PerfilAdministrativo::where('usuario_id', '=', $user->attributes['id'])->first();
        $nivelDisplay = $perfil ? $perfil->getNivelDisplay() : 'Usuário sem vínculo';

        Response::success([
            'usuario' => $this->serializeUsuario($user, $perfil),
            'nivel' => $nivel,
            'nivel_display' => $nivelDisplay,
            'modulos' => $modulos,
            'estatisticas' => $estatisticas,
        ])->send();
    }

    /**
     * Serializa o usuário (GetUsuarioSerializer)
     */
    private function serializeUsuario($user, $perfil)
    {
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
            'id' => $user->attributes['id'],
            'nome' => $user->attributes['nome'],
            'email' => $user->attributes['email'],
            'telefone' => $user->attributes['telefone'],
            'perfil_admin' => $perfilData,
        ];
    }
}
