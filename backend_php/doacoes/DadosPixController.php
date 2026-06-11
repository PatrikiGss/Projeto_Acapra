<?php

namespace doacoes;

use core\Controller;
use core\Response;
use core\Validator;

/**
 * Controller de dados Pix
 * Equivalente aos views de doacoes do Django
 */
class DadosPixController extends Controller
{
    /**
     * Lista dados Pix
     * GET /api/doacoes/pix/
     */
    public function get_pix()
    {
        $query = DadosPix::where('id', '>', 0);

        // Públicamente mostra apenas ativos
        if (!$this->getUser()) {
            $query = $query->where('ativo', '=', 1);
        }

        $dados = $query->orderBy('id', 'DESC')->get();

        $data = [];
        foreach ($dados as $pix) {
            $data[] = $this->serializeDadosPix($pix);
        }

        Response::success($data)->send();
    }

    /**
     * Cria um novo dado Pix
     * POST /api/doacoes/pix/
     */
    public function post_pix()
    {
        $this->requireModuleAccess('doacoes');

        $data = $this->getAllParameters();

        $validator = new Validator($data, [
            'chave_pix' => 'required|max:255',
        ]);

        if (!$validator->validate()) {
            Response::validation($validator->errors())->send();
        }

        $pix = new DadosPix([
            'chave_pix' => $data['chave_pix'],
            'descricao' => $data['descricao'] ?? null,
            'banco' => $data['banco'] ?? null,
            'agencia' => $data['agencia'] ?? null,
            'conta' => $data['conta'] ?? null,
            'tipo_conta' => $data['tipo_conta'] ?? null,
            'cnpj' => $data['cnpj'] ?? null,
            'favorecido' => $data['favorecido'] ?? null,
            'ativo' => isset($data['ativo']) ? $this->toBool($data['ativo']) : true,
        ]);

        $removerQr = $this->toBool($data['remover_qr_code'] ?? false);

        if ($this->hasFileInput('qr_code') && !$removerQr) {
            $pix->attributes['qr_code'] = $this->storeFile('qr_code', 'qr_codes');
        }

        $pix->save();

        Response::success($this->serializeDadosPix($pix), 201)->send();
    }

    /**
     * Retorna detalhes de um dado Pix
     * GET /api/doacoes/pix/<id>/
     */
    public function get_pix_detail()
    {
        $pix = $this->getDadosPixOr404($this->getUser() ? true : false);
        Response::success($this->serializeDadosPix($pix))->send();
    }

    /**
     * Atualiza um dado Pix
     * PATCH /api/doacoes/pix/<id>/
     */
    public function patch_pix_detail()
    {
        $this->requireModuleAccess('doacoes');

        $pix = $this->getDadosPixOr404(true);
        $data = $this->getAllParameters();

        $campos = ['chave_pix', 'descricao', 'banco', 'agencia', 'conta', 'tipo_conta', 'cnpj', 'favorecido'];
        foreach ($campos as $campo) {
            if (array_key_exists($campo, $data)) {
                $pix->attributes[$campo] = $data[$campo];
            }
        }

        if (isset($data['ativo'])) {
            $pix->attributes['ativo'] = $this->toBool($data['ativo']);
        }

        $removerQr = $this->toBool($data['remover_qr_code'] ?? false);

        // Novo QR code enviado
        if ($this->hasFileInput('qr_code')) {
            $this->removeMediaFile($pix->attributes['qr_code']);
            $pix->attributes['qr_code'] = $this->storeFile('qr_code', 'qr_codes');
        } elseif ($removerQr && !empty($pix->attributes['qr_code'])) {
            // Remoção solicitada sem novo arquivo
            $this->removeMediaFile($pix->attributes['qr_code']);
            $pix->attributes['qr_code'] = null;
        }

        $pix->save();

        Response::success($this->serializeDadosPix($pix))->send();
    }

    /**
     * Remove um dado Pix
     * DELETE /api/doacoes/pix/<id>/
     */
    public function delete_pix_detail()
    {
        $this->requireModuleAccess('doacoes');

        $id = $this->params[0] ?? null;
        $pix = $this->getDadosPixOr404(true);
        $pix->delete();

        Response::success(['detail' => "Dado Pix {$id} removido com sucesso."], 204)->send();
    }

    /**
     * Busca o dado Pix pelo ID ou retorna 404
     */
    private function getDadosPixOr404($includeInactive = false)
    {
        $id = $this->params[0] ?? null;

        if (!$id) {
            Response::notFound()->send();
        }

        $pix = DadosPix::find($id);

        if (!$pix) {
            Response::notFound()->send();
        }

        if (!$includeInactive && !$pix->attributes['ativo']) {
            Response::notFound()->send();
        }

        return $pix;
    }

    /**
     * Serializa um dado Pix para resposta JSON
     * Equivalente ao GetDadosPixSerializer do Django
     */
    private function serializeDadosPix($pix)
    {
        return [
            'id' => $pix->attributes['id'],
            'chave_pix' => $pix->attributes['chave_pix'],
            'qr_code' => $pix->attributes['qr_code'] ? MEDIA_URL . $pix->attributes['qr_code'] : null,
            'descricao' => $pix->attributes['descricao'],
            'banco' => $pix->attributes['banco'],
            'agencia' => $pix->attributes['agencia'],
            'conta' => $pix->attributes['conta'],
            'tipo_conta' => $pix->attributes['tipo_conta'],
            'cnpj' => $pix->attributes['cnpj'],
            'favorecido' => $pix->attributes['favorecido'],
        ];
    }

}
