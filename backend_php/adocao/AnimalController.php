<?php

namespace adocao;

use core\Controller;
use core\Response;
use core\Validator;
use meta_integration\Services;

/**
 * Controller de animais para adoção
 * Equivalente aos views de adocao do Django
 */
class AnimalController extends Controller
{
    /**
     * Lista animais publicamente
     * GET /api/adocao/animais/
     */
    public function get_animais()
    {
        $query = Animal::where('id', '>', 0)->orderBy('id', 'DESC');

        $disponivelParam = $_GET['disponivel'] ?? null;
        if ($disponivelParam !== null) {
            $disponivel = strtolower($disponivelParam) !== 'false' ? 1 : 0;
            $query = $query->where('disponivel', '=', $disponivel);
        }

        $animais = $query->get();

        $data = [];
        foreach ($animais as $animal) {
            $data[] = $this->serializeAnimal($animal);
        }

        Response::success($data)->send();
    }

    /**
     * Cria um novo animal
     * POST /api/adocao/animais/
     */
    public function post_animais()
    {
        $this->requireModuleAccess('adocao');

        $data = $this->getAllParameters();

        $validator = new Validator($data, [
            'nome_animal' => 'required|max:30',
            'nome_doador' => 'required|max:30',
            'telefone' => 'required|phone',
            'especie' => 'required',
            'sexo' => 'required',
        ]);

        if (!$validator->validate()) {
            Response::validation($validator->errors())->send();
        }

        $animal = new Animal([
            'nome_animal' => $data['nome_animal'],
            'nome_doador' => $data['nome_doador'],
            'telefone' => $data['telefone'],
            'especie' => $data['especie'],
            'sexo' => $data['sexo'],
            'descricao' => $data['descricao'] ?? null,
            'disponivel' => isset($data['disponivel']) ? ($data['disponivel'] !== 'false' && $data['disponivel'] !== false ? 1 : 0) : 1,
        ]);

        if ($this->hasFileInput('foto')) {
            $animal->attributes['foto'] = $this->storeFile('foto', 'fotos');
        }

        $animal->save();

        $this->criarImagens($animal, $this->storeFiles('fotos', 'fotos'));

        // Publicação automática nas redes sociais
        $publicar = ($data['publicar_redes'] ?? 'true') === 'true' || ($data['publicar_redes'] ?? true) === true;
        if ($publicar) {
            try {
                Services::autoPostAnimal($animal);
            } catch (\Exception $exc) {
                error_log("Erro ao publicar animal nas redes sociais: " . $exc->getMessage());
            }
        }

        Response::success($this->serializeAnimal($animal), 201)->send();
    }

    /**
     * Retorna detalhes de um animal
     * GET /api/adocao/animais/<id>/
     */
    public function get_animal_detail()
    {
        $animal = $this->getAnimalOr404();
        Response::success($this->serializeAnimal($animal))->send();
    }

    /**
     * Atualiza um animal
     * PATCH /api/adocao/animais/<id>/
     */
    public function patch_animal_detail()
    {
        $this->requireModuleAccess('adocao');

        $animal = $this->getAnimalOr404();
        $data = $this->getAllParameters();

        if (isset($data['nome_animal'])) {
            $animal->attributes['nome_animal'] = $data['nome_animal'];
        }

        if (isset($data['nome_doador'])) {
            $animal->attributes['nome_doador'] = $data['nome_doador'];
        }

        if (isset($data['especie'])) {
            $animal->attributes['especie'] = $data['especie'];
        }

        if (isset($data['sexo'])) {
            $animal->attributes['sexo'] = $data['sexo'];
        }

        if (array_key_exists('descricao', $data)) {
            $animal->attributes['descricao'] = $data['descricao'];
        }

        if (array_key_exists('disponivel', $data)) {
            $animal->attributes['disponivel'] = ($data['disponivel'] !== 'false' && $data['disponivel'] !== false) ? 1 : 0;
        }

        if ($this->hasFileInput('foto')) {
            $this->removeMediaFile($animal->attributes['foto']);
            $animal->attributes['foto'] = $this->storeFile('foto', 'fotos');
        }

        $animal->save();

        $this->criarImagens($animal, $this->storeFiles('fotos', 'fotos'));

        Response::success($this->serializeAnimal($animal))->send();
    }

    /**
     * Remove um animal
     * DELETE /api/adocao/animais/<id>/
     */
    public function delete_animal_detail()
    {
        $this->requireModuleAccess('adocao');

        $id = $this->params[0] ?? null;
        $animal = $this->getAnimalOr404();
        $animal->delete();

        Response::success(['detail' => "Animal {$id} removido com sucesso."], 204)->send();
    }

    /**
     * Busca o animal pelo ID ou retorna 404
     */
    private function getAnimalOr404()
    {
        $id = $this->params[0] ?? null;

        if (!$id) {
            Response::notFound()->send();
        }

        $animal = Animal::find($id);

        if (!$animal) {
            Response::notFound()->send();
        }

        return $animal;
    }

    /**
     * Cria as imagens adicionais do animal a partir de uma lista
     * Equivalente a _criar_imagens_animal do Django
     */
    private function criarImagens($animal, $paths)
    {
        if (empty($paths)) {
            return;
        }

        // Calcula a próxima ordem com base na maior ordem existente
        $existentes = $animal->imagens();
        $ultimaOrdem = null;
        foreach ($existentes as $img) {
            $ordem = (int)$img->attributes['ordem'];
            if ($ultimaOrdem === null || $ordem > $ultimaOrdem) {
                $ultimaOrdem = $ordem;
            }
        }
        $proximaOrdem = $ultimaOrdem !== null ? $ultimaOrdem + 1 : 0;

        foreach (array_values($paths) as $indice => $path) {
            $imagem = new AnimalImagem([
                'animal_id' => $animal->attributes['id'],
                'imagem' => $path,
                'ordem' => $proximaOrdem + $indice,
            ]);
            $imagem->save();
        }
    }

    /**
     * Serializa um animal para resposta JSON
     * Equivalente ao GetAnimalSerializer do Django
     */
    private function serializeAnimal($animal)
    {
        return [
            'id' => $animal->attributes['id'],
            'nome_animal' => $animal->attributes['nome_animal'],
            'nome_doador' => $animal->attributes['nome_doador'],
            'telefone' => $animal->attributes['telefone'],
            'especie' => $animal->attributes['especie'],
            'sexo' => $animal->attributes['sexo'],
            'foto' => $this->getFotoPrincipal($animal),
            'fotos' => $this->getFotos($animal),
            'descricao' => $animal->attributes['descricao'],
            'disponivel' => (bool)($animal->attributes['disponivel'] ?? true),
        ];
    }

    /**
     * Retorna a foto principal (foto ou primeira imagem)
     */
    private function getFotoPrincipal($animal)
    {
        if (!empty($animal->attributes['foto'])) {
            return $this->buildFileUrl($animal->attributes['foto']);
        }

        $imagens = $animal->imagens();
        if (!empty($imagens)) {
            return $this->buildFileUrl($imagens[0]->attributes['imagem']);
        }

        return null;
    }

    /**
     * Retorna todas as fotos (foto + imagens), sem duplicatas
     */
    private function getFotos($animal)
    {
        $imagens = [];

        if (!empty($animal->attributes['foto'])) {
            $imagens[] = $this->buildFileUrl($animal->attributes['foto']);
        }

        foreach ($animal->imagens() as $img) {
            if (!empty($img->attributes['imagem'])) {
                $imagens[] = $this->buildFileUrl($img->attributes['imagem']);
            }
        }

        return array_values(array_unique(array_filter($imagens)));
    }

    /**
     * Constrói a URL pública de um arquivo de mídia
     */
    private function buildFileUrl($path)
    {
        return $path ? MEDIA_URL . $path : null;
    }
}
