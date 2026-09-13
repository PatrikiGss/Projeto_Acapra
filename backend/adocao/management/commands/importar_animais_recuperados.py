import re
from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand, CommandError

from adocao.models import Animal


class Command(BaseCommand):
    help = "Importa animais de dogs textos.txt e suas fotos de dogs_recuperacao."

    def add_arguments(self, parser):
        parser.add_argument(
            "--source-text",
            default="dogs textos.txt",
            help="Arquivo de texto com os registros dos animais.",
        )
        parser.add_argument(
            "--photos-dir",
            default="dogs_recuperacao",
            help="Pasta com as fotos recuperadas.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Mostra a importacao sem gravar no banco.",
        )

    def handle(self, *args, **options):
        source_text = Path(options["source_text"])
        photos_dir = Path(options["photos_dir"])
        if not source_text.is_file():
            raise CommandError(f"Arquivo nao encontrado: {source_text}")
        if not photos_dir.is_dir():
            raise CommandError(f"Pasta nao encontrada: {photos_dir}")

        registros = self._ler_registros(source_text)
        registros, duplicados = self._deduplicar(registros)
        fotos = self._indexar_fotos(photos_dir)
        dry_run = options["dry_run"]
        criados = 0
        ignorados = 0
        sem_foto = 0

        self.stdout.write(f"Registros no texto: {len(registros) + len(duplicados)}")
        self.stdout.write(f"Duplicados descartados: {len(duplicados)}")
        self.stdout.write(f"Registros unicos: {len(registros)}")

        for indice, registro in enumerate(registros, start=1):
            chave = self._chave(registro["nome"], registro["telefone"])
            if Animal.objects.filter(
                nome_animal__iexact=registro["nome"],
                telefone=registro["telefone"],
            ).exists():
                self.stdout.write(f"{indice:02d}. IGNORADO (ja existe): {registro['nome']} | {registro['telefone']}")
                ignorados += 1
                continue

            foto_path = self._proxima_foto(fotos, registro["nome"])
            foto_nome = foto_path.name if foto_path else "SEM FOTO"
            self.stdout.write(
                f"{indice:02d}. {registro['nome']} | {registro['telefone']} | "
                f"{registro['especie']}/{registro['sexo']} | {foto_nome}"
            )
            if foto_path is None:
                sem_foto += 1

            if dry_run:
                continue

            animal = Animal(
                nome_animal=registro["nome"][:30],
                nome_doador="ACAPRA",
                telefone=registro["telefone"],
                especie=registro["especie"],
                sexo=registro["sexo"],
                descricao=registro["descricao"][:500],
                disponivel=True,
            )
            if foto_path:
                with foto_path.open("rb") as foto_file:
                    animal.foto.save(foto_path.name, File(foto_file), save=False)
            animal.save()
            criados += 1

        self.stdout.write(f"Fotos sem correspondencia: {sem_foto}")
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY-RUN: nenhum registro foi gravado."))
        else:
            self.stdout.write(self.style.SUCCESS(f"Animais criados: {criados}"))
            self.stdout.write(f"Ja existentes ignorados: {ignorados}")

    @staticmethod
    def _chave(nome, telefone):
        telefone_normalizado = re.sub(r"\D", "", telefone)
        return nome.casefold().strip(), telefone_normalizado

    def _ler_registros(self, source_text):
        linhas = source_text.read_text(encoding="utf-8-sig").splitlines()
        registros = []
        indice = 0
        cabecalho = re.compile(r"^(.+?)\s+está disponível para adoção!$", re.IGNORECASE)
        while indice < len(linhas):
            match = cabecalho.match(linhas[indice].strip())
            if not match:
                indice += 1
                continue

            campos = []
            proximo = indice + 1
            while proximo < len(linhas) and len(campos) < 4:
                valor = linhas[proximo].strip()
                if valor:
                    campos.append(valor)
                proximo += 1
            if len(campos) < 4:
                raise CommandError(f"Registro incompleto para {match.group(1)}")

            especie = {
                "cachorro": "cachorro",
                "gato": "gato",
                "animal": "outros",
            }.get(campos[0].casefold(), "outros")
            sexo = {
                "macho": "macho",
                "fêmea": "femea",
                "ambos": "ambos",
            }.get(campos[1].casefold(), "ambos")
            telefone = campos[2].split(":", 1)[-1].strip()
            registros.append(
                {
                    "nome": match.group(1).strip(),
                    "telefone": telefone,
                    "especie": especie,
                    "sexo": sexo,
                    "descricao": campos[3],
                }
            )
            indice = proximo
        return registros

    def _deduplicar(self, registros):
        vistos = set()
        unicos = []
        duplicados = []
        for registro in registros:
            chave = self._chave(registro["nome"], registro["telefone"])
            if chave in vistos:
                duplicados.append(registro)
                continue
            vistos.add(chave)
            unicos.append(registro)
        return unicos, duplicados

    @staticmethod
    def _indexar_fotos(photos_dir):
        fotos = {}
        for foto in photos_dir.iterdir():
            if foto.is_file() and foto.suffix.casefold() in {".jpg", ".jpeg", ".png", ".webp"}:
                base = re.sub(r"\d+$", "", foto.stem).casefold()
                fotos.setdefault(base, []).append(foto)
        for base, itens in fotos.items():
            itens.sort(key=lambda item: (0 if item.stem.casefold() == base else 1, len(item.stem), item.stem.casefold()))
        return fotos

    @staticmethod
    def _proxima_foto(fotos, nome):
        base = nome.casefold().strip()
        candidatos = fotos.get(base, [])
        return candidatos.pop(0) if candidatos else None
