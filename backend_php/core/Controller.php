<?php

namespace core;

/**
 * Classe base para controllers
 * Equivalente aos APIView do Django REST Framework
 */
abstract class Controller
{
    protected $request;
    protected $user = null;
    protected $method = '';
    protected $path = '';
    protected $params = [];

    public function __construct()
    {
        $this->method = $_SERVER['REQUEST_METHOD'];
        $this->path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $this->request = $this->parseRequest();
        $this->authenticate();
    }

    /**
     * Parse da requisição HTTP
     *
     * Suporta:
     *  - application/json
     *  - multipart/form-data (com arquivos) em POST, PUT e PATCH
     *  - application/x-www-form-urlencoded
     */
    private function parseRequest()
    {
        $data = [];
        $contentType = $_SERVER['CONTENT_TYPE'] ?? ($_SERVER['HTTP_CONTENT_TYPE'] ?? '');

        if (in_array($this->method, ['POST', 'PUT', 'PATCH'])) {
            if (stripos($contentType, 'application/json') !== false) {
                $input = file_get_contents('php://input');
                $data = json_decode($input, true) ?: [];
            } elseif (stripos($contentType, 'multipart/form-data') !== false) {
                // O PHP só popula $_POST/$_FILES automaticamente em POST.
                // Em PUT/PATCH precisamos parsear o corpo manualmente.
                if ($this->method !== 'POST') {
                    $this->parseMultipart($contentType);
                }
                $data = $_POST;
            } else {
                // application/x-www-form-urlencoded
                if ($this->method === 'POST') {
                    $data = $_POST;
                } else {
                    parse_str(file_get_contents('php://input'), $data);
                }
            }
        }

        $data = array_merge($data, $_GET);

        return $data;
    }

    /**
     * Parser manual de multipart/form-data para PUT/PATCH.
     * Popula $_POST e $_FILES (o PHP não faz isso nesses métodos).
     */
    private function parseMultipart($contentType)
    {
        if (!preg_match('/boundary=(.+)$/', $contentType, $matches)) {
            return;
        }

        $boundary = trim($matches[1], '"');
        $body = file_get_contents('php://input');

        if ($body === false || $body === '') {
            return;
        }

        $parts = explode('--' . $boundary, $body);

        foreach ($parts as $part) {
            $part = ltrim($part, "\r\n");

            if ($part === '' || $part === '--' || strpos($part, 'Content-Disposition') === false) {
                continue;
            }

            $splitPos = strpos($part, "\r\n\r\n");
            if ($splitPos === false) {
                continue;
            }

            $rawHeaders = substr($part, 0, $splitPos);
            $content = substr($part, $splitPos + 4);
            // Remove o \r\n final que antecede o próximo delimitador
            $content = preg_replace('/\r\n$/', '', $content);

            $headers = [];
            foreach (explode("\r\n", $rawHeaders) as $headerLine) {
                if (strpos($headerLine, ':') !== false) {
                    list($hName, $hValue) = explode(':', $headerLine, 2);
                    $headers[strtolower(trim($hName))] = trim($hValue);
                }
            }

            if (!isset($headers['content-disposition'])) {
                continue;
            }

            $name = null;
            $filename = null;
            if (preg_match('/name="([^"]*)"/', $headers['content-disposition'], $mName)) {
                $name = $mName[1];
            }
            if (preg_match('/filename="([^"]*)"/', $headers['content-disposition'], $mFile)) {
                $filename = $mFile[1];
            }

            if ($name === null) {
                continue;
            }

            if ($filename !== null) {
                if ($filename === '') {
                    continue;
                }

                $tmpPath = tempnam(sys_get_temp_dir(), 'php_upload_');
                file_put_contents($tmpPath, $content);

                $this->assignFile($name, [
                    'name' => $filename,
                    'type' => $headers['content-type'] ?? 'application/octet-stream',
                    'tmp_name' => $tmpPath,
                    'error' => UPLOAD_ERR_OK,
                    'size' => strlen($content),
                ]);
            } else {
                $this->assignField($name, $content);
            }
        }
    }

    /**
     * Atribui um campo de texto a $_POST (suporta name[])
     */
    private function assignField($name, $value)
    {
        if (substr($name, -2) === '[]') {
            $key = substr($name, 0, -2);
            if (!isset($_POST[$key]) || !is_array($_POST[$key])) {
                $_POST[$key] = [];
            }
            $_POST[$key][] = $value;
        } else {
            $_POST[$name] = $value;
        }
    }

    /**
     * Atribui um arquivo a $_FILES (suporta name[])
     */
    private function assignFile($name, $fileInfo)
    {
        if (substr($name, -2) === '[]') {
            $key = substr($name, 0, -2);
            if (!isset($_FILES[$key]) || !is_array($_FILES[$key]['name'])) {
                $_FILES[$key] = ['name' => [], 'type' => [], 'tmp_name' => [], 'error' => [], 'size' => []];
            }
            foreach ($fileInfo as $prop => $val) {
                $_FILES[$key][$prop][] = $val;
            }
        } else {
            $_FILES[$name] = $fileInfo;
        }
    }

    /**
     * Verifica se há arquivo enviado para o campo (upload real ou base64)
     */
    protected function hasFileInput($key)
    {
        if (isset($_FILES[$key]) && !is_array($_FILES[$key]['name']) && $_FILES[$key]['error'] === UPLOAD_ERR_OK) {
            return true;
        }

        $val = $this->request[$key] ?? null;
        return is_string($val) && strpos($val, 'data:') === 0;
    }

    /**
     * Armazena um único arquivo (upload real ou base64) e retorna o caminho relativo.
     */
    protected function storeFile($key, $folder)
    {
        if (isset($_FILES[$key]) && !is_array($_FILES[$key]['name']) && $_FILES[$key]['error'] === UPLOAD_ERR_OK) {
            return $this->moveUploadedTo($_FILES[$key]['tmp_name'], $folder, $_FILES[$key]['name']);
        }

        $val = $this->request[$key] ?? null;
        if (is_string($val) && strpos($val, 'data:') === 0) {
            return $this->storeBase64($val, $folder);
        }

        return null;
    }

    /**
     * Armazena múltiplos arquivos (upload real ou base64) e retorna os caminhos.
     */
    protected function storeFiles($key, $folder)
    {
        $paths = [];

        if (isset($_FILES[$key])) {
            $names = $_FILES[$key]['name'];
            if (is_array($names)) {
                foreach ($names as $i => $n) {
                    if ($_FILES[$key]['error'][$i] === UPLOAD_ERR_OK) {
                        $paths[] = $this->moveUploadedTo($_FILES[$key]['tmp_name'][$i], $folder, $n);
                    }
                }
            } elseif ($_FILES[$key]['error'] === UPLOAD_ERR_OK) {
                $paths[] = $this->moveUploadedTo($_FILES[$key]['tmp_name'], $folder, $names);
            }
        }

        $val = $this->request[$key] ?? null;
        if (is_array($val)) {
            foreach ($val as $item) {
                if (is_string($item) && strpos($item, 'data:') === 0) {
                    $paths[] = $this->storeBase64($item, $folder);
                }
            }
        }

        return $paths;
    }

    /**
     * Move um arquivo enviado para a pasta de mídia, preservando a extensão.
     */
    private function moveUploadedTo($tmpName, $folder, $originalName)
    {
        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        if ($ext === '') {
            $ext = 'bin';
        }

        $relDir = $folder . '/' . date('Y/m/d');
        $absDir = MEDIA_ROOT . '/' . $relDir;

        if (!is_dir($absDir)) {
            mkdir($absDir, 0755, true);
        }

        $filename = uniqid() . '.' . $ext;
        $dest = $absDir . '/' . $filename;

        // Uploads reais (POST) usam move_uploaded_file; parse manual usa rename.
        if (is_uploaded_file($tmpName)) {
            move_uploaded_file($tmpName, $dest);
        } else {
            rename($tmpName, $dest);
        }

        return $relDir . '/' . $filename;
    }

    /**
     * Armazena um arquivo a partir de uma string base64 (data URI).
     */
    protected function storeBase64($dataUri, $folder)
    {
        $ext = 'bin';

        if (preg_match('/^data:([^;]+);base64,/', $dataUri, $m)) {
            $ext = $this->extensionFromMime($m[1]);
            $content = base64_decode(substr($dataUri, strpos($dataUri, ',') + 1));
        } else {
            $content = base64_decode($dataUri);
        }

        $relDir = $folder . '/' . date('Y/m/d');
        $absDir = MEDIA_ROOT . '/' . $relDir;

        if (!is_dir($absDir)) {
            mkdir($absDir, 0755, true);
        }

        $filename = uniqid() . '.' . $ext;
        file_put_contents($absDir . '/' . $filename, $content);

        return $relDir . '/' . $filename;
    }

    /**
     * Remove um arquivo de mídia, se existir.
     */
    protected function removeMediaFile($path)
    {
        if (!empty($path)) {
            $full = MEDIA_ROOT . '/' . $path;
            if (file_exists($full)) {
                unlink($full);
            }
        }
    }

    /**
     * Converte um valor (inclusive strings "true"/"false" de FormData) em boolean.
     */
    protected function toBool($value)
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Determina a extensão a partir do MIME type.
     */
    private function extensionFromMime($mime)
    {
        $map = [
            'image/jpeg' => 'jpg',
            'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'application/pdf' => 'pdf',
        ];
        return $map[$mime] ?? 'bin';
    }

    /**
     * Autenticação via JWT
     */
    protected function authenticate()
    {
        $authHeader = $this->getAuthorizationHeader();

        if (preg_match('/Bearer\s+(.+)/', $authHeader, $matches)) {
            $token = $matches[1];
            $payload = JWT::verifyToken($token);

            if ($payload && isset($payload['user_id'])) {
                $this->user = \gerenciamento\Usuario::find($payload['user_id']);
            }
        }
    }

    /**
     * Obtém o header Authorization de forma resiliente.
     *
     * Proxies (ex.: o proxy do Vite) repassam o nome do header em
     * minúsculas, e o getallheaders() do servidor embutido do PHP
     * preserva essa caixa. Por isso a busca é case-insensitive, com
     * fallback para $_SERVER (CGI/FastCGI/Apache).
     */
    private function getAuthorizationHeader()
    {
        if (function_exists('getallheaders')) {
            foreach (getallheaders() as $name => $value) {
                if (strcasecmp($name, 'Authorization') === 0) {
                    return $value;
                }
            }
        }

        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            return $_SERVER['HTTP_AUTHORIZATION'];
        }

        if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }

        return '';
    }

    /**
     * Verifica se o usuário está autenticado
     */
    protected function requireAuth()
    {
        if (!$this->user) {
            Response::unauthorized()->send();
        }
    }

    /**
     * Verifica permissão de módulo
     */
    protected function requireModuleAccess($modulo)
    {
        if (!$this->user) {
            Response::unauthorized()->send();
        }

        if (!\gerenciamento\PerfilAdministrativo::usuarioPodeGerenciarModulo($this->user, $modulo)) {
            Response::forbidden('Acesso proibido')->send();
        }
    }

    /**
     * Verifica se é master
     */
    protected function requireMaster()
    {
        if (!$this->user) {
            Response::unauthorized()->send();
        }

        $nivel = \gerenciamento\PerfilAdministrativo::getNivelUsuario($this->user);
        if ($nivel !== \gerenciamento\PerfilAdministrativo::NIVEL_MASTER) {
            Response::forbidden('Acesso restrito a master')->send();
        }
    }

    /**
     * Obtém um parâmetro da requisição
     */
    protected function getParameter($key, $default = null)
    {
        return $this->request[$key] ?? $default;
    }

    /**
     * Obtém todos os parâmetros
     */
    protected function getAllParameters()
    {
        return $this->request;
    }

    /**
     * Retorna erro de validação
     */
    protected function validationError($errors)
    {
        Response::validation($errors)->send();
    }

    /**
     * Executa a ação apropriada do controller
     */
    public function dispatch($action = null, $params = [])
    {
        $this->params = $params;

        $method = strtolower($this->method);
        $actionMethod = "{$method}_{$action}";

        if ($action && method_exists($this, $actionMethod)) {
            return $this->{$actionMethod}();
        } elseif (method_exists($this, $method)) {
            return $this->{$method}();
        } else {
            Response::error('Método não permitido', 405)->send();
        }
    }

    /**
     * Obtém o usuário autenticado
     */
    protected function getUser()
    {
        return $this->user;
    }

    /**
     * Define CORS headers
     */
    protected function setCorsHeaders()
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if ($this->isOriginAllowed($origin)) {
            header("Access-Control-Allow-Origin: {$origin}");
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization');
        }

        if ($this->method === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
    }

    /**
     * Valida CORS
     */
    private function isOriginAllowed($origin)
    {
        if (in_array($origin, CORS_ALLOWED_ORIGINS)) {
            return true;
        }

        foreach (CORS_ALLOWED_ORIGINS as $allowedOrigin) {
            if (strpos($allowedOrigin, '*') !== false) {
                $pattern = str_replace('*', '.*', preg_quote($allowedOrigin, '/'));
                if (preg_match("/{$pattern}/", $origin)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Adiciona security headers
     */
    protected function setSecurityHeaders()
    {
        header('X-Content-Type-Options: nosniff');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header('Permissions-Policy: camera=(), microphone=(), geolocation=()');

        $csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self' data:",
            "connect-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
        ];

        header('Content-Security-Policy: ' . implode('; ', $csp));
    }
}
