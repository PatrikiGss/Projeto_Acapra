<?php

namespace lares;

use core\Model;

/**
 * Modelo de lar voluntário
 * Equivalente ao modelo LarVoluntario do Django
 */
class LarVoluntario extends Model
{
    protected $table = 'lares_voluntarios';
    protected $fillable = [
        'nome_responsavel', 'telefone', 'email', 'cidade',
        'tipos_animais', 'capacidade', 'descricao', 'ativo',
        'created_at', 'updated_at',
    ];

    public function save()
    {
        if (!isset($this->attributes['id'])) {
            $this->attributes['created_at'] = date('Y-m-d H:i:s');
            if (!isset($this->attributes['ativo'])) {
                $this->attributes['ativo'] = 1;
            }
        }
        $this->attributes['updated_at'] = date('Y-m-d H:i:s');

        return parent::save();
    }

    public function __toString()
    {
        return $this->attributes['nome_responsavel'] . ' — ' . $this->attributes['cidade'];
    }
}
