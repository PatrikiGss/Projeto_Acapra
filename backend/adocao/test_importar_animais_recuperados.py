"""
Testes do comando `importar_animais_recuperados`.

O comando recria animais a partir do texto das publicações antigas
(`dogs textos.txt`) e das fotos recuperadas. Como pode ser rodado de novo em
produção, o principal é não duplicar animais.
"""
import shutil
import tempfile
from io import StringIO
from pathlib import Path

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase, override_settings
from PIL import Image

from .models import Animal

TEXTO = """Rex está disponível para adoção!


Cachorro
Macho
Contato: +5549999990001


Dócil e brincalhão.



Mimi está disponível para adoção!
Gato
Fêmea
Contato: +5549999990002
Castrada e vacinada.

NINHADA está disponível para adoção!
Animal
Ambos
Contato: +5549999990003
Oito filhotes.

Rex está disponível para adoção!
Cachorro
Macho
Contato: +5549999990001
Publicação repetida do Rex.
"""


class ImportarAnimaisRecuperadosTests(TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)

        # Fotos salvas pelo comando vão para uma pasta temporária.
        media = override_settings(MEDIA_ROOT=str(self.tmp / "media"))
        media.enable()
        self.addCleanup(media.disable)

        self.texto = self.tmp / "dogs textos.txt"
        self.texto.write_text(TEXTO, encoding="utf-8")
        self.fotos = self.tmp / "dogs_recuperacao"
        self.fotos.mkdir()
        self.criar_foto("rex.jpg")
        self.criar_foto("mimi1.jpg")

    def criar_foto(self, nome):
        Image.new("RGB", (120, 120), (200, 120, 60)).save(self.fotos / nome, "JPEG")

    def importar(self, **opcoes):
        saida = StringIO()
        call_command(
            "importar_animais_recuperados",
            source_text=str(self.texto),
            photos_dir=str(self.fotos),
            stdout=saida,
            **opcoes,
        )
        return saida.getvalue()

    def test_cria_animais_com_especie_sexo_contato_e_foto(self):
        saida = self.importar()

        self.assertEqual(Animal.objects.count(), 3)

        rex = Animal.objects.get(nome_animal="Rex")
        self.assertEqual((rex.especie, rex.sexo), ("cachorro", "macho"))
        self.assertEqual(str(rex.telefone), "+5549999990001")
        self.assertEqual(rex.descricao, "Dócil e brincalhão.")
        self.assertEqual(rex.nome_doador, "ACAPRA")
        self.assertTrue(rex.disponivel)
        self.assertTrue(rex.foto)

        mimi = Animal.objects.get(nome_animal="Mimi")
        self.assertEqual((mimi.especie, mimi.sexo), ("gato", "femea"))
        self.assertTrue(mimi.foto)

        ninhada = Animal.objects.get(nome_animal="NINHADA")
        self.assertEqual((ninhada.especie, ninhada.sexo), ("outros", "ambos"))
        self.assertFalse(ninhada.foto)

        self.assertIn("Animais criados: 3", saida)
        self.assertIn("Fotos sem correspondencia: 1", saida)

    def test_publicacao_repetida_no_texto_vira_um_animal_so(self):
        saida = self.importar()

        self.assertEqual(Animal.objects.filter(nome_animal="Rex").count(), 1)
        self.assertIn("Duplicados descartados: 1", saida)

    def test_rodar_de_novo_nao_duplica_animais(self):
        self.importar()
        saida = self.importar()

        self.assertEqual(Animal.objects.count(), 3)
        self.assertIn("Animais criados: 0", saida)
        self.assertIn("Ja existentes ignorados: 3", saida)

    def test_nome_maior_que_30_caracteres_nao_duplica_ao_rodar_de_novo(self):
        nome = "Filhotes da ninhada do bairro Centro"
        self.texto.write_text(
            f"{nome} está disponível para adoção!\nCachorro\nMacho\n"
            "Contato: +5549999990009\nDescrição.\n",
            encoding="utf-8",
        )

        self.importar()
        self.importar()

        self.assertEqual(Animal.objects.count(), 1)
        self.assertEqual(Animal.objects.get().nome_animal, nome[:30])

    def test_dry_run_nao_grava_nada(self):
        saida = self.importar(dry_run=True)

        self.assertEqual(Animal.objects.count(), 0)
        self.assertIn("DRY-RUN", saida)

    def test_arquivo_de_texto_inexistente(self):
        with self.assertRaisesMessage(CommandError, "Arquivo nao encontrado"):
            call_command(
                "importar_animais_recuperados",
                source_text=str(self.tmp / "nao-existe.txt"),
                photos_dir=str(self.fotos),
                stdout=StringIO(),
            )

    def test_pasta_de_fotos_inexistente(self):
        with self.assertRaisesMessage(CommandError, "Pasta nao encontrada"):
            call_command(
                "importar_animais_recuperados",
                source_text=str(self.texto),
                photos_dir=str(self.tmp / "sem-fotos"),
                stdout=StringIO(),
            )

    def test_registro_incompleto_interrompe_sem_gravar(self):
        self.texto.write_text("Bob está disponível para adoção!\nCachorro\nMacho\n", encoding="utf-8")

        with self.assertRaisesMessage(CommandError, "Registro incompleto para Bob"):
            self.importar()
        self.assertEqual(Animal.objects.count(), 0)
