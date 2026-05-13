from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Animal, EspecieAnimal, SexoAnimal
from .serializers import (
    AnimalSerializer,
    GetAnimalSerializer,
    UpdateAnimalSerializer,
)


User = get_user_model()


# =========================================================
# MODEL
# =========================================================
class AnimalModelTests(APITestCase):
    """Testes para o modelo Animal."""

    def setUp(self):
        self.animal = Animal.objects.create(
            nome_doador="João Silva",
            telefone="+5511999999999",
            especie=EspecieAnimal.CACHORRO,
            sexo=SexoAnimal.MACHO,
            descricao="Cachorro dócil",
        )

    def test_criacao_animal(self):
        """Animal é criado com os campos obrigatórios."""
        self.assertEqual(self.animal.nome_doador, "João Silva")
        self.assertEqual(self.animal.especie, "cachorro")
        self.assertEqual(self.animal.sexo, "macho")
        self.assertEqual(Animal.objects.count(), 1)

    def test_str_animal(self):
        """__str__ retorna 'nome_doador - especie'."""
        self.assertEqual(str(self.animal), "João Silva - cachorro")

    def test_campos_opcionais_aceitam_nulo(self):
        """foto e descricao podem ser nulos."""
        animal = Animal.objects.create(
            nome_doador="Maria",
            telefone="+5511988888888",
            especie=EspecieAnimal.GATO,
            sexo=SexoAnimal.FEMEA,
        )
        self.assertIsNone(animal.descricao)
        self.assertFalse(animal.foto)

    def test_choices_especie(self):
        """EspecieAnimal expõe cachorro, gato e outros."""
        valores = [c[0] for c in EspecieAnimal.choices]
        self.assertIn("cachorro", valores)
        self.assertIn("gato", valores)
        self.assertIn("outros", valores)

    def test_choices_sexo(self):
        """SexoAnimal expõe macho e femea."""
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
            "nome_doador": "Carlos",
            "telefone": "+5511977777777",
            "especie": EspecieAnimal.CACHORRO,
            "sexo": SexoAnimal.MACHO,
            "descricao": "Animal saudável",
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

    def test_get_serializer_oculta_telefone(self):
        """GetAnimalSerializer não deve expor telefone (privacidade)."""
        animal = Animal.objects.create(**self.dados_validos)
        serializer = GetAnimalSerializer(animal)
        self.assertNotIn("telefone", serializer.data)
        self.assertIn("nome_doador", serializer.data)
        self.assertIn("especie", serializer.data)

    def test_update_serializer_nao_inclui_telefone(self):
        """UpdateAnimalSerializer não permite alterar telefone."""
        self.assertNotIn("telefone", UpdateAnimalSerializer.Meta.fields)


# =========================================================
# VIEW: lista e criação
# =========================================================
class AnimaisViewTests(APITestCase):
    """Testes para /adocao/animais/."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="user@example.com",
            password="senha123",
            nome="Usuário Teste",
            telefone="+5511966666666",
        )
        self.url = reverse("adocao:animais")
        self.dados = {
            "nome_doador": "Fernanda",
            "telefone": "+5511955555555",
            "especie": EspecieAnimal.GATO,
            "sexo": SexoAnimal.FEMEA,
            "descricao": "Gata calma",
        }

    def test_get_lista_publica(self):
        """GET na lista é público (200)."""
        Animal.objects.create(**self.dados)
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

    def test_get_lista_vazia(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data, [])

    def test_get_lista_oculta_telefone(self):
        Animal.objects.create(**self.dados)
        resp = self.client.get(self.url)
        self.assertNotIn("telefone", resp.data[0])

    def test_get_lista_ordenada_por_id_desc(self):
        Animal.objects.create(
            nome_doador="A",
            telefone="+5511944444444",
            especie=EspecieAnimal.CACHORRO,
            sexo=SexoAnimal.MACHO,
        )
        Animal.objects.create(
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
            nome="Outro Usuário",
            telefone="+5511922222222",
        )
        self.animal = Animal.objects.create(
            nome_doador="Pedro",
            telefone="+5511911111111",
            especie=EspecieAnimal.CACHORRO,
            sexo=SexoAnimal.MACHO,
            descricao="Cão pequeno",
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

    def test_get_detalhes_oculta_telefone(self):
        resp = self.client.get(self.url)
        self.assertNotIn("telefone", resp.data)

    def test_get_pk_inexistente_retorna_404(self):
        resp = self.client.get(self.url_inexistente)
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

        # ---------- PATCH ----------
    def test_patch_sem_autenticacao_retorna_401(self):
        resp = self.client.patch(          # <-- put → patch
            self.url,
            {"nome_doador": "Atualizado"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_autenticado_atualiza_animal(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(          # <-- put → patch
           self.url,
            {"nome_doador": "Pedro Editado"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.animal.refresh_from_db()
        self.assertEqual(self.animal.nome_doador, "Pedro Editado")

    def test_patch_autenticado_dados_invalidos_retorna_400(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(          # <-- put → patch
            self.url,
            {"especie": "invalido"},
           format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_pk_inexistente_retorna_404(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(          # <-- put → patch
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