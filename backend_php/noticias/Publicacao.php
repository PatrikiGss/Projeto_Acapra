<?php

namespace noticias;

use core\Model;

/**
 * Modelo de publicações/notícias
 * Equivalente ao modelo Publicacao do Django
 */
class Publicacao extends Model
{
    protected $table = 'publicacoes';
    protected $fillable = ['categoria', 'titulo', 'resumo', 'foto', 'texto', 'ativo', 'created_at', 'updated_at'];

    const CATEGORIA_NOTICIAS = 'noticias';
    const CATEGORIA_RESGATES = 'resgates';
    const CATEGORIA_CAMPANHAS = 'campanhas';
    const CATEGORIA_DESAPARECIDOS = 'desaparecidos';

    const CATEGORIAS = [
        self::CATEGORIA_NOTICIAS => 'Notícias',
        self::CATEGORIA_RESGATES => 'Resgates',
        self::CATEGORIA_CAMPANHAS => 'Campanhas',
        self::CATEGORIA_DESAPARECIDOS => 'Desaparecidos',
    ];

    /**
     * Obtém publicações ativas
     */
    public static function getAtivas()
    {
        return self::where('ativo', '=', 1)->orderBy('created_at', 'DESC')->get();
    }

    /**
     * Filtra por categoria
     */
    public static function porCategoria($categoria)
    {
        return self::where('categoria', '=', $categoria)->orderBy('created_at', 'DESC');
    }

    /**
     * Retorna o display da categoria
     */
    public function getCategoriaDisplay()
    {
        return self::CATEGORIAS[$this->attributes['categoria']] ?? 'Desconhecida';
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
     * Deleta foto se existir
     */
    public function delete()
    {
        if (!empty($this->attributes['foto'])) {
            $fotoPath = MEDIA_ROOT . '/' . $this->attributes['foto'];
            if (file_exists($fotoPath)) {
                unlink($fotoPath);
            }
        }

        return parent::delete();
    }
}
