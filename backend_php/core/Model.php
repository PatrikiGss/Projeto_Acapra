<?php

namespace core;

/**
 * Classe base para modelos
 * Equivalente aos modelos do Django
 */
abstract class Model
{
    protected $db;
    protected $table = '';
    public $attributes = [];
    protected $original = [];
    protected $fillable = [];

    public function __construct($data = [])
    {
        $this->db = Database::getInstance();
        $this->fill($data);
    }

    /**
     * Preenche os atributos do modelo
     */
    public function fill($data, $applyFillable = true)
    {
        foreach ($data as $key => $value) {
            if (!$applyFillable || in_array($key, $this->fillable) || empty($this->fillable)) {
                $this->attributes[$key] = $value;
            }
        }
        $this->original = $this->attributes;
        return $this;
    }

    /**
     * Hidrata o modelo a partir de uma linha do banco,
     * sem aplicar o filtro de mass-assignment (fillable).
     */
    public function hydrate($data)
    {
        return $this->fill($data, false);
    }

    /**
     * Obtém um atributo
     */
    public function __get($name)
    {
        if (isset($this->attributes[$name])) {
            return $this->attributes[$name];
        }
        return null;
    }

    /**
     * Define um atributo
     */
    public function __set($name, $value)
    {
        $this->attributes[$name] = $value;
    }

    /**
     * Verifica se um atributo foi alterado
     */
    public function isDirty($key = null)
    {
        if ($key === null) {
            return $this->attributes !== $this->original;
        }
        return isset($this->attributes[$key]) && $this->original[$key] !== $this->attributes[$key];
    }

    /**
     * Salva o modelo no banco
     */
    public function save()
    {
        if (isset($this->attributes['id'])) {
            $this->update();
        } else {
            $this->create();
        }
        return $this;
    }

    /**
     * Cria um novo registro
     */
    protected function create()
    {
        $id = $this->db->insert($this->table, $this->attributes);
        $this->attributes['id'] = $id;
        $this->original = $this->attributes;
        return $id;
    }

    /**
     * Atualiza o registro existente
     */
    protected function update()
    {
        $id = $this->attributes['id'];
        unset($this->attributes['id']);

        $this->db->update($this->table, $this->attributes, ['id' => $id]);

        $this->attributes['id'] = $id;
        $this->original = $this->attributes;
    }

    /**
     * Deleta o registro
     */
    public function delete()
    {
        if (isset($this->attributes['id'])) {
            $this->db->delete($this->table, ['id' => $this->attributes['id']]);
            return true;
        }
        return false;
    }

    /**
     * Converte para array
     */
    public function toArray()
    {
        return $this->attributes;
    }

    /**
     * Converte para JSON
     */
    public function toJson()
    {
        return json_encode($this->attributes);
    }

    /**
     * Encontra um registro pelo ID
     */
    public static function find($id)
    {
        $instance = new static();
        $sql = "SELECT * FROM {$instance->table} WHERE id = ?";
        $data = $instance->db->fetchOne($sql, [$id]);

        if ($data) {
            return (new static())->hydrate($data);
        }
        return null;
    }

    /**
     * Encontra registros
     */
    public static function where($column, $operator, $value = null)
    {
        if ($value === null) {
            $value = $operator;
            $operator = '=';
        }

        $instance = new static();
        return new QueryBuilder($instance->table, $instance->db, $column, $operator, $value, static::class);
    }

    /**
     * Obtém todos os registros
     */
    public static function all()
    {
        $instance = new static();
        $sql = "SELECT * FROM {$instance->table}";
        $results = $instance->db->fetchAll($sql);

        $models = [];
        foreach ($results as $row) {
            $models[] = (new static())->hydrate($row);
        }
        return $models;
    }

    /**
     * Retorna a string representativa do modelo
     */
    public function __toString()
    {
        return get_class($this) . ' #' . ($this->attributes['id'] ?? 'new');
    }
}
