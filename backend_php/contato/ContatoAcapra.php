<?php

namespace contato;

use core\Model;

/**
 * Modelo de contatos da Acapra
 * Equivalente ao modelo ContatoAcapra do Django
 */
class ContatoAcapra extends Model
{
    protected $table = 'contatos_acapra';
    protected $fillable = ['whatsapp_castracoes', 'whatsapp_doacoes', 'whatsapp_financeiro', 'instagram', 'facebook', 'email'];

    /**
     * Obtém ou cria a instância singleton
     */
    public static function getInstance()
    {
        $instance = self::where('id', '=', 1)->first();

        if (!$instance) {
            $instance = new self(['id' => 1]);
            $instance->save();
        }

        return $instance;
    }

    /**
     * Salva mantendo ID = 1
     */
    public function save()
    {
        $this->attributes['id'] = 1;
        return parent::save();
    }
}
