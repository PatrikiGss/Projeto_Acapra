<?php

namespace vendas;

use core\Model;

/**
 * Modelo de produto de vestuário
 * Equivalente ao modelo Produto do Django
 */
class Produto extends Model
{
    protected $table = 'produtos';
    protected $fillable = ['nome', 'descricao', 'tipo', 'preco', 'foto', 'estoque', 'ativo', 'created_at', 'updated_at'];

    const TIPO_HUMANO = 'humano';
    const TIPO_PET = 'pet';

    const TIPOS = [
        self::TIPO_HUMANO => 'Para pessoas',
        self::TIPO_PET => 'Para pets',
    ];

    /**
     * Retorna o display do tipo
     */
    public function getTipoDisplay()
    {
        return self::TIPOS[$this->attributes['tipo']] ?? 'Desconhecido';
    }

    /**
     * Retorna as imagens do produto
     */
    public function imagens()
    {
        return ProdutoImagem::where('produto_id', '=', $this->attributes['id'])
            ->orderBy('ordem', 'ASC')->get();
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
     * Deleta a foto e as imagens relacionadas
     */
    public function delete()
    {
        if (!empty($this->attributes['foto'])) {
            $fotoPath = MEDIA_ROOT . '/' . $this->attributes['foto'];
            if (file_exists($fotoPath)) {
                unlink($fotoPath);
            }
        }

        foreach ($this->imagens() as $imagem) {
            $imagem->delete();
        }

        return parent::delete();
    }

    /**
     * Retorna a representação em string
     */
    public function __toString()
    {
        return $this->attributes['nome'] . ' (' . $this->getTipoDisplay() . ')';
    }
}
