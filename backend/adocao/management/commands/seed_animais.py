import os
from django.core.management.base import BaseCommand
from django.core.files import File
from adocao.models import Animal

FOTOS_DIR = os.path.join(
    os.path.dirname(__file__),
    "../../../../",
    "dogs e cats",
)

ANIMAIS = [
    {
        "nome_animal": "Laranjinha",
        "nome_doador": "Carlos Mendes",
        "telefone": "+554991234567",
        "especie": "gato",
        "sexo": "macho",
        "disponivel": True,
        "descricao": "Laranjinha é um gato laranja bem curioso e carinhoso. Adora ficar pertinho de quem ele gosta e nunca perde a chance de dar uma boa ronronada.",
        "foto": "10bcbdc51fdacda178fbf70267e19251.jpg",
    },
    {
        "nome_animal": "Bidu",
        "nome_doador": "Maria Santos",
        "telefone": "+554987654321",
        "especie": "cachorro",
        "sexo": "macho",
        "disponivel": True,
        "descricao": "Bidu é um vira-lata caramelo cheio de energia e personalidade. Foi encontrado nas ruas mas já mostrou que tem muito amor para dar.",
        "foto": "19.03.2021_Resgatei_um_animal_abandonado_e_agora_Pixabay.jpg",
    },
    {
        "nome_animal": "Meg",
        "nome_doador": "João Ferreira",
        "telefone": "+554992345678",
        "especie": "cachorro",
        "sexo": "femea",
        "disponivel": True,
        "descricao": "Meg é uma filhote docinha que foi resgatada com apenas dois meses. É muito dócil com crianças e se adapta bem a qualquer lar.",
        "foto": "19.03.2024-Resgate-Animais-Bairro-Sao-Jose-Renan-Caumo-39.jpg",
    },
    {
        "nome_animal": "Caneco",
        "nome_doador": "Ana Lima",
        "telefone": "+554993456789",
        "especie": "gato",
        "sexo": "macho",
        "disponivel": False,
        "descricao": "Caneco é um gato laranjão bem estrelinha — só acorda de manhã depois do café. Foi adotado por uma família amorosa em São Joaquim.",
        "foto": "42033722deefe4f5e249107f56e26cbe.jpg",
    },
    {
        "nome_animal": "Thor",
        "nome_doador": "Pedro Souza",
        "telefone": "+554982345671",
        "especie": "cachorro",
        "sexo": "macho",
        "disponivel": True,
        "descricao": "Thor é um filhote de beagle com olhinhos expressivos que derretem qualquer coração. Brincalhão e cheio de vida, vai animar qualquer casa.",
        "foto": "474cd415548ff05e61d4a67a80fced63.jpg",
    },
    {
        "nome_animal": "Professor",
        "nome_doador": "Fernanda Costa",
        "telefone": "+554994567890",
        "especie": "cachorro",
        "sexo": "macho",
        "disponivel": False,
        "descricao": "O Professor já encontrou um lar! Com seu jeito inteligente e calmo, não demorou muito para ser adotado por um casal que o adora.",
        "foto": "7987ab4b9a6f127638d2a8abbf8631c0.jpg",
    },
    {
        "nome_animal": "Mel",
        "nome_doador": "Ricardo Oliveira",
        "telefone": "+554983456782",
        "especie": "cachorro",
        "sexo": "femea",
        "disponivel": True,
        "descricao": "Mel é uma filhotinha dourada com olhos fundos e expressivos. Muito carinhosa e tranquila, ideal para quem busca uma companheira fiel.",
        "foto": "8daa114dd4e99a2f8c5d7779960acbd0.jpg",
    },
    {
        "nome_animal": "Brasa",
        "nome_doador": "Lucia Pereira",
        "telefone": "+554995678901",
        "especie": "gato",
        "sexo": "femea",
        "disponivel": True,
        "descricao": "Brasa é uma gatinha filhote laranjinha um pouco tímida no começo, mas que logo conquista com seu jeito carinhoso e curioso.",
        "foto": "c7ebdefa17c4b0b68aa73a8e89b531e7.jpg",
    },
    {
        "nome_animal": "Farofa",
        "nome_doador": "Paulo Alves",
        "telefone": "+554984567893",
        "especie": "cachorro",
        "sexo": "macho",
        "disponivel": True,
        "descricao": "Farofa ficou muito tempo aguardando uma família. É um cachorrão bem animado que convive bem com outros animais e adora brincar.",
        "foto": "download.jpeg",
    },
    {
        "nome_animal": "Valente",
        "nome_doador": "Sandra Ribeiro",
        "telefone": "+554996789012",
        "especie": "cachorro",
        "sexo": "macho",
        "disponivel": True,
        "descricao": "Valente foi resgatado de uma situação difícil mas superou tudo com garra. Hoje está saudável, vacinado e pronto para ter um lar.",
        "foto": "images (1).jpeg",
    },
    {
        "nome_animal": "Bravo",
        "nome_doador": "Marcos Vieira",
        "telefone": "+554985678904",
        "especie": "cachorro",
        "sexo": "macho",
        "disponivel": False,
        "descricao": "Bravo é um pastor alemão que já encontrou seu lar. Leal e protetor, foi adotado por uma família que sempre sonhou com um cão desse porte.",
        "foto": "images.jpeg",
    },
]


class Command(BaseCommand):
    help = "Popula o banco com animais de exemplo para adoção"

    def add_arguments(self, parser):
        parser.add_argument(
            "--limpar",
            action="store_true",
            help="Remove todos os animais existentes antes de inserir",
        )

    def handle(self, *args, **options):
        if options["limpar"]:
            count = Animal.objects.count()
            Animal.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"{count} animal(is) removido(s)."))

        fotos_path = os.path.abspath(FOTOS_DIR)
        if not os.path.isdir(fotos_path):
            self.stderr.write(self.style.ERROR(f"Pasta de fotos não encontrada: {fotos_path}"))
            return

        criados = 0
        ignorados = 0

        for dados in ANIMAIS:
            telefone = dados["telefone"]

            if Animal.objects.filter(telefone=telefone).exists():
                self.stdout.write(f"  Ignorado (já existe): {dados['nome_animal']}")
                ignorados += 1
                continue

            foto_path = os.path.join(fotos_path, dados["foto"])
            if not os.path.isfile(foto_path):
                self.stderr.write(self.style.WARNING(f"  Foto não encontrada, pulando: {dados['foto']}"))
                ignorados += 1
                continue

            with open(foto_path, "rb") as foto_file:
                animal = Animal(
                    nome_animal=dados["nome_animal"],
                    nome_doador=dados["nome_doador"],
                    telefone=telefone,
                    especie=dados["especie"],
                    sexo=dados["sexo"],
                    disponivel=dados["disponivel"],
                    descricao=dados["descricao"],
                )
                animal.foto.save(dados["foto"], File(foto_file), save=True)

            status = "disponível" if dados["disponivel"] else "adotado"
            self.stdout.write(self.style.SUCCESS(f"  Criado: {dados['nome_animal']} ({dados['especie']}, {status})"))
            criados += 1

        self.stdout.write(self.style.SUCCESS(f"\n{criados} animal(is) criado(s), {ignorados} ignorado(s)."))
