<?php

namespace core;

/**
 * Construtor de queries
 * Equivalente ao QuerySet do Django
 */
class QueryBuilder
{
    private $table = '';
    private $db;
    private $modelClass = '';
    private $wheres = [];
    private $params = [];
    private $orderBy = '';
    private $limit = null;
    private $offset = null;

    public function __construct($table, $db, $column = null, $operator = null, $value = null, $modelClass = null)
    {
        $this->table = $table;
        $this->db = $db;
        $this->modelClass = $modelClass;

        if ($column !== null && $operator !== null && $value !== null) {
            $this->wheres[] = [$column, $operator, $value];
            $this->params[] = $value;
        }
    }

    /**
     * Adiciona uma condição WHERE
     */
    public function where($column, $operator, $value = null)
    {
        if ($value === null) {
            $value = $operator;
            $operator = '=';
        }

        $this->wheres[] = [$column, $operator, $value];
        $this->params[] = $value;
        return $this;
    }

    /**
     * Ordena os resultados
     */
    public function orderBy($column, $direction = 'ASC')
    {
        $this->orderBy = "{$column} {$direction}";
        return $this;
    }

    /**
     * Limita o número de resultados
     */
    public function limit($limit)
    {
        $this->limit = $limit;
        return $this;
    }

    /**
     * Define o deslocamento
     */
    public function offset($offset)
    {
        $this->offset = $offset;
        return $this;
    }

    /**
     * Pagina os resultados
     */
    public function paginate($page = 1, $perPage = PAGE_SIZE)
    {
        $page = max(1, $page);
        $offset = ($page - 1) * $perPage;

        $this->offset($offset)->limit($perPage);

        $total = $this->count();
        $results = $this->get();

        return [
            'data' => $results,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'pages' => ceil($total / $perPage),
        ];
    }

    /**
     * Obtém todos os resultados
     */
    public function get()
    {
        $sql = $this->buildSelectSql();
        $results = $this->db->fetchAll($sql, $this->params);

        $models = [];
        foreach ($results as $row) {
            $model = new $this->modelClass();
            $models[] = $model->hydrate($row);
        }
        return $models;
    }

    /**
     * Obtém o primeiro resultado
     */
    public function first()
    {
        $this->limit(1);
        $results = $this->get();
        return count($results) > 0 ? $results[0] : null;
    }

    /**
     * Conta os registros
     */
    public function count()
    {
        $sql = $this->buildCountSql();
        $result = $this->db->fetchOne($sql, $this->params);
        return $result ? $result['count'] : 0;
    }

    /**
     * Verifica se existe resultado
     */
    public function exists()
    {
        return $this->count() > 0;
    }

    /**
     * Deleta os registros
     */
    public function delete()
    {
        $sql = "DELETE FROM {$this->table}";
        $sql .= $this->buildWhereSql();

        return $this->db->execute($sql, $this->params);
    }

    /**
     * Atualiza os registros
     */
    public function update($data)
    {
        $set = implode(', ', array_map(fn($k) => "{$k} = ?", array_keys($data)));
        $sql = "UPDATE {$this->table} SET {$set}";
        $sql .= $this->buildWhereSql();

        $params = array_merge(array_values($data), $this->params);
        return $this->db->execute($sql, $params);
    }

    /**
     * Constrói a SQL SELECT
     */
    private function buildSelectSql()
    {
        $sql = "SELECT * FROM {$this->table}";
        $sql .= $this->buildWhereSql();

        if ($this->orderBy) {
            $sql .= " ORDER BY {$this->orderBy}";
        }

        if ($this->limit !== null) {
            $sql .= " LIMIT {$this->limit}";
        }

        if ($this->offset !== null) {
            $sql .= " OFFSET {$this->offset}";
        }

        return $sql;
    }

    /**
     * Constrói a SQL COUNT
     */
    private function buildCountSql()
    {
        $sql = "SELECT COUNT(*) as count FROM {$this->table}";
        $sql .= $this->buildWhereSql();
        return $sql;
    }

    /**
     * Constrói a cláusula WHERE
     */
    private function buildWhereSql()
    {
        if (empty($this->wheres)) {
            return '';
        }

        $conditions = [];
        foreach ($this->wheres as $where) {
            $conditions[] = "{$where[0]} {$where[1]} ?";
        }

        return ' WHERE ' . implode(' AND ', $conditions);
    }
}
