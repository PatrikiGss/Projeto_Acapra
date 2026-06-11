<?php

namespace transparencia;

use core\Model;

/**
 * Modelo de categoria de transparência
 * Equivalente ao modelo Categoria do Django
 */
class Categoria extends Model
{
    protected $table = 'transparencia_categorias';
    protected $fillable = ['nome', 'tipo', 'ativo', 'created_at'];

    const TIPO_ENTRADA = 'entrada';
    const TIPO_SAIDA = 'saida';

    const TIPOS = [
        self::TIPO_ENTRADA => 'Entrada',
        self::TIPO_SAIDA => 'Saída',
    ];

    /**
     * Retorna o display do tipo
     */
    public function getTipoDisplay()
    {
        return self::TIPOS[$this->attributes['tipo']] ?? 'Desconhecido';
    }

    /**
     * Retorna os movimentos da categoria
     */
    public function movimentos()
    {
        return Movimento::where('categoria_id', '=', $this->attributes['id'])
            ->orderBy('data', 'DESC');
    }

    /**
     * Cria timestamp automaticamente
     */
    public function save()
    {
        if (!isset($this->attributes['id'])) {
            $this->attributes['created_at'] = date('Y-m-d H:i:s');
        }

        return parent::save();
    }

    /**
     * Retorna a representação em string
     */
    public function __toString()
    {
        return $this->getTipoDisplay() . ' — ' . $this->attributes['nome'];
    }
}
