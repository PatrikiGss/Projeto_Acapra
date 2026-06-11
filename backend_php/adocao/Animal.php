<?php

namespace adocao;

use core\Model;

/**
 * Modelo de animal para adoção
 * Equivalente ao modelo Animal do Django
 */
class Animal extends Model
{
    protected $table = 'animais';
    protected $fillable = ['nome_animal', 'nome_doador', 'telefone', 'especie', 'sexo', 'foto', 'descricao', 'disponivel'];

    const ESPECIE_CACHORRO = 'cachorro';
    const ESPECIE_GATO = 'gato';
    const ESPECIE_OUTROS = 'outros';

    const ESPECIES = [
        self::ESPECIE_CACHORRO => 'Cachorro',
        self::ESPECIE_GATO => 'Gato',
        self::ESPECIE_OUTROS => 'Outros',
    ];

    const SEXO_MACHO = 'macho';
    const SEXO_FEMEA = 'femea';

    const SEXOS = [
        self::SEXO_MACHO => 'Macho',
        self::SEXO_FEMEA => 'Fêmea',
    ];

    /**
     * Retorna as imagens do animal
     */
    public function imagens()
    {
        return AnimalImagem::where('animal_id', '=', $this->attributes['id'])->orderBy('ordem', 'ASC')->get();
    }

    /**
     * Retorna o display da espécie
     */
    public function getEspecieDisplay()
    {
        return self::ESPECIES[$this->attributes['especie']] ?? 'Desconhecido';
    }

    /**
     * Retorna o display do sexo
     */
    public function getSexoDisplay()
    {
        return self::SEXOS[$this->attributes['sexo']] ?? 'Desconhecido';
    }

    /**
     * Deleta a foto se existir
     */
    public function delete()
    {
        if (!empty($this->attributes['foto'])) {
            $fotoPath = MEDIA_ROOT . '/' . $this->attributes['foto'];
            if (file_exists($fotoPath)) {
                unlink($fotoPath);
            }
        }

        // Deleta as imagens relacionadas
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
        return $this->attributes['nome_doador'] . ' - ' . $this->getEspecieDisplay();
    }
}
