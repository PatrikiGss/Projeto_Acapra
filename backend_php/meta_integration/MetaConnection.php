<?php

namespace meta_integration;

use core\Model;

/**
 * Modelo de conexão Meta (Facebook/Instagram)
 * Equivalente ao modelo MetaConnection do Django
 */
class MetaConnection extends Model
{
    protected $table = 'meta_connections';
    protected $fillable = ['usuario_id', 'page_id', 'page_name', 'page_access_token', 'instagram_id', 'is_active', 'created_at', 'updated_at'];

    /**
     * Retorna apenas conexões ativas
     */
    public static function getAtivas()
    {
        return self::where('is_active', '=', 1)->get();
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
     * Retorna a representação em string
     */
    public function __toString()
    {
        return $this->attributes['page_name'] . ' (' . $this->attributes['usuario_id'] . ')';
    }
}
