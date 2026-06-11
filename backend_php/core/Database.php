<?php

namespace core;

/**
 * Classe de gerenciamento de banco de dados
 * Equivalente ao ORM do Django (funcionalidade básica)
 *
 * Suporta SQLite e MySQL
 */
class Database
{
    private static $instance = null;
    private $connection = null;
    private $engine = '';

    private function __construct()
    {
        $config = DB_CONFIG;
        $this->engine = $config['engine'];

        try {
            if ($this->engine === 'sqlite') {
                $this->connection = new \PDO('sqlite:' . $config['database']);
            } elseif ($this->engine === 'mysql') {
                $dsn = "mysql:host={$config['host']};dbname={$config['database']};port={$config['port']}";
                $this->connection = new \PDO($dsn, $config['user'], $config['password']);
            }

            $this->connection->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
            $this->connection->setAttribute(\PDO::ATTR_DEFAULT_FETCH_MODE, \PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            die('Erro de conexão ao banco de dados: ' . $e->getMessage());
        }
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection()
    {
        return $this->connection;
    }

    /**
     * Executa uma query preparada
     */
    public function execute($sql, $params = [])
    {
        $stmt = $this->connection->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    /**
     * Retorna um registro
     */
    public function fetchOne($sql, $params = [])
    {
        $stmt = $this->execute($sql, $params);
        return $stmt->fetch();
    }

    /**
     * Retorna múltiplos registros
     */
    public function fetchAll($sql, $params = [])
    {
        $stmt = $this->execute($sql, $params);
        return $stmt->fetchAll();
    }

    /**
     * Insere um registro e retorna o ID
     */
    public function insert($table, $data)
    {
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));
        $sql = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";

        $this->execute($sql, array_values($data));
        return $this->connection->lastInsertId();
    }

    /**
     * Atualiza registros
     */
    public function update($table, $data, $where)
    {
        $set = implode(', ', array_map(fn($k) => "{$k} = ?", array_keys($data)));
        $whereClause = implode(' AND ', array_map(fn($k) => "{$k} = ?", array_keys($where)));
        $sql = "UPDATE {$table} SET {$set} WHERE {$whereClause}";

        $params = array_merge(array_values($data), array_values($where));
        return $this->execute($sql, $params);
    }

    /**
     * Deleta registros
     */
    public function delete($table, $where)
    {
        $whereClause = implode(' AND ', array_map(fn($k) => "{$k} = ?", array_keys($where)));
        $sql = "DELETE FROM {$table} WHERE {$whereClause}";

        return $this->execute($sql, array_values($where));
    }

    /**
     * Conta registros
     */
    public function count($table, $where = [])
    {
        $sql = "SELECT COUNT(*) as count FROM {$table}";

        if (!empty($where)) {
            $whereClause = implode(' AND ', array_map(fn($k) => "{$k} = ?", array_keys($where)));
            $sql .= " WHERE {$whereClause}";
            $result = $this->fetchOne($sql, array_values($where));
        } else {
            $result = $this->fetchOne($sql);
        }

        return $result ? $result['count'] : 0;
    }

    /**
     * Inicia uma transação
     */
    public function beginTransaction()
    {
        $this->connection->beginTransaction();
    }

    /**
     * Confirma uma transação
     */
    public function commit()
    {
        $this->connection->commit();
    }

    /**
     * Desfaz uma transação
     */
    public function rollback()
    {
        $this->connection->rollBack();
    }
}
