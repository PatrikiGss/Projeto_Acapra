<?php

namespace doacoes;

use core\Model;

/**
 * Modelo de dados PIX
 * Equivalente ao modelo DadosPix do Django
 */
class DadosPix extends Model
{
    protected $table = 'dados_pix';
    protected $fillable = ['chave_pix', 'qr_code', 'descricao', 'banco', 'agencia', 'conta', 'tipo_conta', 'cnpj', 'favorecido', 'ativo', 'created_at', 'updated_at'];

    /**
     * Obtém apenas dados PIX ativos
     */
    public static function getAtivos()
    {
        return self::where('ativo', '=', 1)->get();
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
     * Deleta QR Code se existir
     */
    public function delete()
    {
        if (!empty($this->attributes['qr_code'])) {
            $qrPath = MEDIA_ROOT . '/' . $this->attributes['qr_code'];
            if (file_exists($qrPath)) {
                unlink($qrPath);
            }
        }

        return parent::delete();
    }

    /**
     * Retorna a representação em string
     */
    public function __toString()
    {
        return 'Pix: ' . $this->attributes['chave_pix'];
    }
}
