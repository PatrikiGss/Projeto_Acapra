<?php

namespace core;

/**
 * Validador de dados
 * Equivalente aos serializers do Django
 */
class Validator
{
    private $data = [];
    private $errors = [];
    private $rules = [];
    private $customMessages = [];

    public function __construct($data = [], $rules = [])
    {
        $this->data = $data;
        $this->rules = $rules;
    }

    /**
     * Define as regras de validação
     */
    public function setRules($rules)
    {
        $this->rules = $rules;
        return $this;
    }

    /**
     * Define mensagens customizadas
     */
    public function setMessages($messages)
    {
        $this->customMessages = $messages;
        return $this;
    }

    /**
     * Valida os dados
     */
    public function validate()
    {
        $this->errors = [];

        foreach ($this->rules as $field => $rules) {
            $fieldRules = explode('|', $rules);

            foreach ($fieldRules as $rule) {
                $this->validateField($field, $rule);
            }
        }

        return empty($this->errors);
    }

    /**
     * Valida um campo específico
     */
    private function validateField($field, $rule)
    {
        $value = $this->data[$field] ?? null;

        if (strpos($rule, ':') !== false) {
            list($ruleName, $ruleValue) = explode(':', $rule, 2);
        } else {
            $ruleName = $rule;
            $ruleValue = null;
        }

        switch ($ruleName) {
            case 'required':
                if (empty($value) && $value !== '0' && $value !== 0) {
                    $this->addError($field, "O campo $field é obrigatório");
                }
                break;

            case 'email':
                if (!empty($value) && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $this->addError($field, "O campo $field deve ser um email válido");
                }
                break;

            case 'min':
                if (!empty($value) && strlen($value) < (int)$ruleValue) {
                    $this->addError($field, "O campo $field deve ter no mínimo {$ruleValue} caracteres");
                }
                break;

            case 'max':
                if (!empty($value) && strlen($value) > (int)$ruleValue) {
                    $this->addError($field, "O campo $field deve ter no máximo {$ruleValue} caracteres");
                }
                break;

            case 'unique':
                // Validação de unicidade (implementação específica por campo)
                // Implementar com base no banco de dados
                break;

            case 'confirmed':
                $confirmField = "{$field}_confirmation";
                if ($value !== ($this->data[$confirmField] ?? null)) {
                    $this->addError($field, "O campo $field não foi confirmado");
                }
                break;

            case 'numeric':
                if (!empty($value) && !is_numeric($value)) {
                    $this->addError($field, "O campo $field deve ser numérico");
                }
                break;

            case 'string':
                if (!empty($value) && !is_string($value)) {
                    $this->addError($field, "O campo $field deve ser texto");
                }
                break;

            case 'array':
                if (!empty($value) && !is_array($value)) {
                    $this->addError($field, "O campo $field deve ser um array");
                }
                break;

            case 'date':
                if (!empty($value) && !$this->isValidDate($value)) {
                    $this->addError($field, "O campo $field deve ser uma data válida");
                }
                break;

            case 'phone':
                if (!empty($value) && !$this->isValidPhone($value)) {
                    $this->addError($field, "O campo $field deve ser um telefone válido");
                }
                break;
        }
    }

    /**
     * Adiciona um erro
     */
    private function addError($field, $message)
    {
        if (!isset($this->errors[$field])) {
            $this->errors[$field] = [];
        }
        $this->errors[$field][] = $message;
    }

    /**
     * Retorna os erros
     */
    public function errors()
    {
        return $this->errors;
    }

    /**
     * Retorna o primeiro erro
     */
    public function firstError()
    {
        foreach ($this->errors as $field => $messages) {
            return $messages[0] ?? null;
        }
        return null;
    }

    /**
     * Valida se é uma data válida
     */
    private function isValidDate($date)
    {
        $d = \DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date;
    }

    /**
     * Valida um número de telefone
     */
    private function isValidPhone($phone)
    {
        // Remove caracteres não numéricos
        $phone = preg_replace('/\D/', '', $phone);
        // Remove o código do país (55) quando enviado em formato E164
        if (strlen($phone) > 11 && substr($phone, 0, 2) === '55') {
            $phone = substr($phone, 2);
        }
        // Valida telefone brasileiro (10 ou 11 dígitos com DDD)
        return preg_match('/^\d{10,11}$/', $phone);
    }
}
