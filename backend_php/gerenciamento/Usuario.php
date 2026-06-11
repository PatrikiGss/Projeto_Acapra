<?php

namespace gerenciamento;

use core\Model;

/**
 * Modelo de usuário
 * Equivalente ao modelo Usuario do Django
 *
 * Autenticação via email
 */
class Usuario extends Model
{
    protected $table = 'usuarios';
    protected $fillable = ['nome', 'email', 'telefone', 'password', 'is_staff', 'is_superuser', 'is_active', 'date_joined'];

    /**
     * Hash de senha
     */
    public function setPasswordAttribute($value)
    {
        if ($value) {
            $this->attributes['password'] = password_hash($value, PASSWORD_BCRYPT);
        }
    }

    /**
     * Valida a senha
     */
    public function validatePassword($password)
    {
        return password_verify($password, $this->password);
    }

    /**
     * Encontra usuário pelo email
     */
    public static function findByEmail($email)
    {
        return self::where('email', '=', strtolower(trim($email)))->first();
    }

    /**
     * Encontra usuário pelo email ou cria um novo
     */
    public static function findOrCreateByEmail($email, $data = [])
    {
        $user = self::findByEmail($email);

        if (!$user) {
            $user = new self(array_merge(['email' => $email], $data));
            $user->save();
        }

        return $user;
    }

    /**
     * Cria um novo usuário
     */
    public static function createUser($email, $password, $data = [])
    {
        $validator = new \core\Validator(
            array_merge(['email' => $email, 'password' => $password], $data),
            [
                'email' => 'required|email',
                'password' => 'required|min:8',
                'nome' => 'required',
                'telefone' => 'required|phone'
            ]
        );

        if (!$validator->validate()) {
            throw new \Exception($validator->firstError());
        }

        if (self::findByEmail($email)) {
            throw new \Exception('Email já cadastrado');
        }

        $user = new self(array_merge([
            'email' => strtolower(trim($email)),
            'is_active' => true,
            'date_joined' => date('Y-m-d H:i:s')
        ], $data));

        $user->attributes['password'] = password_hash($password, PASSWORD_BCRYPT);
        $user->save();

        return $user;
    }

    /**
     * Cria um superusuário
     */
    public static function createSuperUser($email, $password, $data = [])
    {
        $user = self::createUser($email, $password, $data);
        $user->attributes['is_staff'] = true;
        $user->attributes['is_superuser'] = true;
        $user->save();

        return $user;
    }

    /**
     * Retorna o perfil administrativo
     */
    public function perfilAdmin()
    {
        return PerfilAdministrativo::where('usuario_id', '=', $this->attributes['id'])->first();
    }

    /**
     * Converte para array (seguro)
     */
    public function toArray()
    {
        $data = parent::toArray();
        unset($data['password']);
        return $data;
    }
}
