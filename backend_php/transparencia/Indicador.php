<?php

namespace transparencia;

use core\Model;

/**
 * Modelo de indicador de impacto
 * Equivalente ao modelo Indicador do Django
 */
class Indicador extends Model
{
    protected $table = 'transparencia_indicadores';
    protected $fillable = ['chave', 'valor', 'updated_at'];

    const CHAVE_ANIMAIS = 'animais_resgatados';
    const CHAVE_CASTRACOES = 'castracoes';
    const CHAVE_ADOCOES = 'adocoes';

    const CHAVES = [
        self::CHAVE_ANIMAIS => 'Animais resgatados',
        self::CHAVE_CASTRACOES => 'Castrações realizadas',
        self::CHAVE_ADOCOES => 'Adoções bem-sucedidas',
    ];

    /**
     * Retorna o display da chave
     */
    public function getChaveDisplay()
    {
        return self::CHAVES[$this->attributes['chave']] ?? 'Desconhecido';
    }

    /**
     * Cria timestamp automaticamente
     */
    public function save()
    {
        $this->attributes['updated_at'] = date('Y-m-d H:i:s');

        return parent::save();
    }

    /**
     * Retorna a representação em string
     */
    public function __toString()
    {
        return $this->getChaveDisplay() . ': ' . $this->attributes['valor'];
    }
}
