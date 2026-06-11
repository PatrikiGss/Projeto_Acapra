<?php

namespace meta_integration;

use adocao\Animal;

/**
 * Serviços de integração com a Meta (Facebook/Instagram)
 * Equivalente a meta_integration/services.py do Django
 */
class Services
{
    const GRAPH_API_VERSION = 'v23.0';
    const GRAPH_API_BASE = 'https://graph.facebook.com/v23.0';

    /**
     * Monta a mensagem de publicação para um animal
     */
    public static function buildPostMessage($animal)
    {
        $especieMap = ['cachorro' => 'Cachorro', 'gato' => 'Gato', 'outros' => 'Animal'];
        $sexoMap = ['macho' => 'Macho', 'femea' => 'Fêmea'];

        $especie = $especieMap[$animal->attributes['especie']] ?? 'Animal';
        $sexo = $sexoMap[$animal->attributes['sexo']] ?? '';

        $lines = [
            "{$animal->attributes['nome_animal']} está disponível para adoção!",
            "",
            $especie,
            $sexo,
            "Contato do dono: {$animal->attributes['telefone']}",
        ];

        if (!empty($animal->attributes['descricao'])) {
            $lines[] = "";
            $lines[] = $animal->attributes['descricao'];
        }

        $lines[] = "";
        $lines[] = "Entre em contato para saber mais sobre a adoção!";

        return implode("\n", $lines);
    }

    /**
     * Verifica se uma URL é local
     */
    private static function isLocalUrl($url)
    {
        return preg_match(
            '#^https?://(localhost|127\.\d+\.\d+\.\d+|\[::1\]|0\.0\.0\.0)(:\d+)?#i',
            $url
        );
    }

    /**
     * Retorna a URL pública absoluta da foto do animal
     */
    public static function getPhotoAbsoluteUrl($animal)
    {
        if (empty($animal->attributes['foto'])) {
            return null;
        }

        $siteUrl = rtrim(SITE_URL, '/');
        if (!$siteUrl || self::isLocalUrl($siteUrl)) {
            return null;
        }

        return "{$siteUrl}/media/{$animal->attributes['foto']}";
    }

    /**
     * Retorna o caminho local do arquivo da foto, se existir
     */
    private static function localFilePath($animal)
    {
        if (empty($animal->attributes['foto'])) {
            return null;
        }

        $path = MEDIA_ROOT . '/' . $animal->attributes['foto'];
        return file_exists($path) ? $path : null;
    }

    /**
     * Determina o MIME type a partir da extensão
     */
    private static function mimeType($filePath)
    {
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $map = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'gif' => 'image/gif'];
        return $map[$ext] ?? 'image/jpeg';
    }

    /**
     * Executa uma requisição POST para a Graph API
     */
    public static function httpPost($url, $data, $timeout = 15)
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $data,
            CURLOPT_TIMEOUT => $timeout,
        ]);

        $body = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($body === false) {
            throw new \Exception("Erro de conexão com a Graph API: {$error}");
        }

        if ($httpCode >= 400) {
            throw new \Exception("Graph API retornou {$httpCode}: {$body}");
        }

        return json_decode($body, true);
    }

    /**
     * Executa uma requisição GET para a Graph API
     */
    public static function httpGet($url, $params, $timeout = 15)
    {
        $fullUrl = $url . '?' . http_build_query($params);

        $ch = curl_init($fullUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $timeout,
        ]);

        $body = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($body === false) {
            throw new \Exception("Erro de conexão com a Graph API: {$error}");
        }

        if ($httpCode >= 400) {
            throw new \Exception("Graph API retornou {$httpCode}: {$body}");
        }

        return json_decode($body, true);
    }

    /**
     * Publica no Facebook
     */
    public static function postToFacebook($connection, $animal)
    {
        $message = self::buildPostMessage($animal);
        $localFile = self::localFilePath($animal);

        if ($localFile) {
            $mime = self::mimeType($localFile);
            $filename = basename($localFile);

            // Upload binário direto com MIME type explícito
            return self::httpPost(
                self::GRAPH_API_BASE . "/{$connection->attributes['page_id']}/photos",
                [
                    'message' => $message,
                    'access_token' => $connection->attributes['page_access_token'],
                    'source' => new \CURLFile($localFile, $mime, $filename),
                ],
                60
            );
        }

        if (!empty($animal->attributes['foto'])) {
            // Fallback: URL pública (produção com armazenamento externo)
            $photoUrl = self::getPhotoAbsoluteUrl($animal);
            if ($photoUrl) {
                return self::httpPost(
                    self::GRAPH_API_BASE . "/{$connection->attributes['page_id']}/photos",
                    [
                        'url' => $photoUrl,
                        'message' => $message,
                        'access_token' => $connection->attributes['page_access_token'],
                    ],
                    30
                );
            }

            return self::httpPost(
                self::GRAPH_API_BASE . "/{$connection->attributes['page_id']}/feed",
                [
                    'message' => $message,
                    'access_token' => $connection->attributes['page_access_token'],
                ]
            );
        }

        // Sem foto: post somente texto
        return self::httpPost(
            self::GRAPH_API_BASE . "/{$connection->attributes['page_id']}/feed",
            [
                'message' => $message,
                'access_token' => $connection->attributes['page_access_token'],
            ]
        );
    }

    /**
     * Publica no Instagram
     */
    public static function postToInstagram($connection, $animal)
    {
        if (empty($connection->attributes['instagram_id'])) {
            error_log("Instagram não configurado na conexão da página '{$connection->attributes['page_name']}'.");
            return null;
        }

        $photoUrl = self::getPhotoAbsoluteUrl($animal);
        if (!$photoUrl) {
            error_log("Pulando Instagram ({$animal->attributes['nome_animal']}): SITE_URL não configurado ou é local.");
            return null;
        }

        $caption = self::buildPostMessage($animal);

        // Step 1: Create media container
        $container = self::httpPost(
            self::GRAPH_API_BASE . "/{$connection->attributes['instagram_id']}/media",
            [
                'image_url' => $photoUrl,
                'caption' => $caption,
                'access_token' => $connection->attributes['page_access_token'],
            ]
        );

        $creationId = $container['id'];

        // Step 2: Publish container
        return self::httpPost(
            self::GRAPH_API_BASE . "/{$connection->attributes['instagram_id']}/media_publish",
            [
                'creation_id' => $creationId,
                'access_token' => $connection->attributes['page_access_token'],
            ]
        );
    }

    /**
     * Publica automaticamente um animal em todas as conexões ativas
     */
    public static function autoPostAnimal($animal)
    {
        $connections = MetaConnection::getAtivas();
        if (empty($connections)) {
            return;
        }

        foreach ($connections as $connection) {
            try {
                self::postToFacebook($connection, $animal);
                error_log("Publicado no Facebook: {$animal->attributes['nome_animal']}");
            } catch (\Exception $exc) {
                error_log("Falha ao publicar no Facebook ({$animal->attributes['nome_animal']}): " . $exc->getMessage());
            }

            try {
                self::postToInstagram($connection, $animal);
                error_log("Publicado no Instagram: {$animal->attributes['nome_animal']}");
            } catch (\Exception $exc) {
                error_log("Falha ao publicar no Instagram ({$animal->attributes['nome_animal']}): " . $exc->getMessage());
            }
        }
    }
}
