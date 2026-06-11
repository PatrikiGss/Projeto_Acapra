<?php

namespace transparencia;

use core\Model;

/**
 * Modelo de movimento financeiro
 * Equivalente ao modelo Movimento do Django
 */
class Movimento extends Model
{
    protected $table = 'transparencia_movimentos';
    protected $fillable = ['categoria_id', 'descricao', 'valor', 'data', 'comprovante', 'ativo', 'created_at', 'updated_at'];

    /**
     * Retorna a categoria associada
     */
    public function categoria()
    {
        return Categoria::find($this->attributes['categoria_id']);
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
     * Deleta o comprovante se existir
     */
    public function delete()
    {
        if (!empty($this->attributes['comprovante'])) {
            $path = MEDIA_ROOT . '/' . $this->attributes['comprovante'];
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
        return $this->attributes['descricao'] . ' (R$ ' . $this->attributes['valor'] . ')';
    }
}
