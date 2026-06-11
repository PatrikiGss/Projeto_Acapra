<?php

namespace adocao;

use core\Model;

/**
 * Modelo de imagem de animal
 * Equivalente ao modelo AnimalImagem do Django
 */
class AnimalImagem extends Model
{
    protected $table = 'animais_imagens';
    protected $fillable = ['animal_id', 'imagem', 'ordem', 'created_at'];

    /**
     * Retorna o animal associado
     */
    public function animal()
    {
        return Animal::find($this->attributes['animal_id']);
    }

    /**
     * Cria timestamps automaticamente
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
            $imagemPath = MEDIA_ROOT . '/' . $this->attributes['imagem'];
            if (file_exists($imagemPath)) {
                unlink($imagemPath);
            }
        }

        return parent::delete();
    }

    /**
     * Retorna a representação em string
     */
    public function __toString()
    {
        $animal = $this->animal();
        return 'Foto de ' . ($animal ? $animal->attributes['nome_animal'] : 'Animal desconhecido');
    }
}
