<?php

namespace denuncias;

use core\Model;

/**
 * Modelo de denúncia
 * Equivalente ao modelo Denuncia do Django
 */
class Denuncia extends Model
{
    protected $table = 'denuncias';
    protected $fillable = ['titulo', 'descricao', 'gravidade', 'nome', 'telefone', 'foto', 'status', 'created_at', 'updated_at'];

    const GRAVIDADE_BAIXO = 'baixo';
    const GRAVIDADE_MEDIO = 'medio';
    const GRAVIDADE_ALTA = 'alta';
    const GRAVIDADE_URGENTE = 'urgente';

    const GRAVIDADES = [
        self::GRAVIDADE_BAIXO => 'Baixo',
        self::GRAVIDADE_MEDIO => 'Médio',
        self::GRAVIDADE_ALTA => 'Alta',
        self::GRAVIDADE_URGENTE => 'Urgente',
    ];

    const STATUS_PENDENTE = 'pendente';
    const STATUS_EM_ANALISE = 'em_analise';
    const STATUS_RESOLVIDA = 'resolvida';

    const STATUS = [
        self::STATUS_PENDENTE => 'Pendente',
        self::STATUS_EM_ANALISE => 'Em análise',
        self::STATUS_RESOLVIDA => 'Resolvida',
    ];

    /**
     * Retorna o display da gravidade
     */
    public function getGravidadeDisplay()
    {
        return self::GRAVIDADES[$this->attributes['gravidade']] ?? 'Desconhecido';
    }

    /**
     * Retorna o display do status
     */
    public function getStatusDisplay()
    {
        return self::STATUS[$this->attributes['status']] ?? 'Desconhecido';
    }

    /**
     * Cria timestamps automaticamente
     */
    public function save()
    {
        if (!isset($this->attributes['id'])) {
            $this->attributes['created_at'] = date('Y-m-d H:i:s');
        }
        $this->attributes['updated_at'] = date('Y-m-d H:i:s');

        return parent::save();
    }

    /**
     * Deleta a foto se existir
     */
    public function delete()
    {
        if (!empty($this->attributes['foto'])) {
            $path = MEDIA_ROOT . '/' . $this->attributes['foto'];
            if (file_exists($path)) {
                unlink($path);
            }
        }

        return parent::delete();
    }

    /**
     * Retorna a representação em string
     */
    public function __toString()
    {
        return $this->attributes['titulo'] . ' (' . $this->getGravidadeDisplay() . ')';
    }
}
