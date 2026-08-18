from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from PIL import Image
from unittest import mock

from .models import Animal, AnimalImagem, EspecieAnimal, SexoAnimal
from .serializers import (
    AnimalSerializer,
    GetAnimalSerializer,
    UpdateAnimalSerializer,
)


User = get_user_model()


def criar_imagem(nome):
    buffer = BytesIO()
    Image.new("RGB", (1, 1), color="white").save(buffer, format="PNG")
    return SimpleUploadedFile(nome, buffer.getvalue(), content_type="image/png")


# =========================================================
# MODEL
# =========================================================
class AnimalModelTests(APITestCase):
    """Testes para o modelo Animal."""

    def setUp(self):
        self.animal = Animal.objects.create(
            nome_animal="Thor",
            nome_doador="JoÃ£o Silva",
            telefone="+5511999999999",
            especie=EspecieAnimal.CACHORRO,
            sexo=SexoAnimal.MACHO,
            descricao="Cachorro dÃ³cil",
        )

    def test_criacao_animal(self):
        """Animal Ã© criado com os campos obrigatÃ³rios."""
        self.assertEqual(self.animal.nome_doador, "JoÃ£o Silva")
        self.assertEqual(self.animal.especie, "cachorro")
        self.assertEqual(self.animal.sexo, "macho")
        self.assertEqual(Animal.objects.count(), 1)

    def test_str_animal(self):
        """__str__ retorna 'nome_doador - especie'."""
        self.assertEqual(str(self.animal), "JoÃ£o Silva - cachorro")

    def test_campos_opcionais_aceitam_nulo(self):
        """foto e descricao podem ser nulos."""
        animal = Animal.objects.create(
            nome_animal="Mia",
            nome_doador="Maria",
            telefone="+5511988888888",
            especie=EspecieAnimal.GATO,
            sexo=SexoAnimal.FEMEA,
        )
        self.assertIsNone(animal.descricao)
        self.assertFalse(animal.foto)

    def test_choices_especie(self):
        """EspecieAnimal expÃµe cachorro, gato e outros."""
        valores = [c[0] for c in EspecieAnimal.choices]
        self.assertIn("cachorro", valores)
        self.assertIn("gato", valores)
        self.assertIn("outros", valores)

    def test_choices_sexo(self):
        """SexoAnimal expÃµe macho e femea."""
        valores = [c[0] for c in SexoAnimal.choices]
        self.assertIn("macho", valores)
        self.assertIn("femea", valores)


# =========================================================
# SERIALIZERS
# =========================================================
class AnimalSerializerTests(APITestCase):
    """Testes para os serializadores."""

    def setUp(self):
        self.dados_validos = {
            "nome_animal": "Bob",
            "nome_doador": "Carlos",
            "telefone": "+5511977777777",
            "especie": EspecieAnimal.CACHORRO,
            "sexo": SexoAnimal.MACHO,
            "descricao": "Animal saudÃ¡vel",
        }

    def test_animal_serializer_aceita_dados_validos(self):
        serializer = AnimalSerializer(data=self.dados_validos)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_animal_serializer_recusa_sem_telefone(self):
        dados = self.dados_validos.copy()
        dados.pop("telefone")
        serializer = AnimalSerializer(data=dados)
        self.assertFalse(serializer.is_valid())
        self.assertIn("telefone", serializer.errors)

    def test_animal_serializer_recusa_sem_nome(self):
        dados = self.dados_validos.copy()
        dados.pop("nome_doador")
        serializer = AnimalSerializer(data=dados)
        self.assertFalse(serializer.is_valid())
        self.assertIn("nome_doador", serializer.errors)

    def test_animal_serializer_recusa_especie_invalida(self):
        dados = self.dados_validos.copy()
        dados["especie"] = "peixe"
        serializer = AnimalSerializer(data=dados)
        self.assertFalse(serializer.is_valid())
        self.assertIn("especie", serializer.errors)

    def test_animal_serializer_recusa_telefone_invalido(self):
        dados = self.dados_validos.copy()
        dados["telefone"] = "abc"
        serializer = AnimalSerializer(data=dados)
        self.assertFalse(serializer.is_valid())
        self.assertIn("telefone", serializer.errors)

    def test_get_serializer_expoe_telefone_para_contato(self):
        """GetAnimalSerializer expÃµe telefone para contato via WhatsApp."""
        animal = Animal.objects.create(**self.dados_validos)
        serializer = GetAnimalSerializer(animal)
        self.assertIn("telefone", serializer.data)
        self.assertIn("nome_doador", serializer.data)
        self.assertIn("especie", serializer.data)

    def test_update_serializer_nao_inclui_telefone(self):
        """UpdateAnimalSerializer não permite alterar telefone."""
        self.assertNotIn("telefone", UpdateAnimalSerializer.Meta.fields)



    def test_animal_serializer_aceita_multiplas_fotos(self):
        dados = self.dados_validos.copy()
        dados["fotos"] = [criar_imagem("animal-1.png"), criar_imagem("animal-2.png")]

        serializer = AnimalSerializer(data=dados)

        self.assertTrue(serializer.is_valid(), serializer.errors)

        animal = serializer.save()

        self.assertEqual(animal.imagens.count(), 2)

# VIEW: lista e criação
# =========================================================
class AnimaisViewTests(APITestCase):
    """Testes para /adocao/animais/."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="user@example.com",
            password="senha123",
            nome="UsuÃ¡rio Teste",
            telefone="+5511966666666",
        )
        self.user.perfil_admin.nivel = "diretor_acapra"
        self.user.perfil_admin.save()
        self.url = reverse("adocao:animais")
        self.dados = {
            "nome_animal": "Luna",
            "nome_doador": "Fernanda",
            "telefone": "+5511955555555",
            "especie": EspecieAnimal.GATO,
            "sexo": SexoAnimal.FEMEA,
            "descricao": "Gata calma",
        }

    def test_get_lista_publica(self):
        """GET na lista Ã© pÃºblico (200)."""
        Animal.objects.create(**self.dados)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

    def test_get_lista_vazia(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data, [])

    def test_get_lista_expoe_telefone_para_contato(self):
        Animal.objects.create(**self.dados)
        resp = self.client.get(self.url)
        self.assertIn("telefone", resp.data[0])

    def test_get_lista_ordenada_por_id_desc(self):
        Animal.objects.create(
            nome_animal="Animal A",
            nome_doador="A",
            telefone="+5511944444444",
            especie=EspecieAnimal.CACHORRO,
            sexo=SexoAnimal.MACHO,
        )
        Animal.objects.create(
            nome_animal="Animal B",
            nome_doador="B",
            telefone="+5511933333333",
            especie=EspecieAnimal.GATO,
            sexo=SexoAnimal.FEMEA,
        )
        resp = self.client.get(self.url)
        self.assertEqual(resp.data[0]["nome_doador"], "B")
        self.assertEqual(resp.data[1]["nome_doador"], "A")

    def test_post_sem_autenticacao_retorna_401(self):
        resp = self.client.post(self.url, self.dados, format="json")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(Animal.objects.count(), 0)

    def test_post_autenticado_cria_animal(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.post(self.url, self.dados, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Animal.objects.count(), 1)
        self.assertEqual(Animal.objects.first().nome_doador, "Fernanda")

    def test_post_salva_foco_do_recorte(self):
        self.client.force_authenticate(user=self.user)
        dados = {**self.dados, "foto_foco_x": 0.2, "foto_foco_y": 0.8}

        resp = self.client.post(self.url, dados, format="json")

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["foto_foco_x"], 0.2)
        self.assertEqual(resp.data["foto_foco_y"], 0.8)

    @mock.patch("meta_integration.services.auto_post_animal")
    def test_post_retorna_resultado_da_publicacao_por_rede(self, auto_post_animal):
        self.client.force_authenticate(user=self.user)
        auto_post_animal.return_value = {
            "facebook": {"tentativas": 1, "sucessos": 1, "falhas": 0},
            "instagram": {"tentativas": 1, "sucessos": 0, "falhas": 1},
        }
        dados = {**self.dados, "publicar_redes": "true", "publicar_story": "true"}

        resp = self.client.post(self.url, dados, format="json")

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["publicacao_redes"], auto_post_animal.return_value)

    def test_post_autenticado_dados_invalidos_retorna_400(self):
        self.client.force_authenticate(user=self.user)
        dados = self.dados.copy()
        dados["especie"] = "invalido"
        resp = self.client.post(self.url, dados, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Animal.objects.count(), 0)

    def test_post_autenticado_sem_telefone_retorna_400(self):
        self.client.force_authenticate(user=self.user)
        dados = self.dados.copy()
        dados.pop("telefone")
        resp = self.client.post(self.url, dados, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


# =========================================================
# VIEW: detalhe, update e delete
# =========================================================
class AnimalDetailViewTests(APITestCase):
    """Testes para /adocao/animais/<pk>/."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="user2@example.com",
            password="senha123",
            nome="Outro UsuÃ¡rio",
            telefone="+5511922222222",
        )
        self.user.perfil_admin.nivel = "diretor_acapra"
        self.user.perfil_admin.save()
        self.animal = Animal.objects.create(
            nome_animal="Max",
            nome_doador="Pedro",
            telefone="+5511911111111",
            especie=EspecieAnimal.CACHORRO,
            sexo=SexoAnimal.MACHO,
            descricao="CÃ£o pequeno",
        )
        self.url = reverse(
            "adocao:animal_detail",
            kwargs={"pk": self.animal.pk},
        )
        self.url_inexistente = reverse(
            "adocao:animal_detail",
            kwargs={"pk": 99999},
        )

    # ---------- GET ----------
    def test_get_detalhes_publico(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["nome_doador"], "Pedro")

    def test_get_detalhes_expoe_telefone_para_contato(self):
        resp = self.client.get(self.url)
        self.assertIn("telefone", resp.data)

    def test_get_pk_inexistente_retorna_404(self):
        resp = self.client.get(self.url_inexistente)
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

        # ---------- PATCH ----------
    def test_patch_sem_autenticacao_retorna_401(self):
        resp = self.client.patch(          # <-- put â†’ patch
            self.url,
            {"nome_doador": "Atualizado"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_autenticado_atualiza_animal(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(          # <-- put â†’ patch
           self.url,
            {"nome_doador": "Pedro Editado"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.animal.refresh_from_db()
        self.assertEqual(self.animal.nome_doador, "Pedro Editado")

    def test_patch_autenticado_dados_invalidos_retorna_400(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(          # <-- put â†’ patch
            self.url,
            {"especie": "invalido"},
           format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_pk_inexistente_retorna_404(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(          # <-- put â†’ patch
            self.url_inexistente,
            {"nome_doador": "X"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    # ---------- DELETE ----------
    def test_delete_sem_autenticacao_retorna_401(self):
        resp = self.client.delete(self.url)
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(Animal.objects.filter(pk=self.animal.pk).exists())

    def test_delete_autenticado_remove_animal(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.delete(self.url)
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Animal.objects.filter(pk=self.animal.pk).exists())

    def test_delete_pk_inexistente_retorna_404(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.delete(self.url_inexistente)
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


# =========================================================
# GALERIA: visualizar, manter, remover e adicionar imagens
# =========================================================
class AnimalGaleriaTests(APITestCase):
    """Edição granular de imagens (foto principal + galeria)."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="galeria@example.com",
            password="senha123",
            nome="Editor Galeria",
            telefone="+5511900000000",
        )
        self.user.perfil_admin.nivel = "diretor_acapra"
        self.user.perfil_admin.save()
        self.animal = Animal.objects.create(
            nome_animal="Rex",
            nome_doador="Ana",
            telefone="+5511911111111",
            especie=EspecieAnimal.CACHORRO,
            sexo=SexoAnimal.MACHO,
            foto=criar_imagem("principal.png"),
        )
        self.img1 = AnimalImagem.objects.create(
            animal=self.animal, imagem=criar_imagem("g1.png"), ordem=0
        )
        self.img2 = AnimalImagem.objects.create(
            animal=self.animal, imagem=criar_imagem("g2.png"), ordem=1
        )
        self.url = reverse("adocao:animal_detail", kwargs={"pk": self.animal.pk})

    def test_galeria_lista_principal_e_imagens_com_id(self):
        serializer = GetAnimalSerializer(self.animal, context={"request": None})
        galeria = serializer.data["galeria"]
        self.assertEqual(len(galeria), 3)
        self.assertEqual(galeria[0]["tipo"], "principal")
        self.assertIsNone(galeria[0]["id"])
        self.assertEqual(galeria[1]["tipo"], "galeria")
        self.assertEqual(galeria[1]["id"], self.img1.id)

    def test_patch_remove_imagem_individual_mantendo_as_demais(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(
            self.url, {"remover_imagens": [self.img1.id]}, format="multipart"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertFalse(self.animal.imagens.filter(id=self.img1.id).exists())
        self.assertTrue(self.animal.imagens.filter(id=self.img2.id).exists())

    def test_patch_remove_foto_principal(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(self.url, {"remover_foto": "true"}, format="multipart")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.animal.refresh_from_db()
        self.assertFalse(self.animal.foto)
        # A galeria permanece intacta.
        self.assertEqual(self.animal.imagens.count(), 2)

    def test_patch_adiciona_novas_sem_remover_existentes(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(
            self.url, {"fotos": [criar_imagem("nova.png")]}, format="multipart"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertEqual(self.animal.imagens.count(), 3)

    def test_patch_remove_e_adiciona_no_mesmo_envio(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(
            self.url,
            {"remover_imagens": [self.img1.id], "fotos": [criar_imagem("nova.png")]},
            format="multipart",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        self.assertFalse(self.animal.imagens.filter(id=self.img1.id).exists())
        self.assertEqual(self.animal.imagens.count(), 2)

    def test_patch_ids_de_outro_animal_sao_ignorados(self):
        outro = Animal.objects.create(
            nome_animal="Bidu",
            nome_doador="Zé",
            telefone="+5511922222222",
            especie=EspecieAnimal.CACHORRO,
            sexo=SexoAnimal.MACHO,
        )
        img_outro = AnimalImagem.objects.create(
            animal=outro, imagem=criar_imagem("outro.png"), ordem=0
        )
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(
            self.url, {"remover_imagens": [img_outro.id]}, format="multipart"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.data)
        # A imagem do outro animal não pode ter sido removida.
        self.assertTrue(AnimalImagem.objects.filter(id=img_outro.id).exists())


