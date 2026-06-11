<?php

namespace core;

/**
 * Gerenciador de JWT
 * Equivalente ao rest_framework_simplejwt do Django
 *
 * Implementação manual de JWT usando HS256
 */
class JWT
{
    /**
     * Cria um token JWT
     */
    public static function createToken($payload, $expiresIn = null)
    {
        if ($expiresIn === null) {
            $expiresIn = JWT_ACCESS_LIFETIME;
        }

        $payload['iat'] = time();
        $payload['exp'] = time() + $expiresIn;

        $header = [
            'alg' => JWT_ALGORITHM,
            'typ' => 'JWT'
        ];

        $headerEncoded = self::base64UrlEncode(json_encode($header));
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));
        $signature = self::base64UrlEncode(self::hash("{$headerEncoded}.{$payloadEncoded}"));

        return "{$headerEncoded}.{$payloadEncoded}.{$signature}";
    }

    /**
     * Valida e decodifica um token JWT
     */
    public static function verifyToken($token)
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            return null;
        }

        list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;

        $expectedSignature = self::base64UrlEncode(self::hash("{$headerEncoded}.{$payloadEncoded}"));

        if (!hash_equals($expectedSignature, $signatureEncoded)) {
            return null;
        }

        $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);

        if (!$payload) {
            return null;
        }

        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }

    /**
     * Decodifica um token JWT sem validar a assinatura (use com cuidado)
     */
    public static function decodeToken($token)
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            return null;
        }

        list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;

        $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);

        return $payload;
    }

    /**
     * Cria um token de acesso
     */
    public static function createAccessToken($userId, $userData = [])
    {
        $payload = array_merge([
            'user_id' => $userId,
            'type' => 'access'
        ], $userData);

        return self::createToken($payload, JWT_ACCESS_LIFETIME);
    }

    /**
     * Cria um token de atualização
     */
    public static function createRefreshToken($userId)
    {
        $payload = [
            'user_id' => $userId,
            'type' => 'refresh'
        ];

        return self::createToken($payload, JWT_REFRESH_LIFETIME);
    }

    /**
     * Cria uma tupla de tokens (access + refresh)
     */
    public static function createTokenPair($userId, $userData = [])
    {
        return [
            'access' => self::createAccessToken($userId, $userData),
            'refresh' => self::createRefreshToken($userId)
        ];
    }

    /**
     * Hash HMAC SHA256
     */
    private static function hash($data)
    {
        return hash_hmac('sha256', $data, JWT_SIGNING_KEY, true);
    }

    /**
     * Codificação Base64 URL-safe
     */
    private static function base64UrlEncode($data)
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }

    /**
     * Decodificação Base64 URL-safe
     */
    private static function base64UrlDecode($data)
    {
        $padding = 4 - (strlen($data) % 4);
        if ($padding !== 4) {
            $data .= str_repeat('=', $padding);
        }

        return base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
    }
}
