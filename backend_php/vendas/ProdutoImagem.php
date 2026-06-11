<?php

namespace vendas;

use core\Model;

/**
 * Modelo de imagem de produto
 * Equivalente ao modelo ProdutoImagem do Django
 */
class ProdutoImagem extends Model
{
    protected $table = 'produtos_imagens';
    protected $fillable = ['produto_id', 'imagem', 'ordem', 'created_at'];

    /**
     * Retorna o produto associado
     */
    public function produto()
    {
        return Produto::find($this->attributes['produto_id']);
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
     * Deleta a imagem se existir
     */
    public function delete()
    {
        if (!empty($this->attributes['imagem'])) {
            $path = MEDIA_ROOT . '/' . $this->attributes['imagem'];
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
        $produto = $this->produto();
        return 'Foto de ' . ($produto ? $produto->attributes['nome'] : 'Produto desconhecido');
    }
}
