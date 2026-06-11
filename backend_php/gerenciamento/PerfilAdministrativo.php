<?php

namespace gerenciamento;

use core\Model;

/**
 * Modelo de perfil administrativo
 * Equivalente ao modelo PerfilAdministrativo do Django
 */
class PerfilAdministrativo extends Model
{
    protected $table = 'perfis_administrativos';
    protected $fillable = ['usuario_id', 'nivel', 'cargo', 'setor', 'ativo', 'observacoes', 'data_promocao', 'promovido_por'];

    const NIVEL_USUARIO = 'usuario';
    const NIVEL_ADMIN = 'admin';
    const NIVEL_DOACOES = 'doacoes';
    const NIVEL_FINANCEIRO = 'financeiro';
    const NIVEL_MASTER = 'master';

    const NIVEIS = [
        self::NIVEL_USUARIO => 'Usuário sem vínculo',
        self::NIVEL_ADMIN => 'Administrador',
        self::NIVEL_DOACOES => 'Doações',
        self::NIVEL_FINANCEIRO => 'Financeiro',
        self::NIVEL_MASTER => 'Diretor Acapra',
    ];

    /**
     * Módulos por nível
     */
    const MODULOS_POR_NIVEL = [
        self::NIVEL_MASTER => [
            'doacoes', 'noticias', 'resgates', 'campanhas', 'adocao',
            'vendas', 'voluntariado', 'gerenciamento_usuarios', 'transparencia', 'denuncias'
        ],
        self::NIVEL_ADMIN => [
            'doacoes', 'noticias', 'resgates', 'campanhas', 'adocao',
            'vendas', 'voluntariado', 'transparencia', 'denuncias'
        ],
        self::NIVEL_USUARIO => [],
    ];

    /**
     * Retorna o usuário associado
     */
    public function usuario()
    {
        return Usuario::find($this->attributes['usuario_id']);
    }

    /**
     * Retorna o display do nível
     */
    public function getNivelDisplay()
    {
        return self::NIVEIS[$this->attributes['nivel']] ?? 'Desconhecido';
    }

    /**
     * Valida as permissões do usuário
     */
    public static function getNivelUsuario($user)
    {
        if (!$user || !isset($user->attributes['id'])) {
            return self::NIVEL_USUARIO;
        }

        $perfil = self::where('usuario_id', '=', $user->attributes['id'])->first();

        if (!$perfil || !$perfil->attributes['ativo']) {
            return self::NIVEL_USUARIO;
        }

        return $perfil->attributes['nivel'];
    }

    /**
     * Verifica se o usuário pode gerenciar um módulo
     */
    public static function usuarioPodeGerenciarModulo($user, $modulo)
    {
        $nivel = self::getNivelUsuario($user);
        $modulos = self::MODULOS_POR_NIVEL[$nivel] ?? [];
        return in_array($modulo, $modulos);
    }

    /**
     * Retorna os módulos do usuário
     */
    public static function getModulosUsuario($user)
    {
        $nivel = self::getNivelUsuario($user);
        return self::MODULOS_POR_NIVEL[$nivel] ?? [];
    }

    /**
     * Cria ou obtém o perfil de um usuário
     */
    public static function getOrCreateForUser($user)
    {
        $perfil = self::where('usuario_id', '=', $user->attributes['id'])->first();

        if (!$perfil) {
            $perfil = new self([
                'usuario_id' => $user->attributes['id'],
                'nivel' => self::NIVEL_USUARIO,
                'ativo' => true,
                'data_promocao' => date('Y-m-d H:i:s')
            ]);
            $perfil->save();
        }

        return $perfil;
    }
}
