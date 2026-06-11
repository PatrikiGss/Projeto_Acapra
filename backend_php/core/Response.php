<?php

namespace core;

/**
 * Classe para gerenciar respostas HTTP
 * Equivalente ao Response do Django REST Framework
 */
class Response
{
    private $data = [];
    private $status = 200;
    private $headers = [];

    public function __construct($data = [], $status = 200, $headers = [])
    {
        $this->data = $data;
        $this->status = $status;
        $this->headers = array_merge([
            'Content-Type' => 'application/json',
            'X-Content-Type-Options' => 'nosniff',
        ], $headers);
    }

    /**
     * Retorna uma resposta de sucesso
     */
    public static function success($data = [], $status = 200)
    {
        return new self($data, $status);
    }

    /**
     * Retorna uma resposta de erro
     */
    public static function error($message, $status = 400, $data = [])
    {
        $response = array_merge(['detail' => $message], $data);
        return new self($response, $status);
    }

    /**
     * Retorna uma resposta não autenticada
     */
    public static function unauthorized($message = 'Não autenticado')
    {
        return self::error($message, 401);
    }

    /**
     * Retorna uma resposta proibida
     */
    public static function forbidden($message = 'Acesso proibido')
    {
        return self::error($message, 403);
    }

    /**
     * Retorna uma resposta não encontrada
     */
    public static function notFound($message = 'Não encontrado')
    {
        return self::error($message, 404);
    }

    /**
     * Retorna uma resposta de erro de validação
     */
    public static function validation($errors)
    {
        return self::error('Erro de validação', 400, ['errors' => $errors]);
    }

    /**
     * Retorna uma resposta paginada
     */
    public static function paginated($data, $total, $page, $perPage)
    {
        $pages = ceil($total / $perPage);
        $response = [
            'results' => $data,
            'count' => $total,
            'next' => $page < $pages ? $page + 1 : null,
            'previous' => $page > 1 ? $page - 1 : null,
            'page_size' => $perPage,
            'total_pages' => $pages,
        ];
        return self::success($response);
    }

    /**
     * Define o status HTTP
     */
    public function setStatus($status)
    {
        $this->status = $status;
        return $this;
    }

    /**
     * Adiciona um header
     */
    public function addHeader($name, $value)
    {
        $this->headers[$name] = $value;
        return $this;
    }

    /**
     * Envia a resposta
     */
    public function send()
    {
        http_response_code($this->status);

        foreach ($this->headers as $name => $value) {
            header("{$name}: {$value}");
        }

        echo json_encode($this->data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    /**
     * Retorna os dados como array
     */
    public function toArray()
    {
        return $this->data;
    }

    /**
     * Retorna o status
     */
    public function getStatus()
    {
        return $this->status;
    }
}
