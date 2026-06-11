<?php

namespace contato;

use core\Controller;
use core\Response;
use core\Validator;

/**
 * Controller de contato
 * Equivalente aos views de contato do Django
 */
class ContatoController extends Controller
{
    /**
     * Obtém dados de contato
     * GET /api/contato/
     */
    public function get_contato()
    {
        $contato = ContatoAcapra::getInstance();

        $response = [
            'whatsapp_castracoes' => $contato->attributes['whatsapp_castracoes'],
            'whatsapp_doacoes' => $contato->attributes['whatsapp_doacoes'],
            'whatsapp_financeiro' => $contato->attributes['whatsapp_financeiro'],
            'instagram' => $contato->attributes['instagram'],
            'facebook' => $contato->attributes['facebook'],
            'email' => $contato->attributes['email'],
        ];

        Response::success($response)->send();
    }

    /**
     * Atualiza dados de contato
     * PATCH /api/contato/
     */
    public function patch_contato()
    {
        $this->requireMaster();

        $data = $this->getAllParameters();
        $contato = ContatoAcapra::getInstance();

        if (!empty($data['whatsapp_castracoes'])) {
            $contato->attributes['whatsapp_castracoes'] = $data['whatsapp_castracoes'];
        }

        if (!empty($data['whatsapp_doacoes'])) {
            $contato->attributes['whatsapp_doacoes'] = $data['whatsapp_doacoes'];
        }

        if (!empty($data['whatsapp_financeiro'])) {
            $contato->attributes['whatsapp_financeiro'] = $data['whatsapp_financeiro'];
        }

        if (!empty($data['instagram'])) {
            $contato->attributes['instagram'] = $data['instagram'];
        }

        if (!empty($data['facebook'])) {
            $contato->attributes['facebook'] = $data['facebook'];
        }

        if (!empty($data['email'])) {
            $contato->attributes['email'] = $data['email'];
        }

        $contato->save();

        $response = [
            'whatsapp_castracoes' => $contato->attributes['whatsapp_castracoes'],
            'whatsapp_doacoes' => $contato->attributes['whatsapp_doacoes'],
            'whatsapp_financeiro' => $contato->attributes['whatsapp_financeiro'],
            'instagram' => $contato->attributes['instagram'],
            'facebook' => $contato->attributes['facebook'],
            'email' => $contato->attributes['email'],
        ];

        Response::success($response)->send();
    }
}
