<?php

namespace meta_integration;

use core\Model;

/**
 * Modelo de estado OAuth da Meta
 * Equivalente ao modelo MetaOAuthState do Django
 */
class MetaOAuthState extends Model
{
    protected $table = 'meta_oauth_states';
    protected $fillable = ['state', 'usuario_id', 'user_access_token', 'created_at'];

    /**
     * Gera um UUID v4 (equivalente ao default=uuid.uuid4 do Django)
     */
    public static function gerarState()
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
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
     * Retorna a representação em string
     */
    public function __toString()
    {
        return 'OAuthState(' . $this->attributes['usuario_id'] . ', ' . $this->attributes['state'] . ')';
    }
}
