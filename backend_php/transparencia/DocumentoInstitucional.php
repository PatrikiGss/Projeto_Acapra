<?php

namespace transparencia;

use core\Model;

/**
 * Modelo de documento institucional
 * Equivalente ao modelo DocumentoInstitucional do Django
 */
class DocumentoInstitucional extends Model
{
    protected $table = 'transparencia_documentos';
    protected $fillable = ['nome', 'descricao', 'arquivo', 'ativo', 'ordem', 'created_at', 'updated_at'];

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
     * Deleta o arquivo se existir
     */
    public function delete()
    {
        if (!empty($this->attributes['arquivo'])) {
            $path = MEDIA_ROOT . '/' . $this->attributes['arquivo'];
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
        return $this->attributes['nome'];
    }
}
