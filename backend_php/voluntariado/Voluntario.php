<?php

namespace voluntariado;

use core\Model;

/**
 * Modelo de voluntário
 * Equivalente ao modelo Voluntario do Django
 */
class Voluntario extends Model
{
    protected $table = 'voluntarios';
    protected $fillable = ['nome', 'telefone', 'idade', 'motivo', 'email', 'ativo', 'created_at', 'updated_at'];

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
     * Retorna a representação em string
     */
    public function __toString()
    {
        return $this->attributes['nome'] . ' - ' . $this->attributes['idade'] . ' anos';
    }
}
