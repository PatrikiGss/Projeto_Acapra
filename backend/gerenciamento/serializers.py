from rest_framework import serializers
from django.contrib.auth.models import User
from .models import PerfilAdministrativo


class PerfilAdministrativoSerializer(serializers.ModelSerializer):
    """
    Serializer responsável por transformar dados entre:

    JSON <-> Django Model

    ====================================================
    O QUE ESTE SERIALIZER FAZ
    ====================================================

    Ele recebe os dados enviados pelo frontend (POST, PUT, PATCH)
    e converte para objetos do Django.

    Também faz o contrário:
    pega dados do banco e devolve em JSON para a API.

    Exemplo:

    FRONT envia:

    {
        "nome": "João Silva",
        "email": "joao@email.com",
        "password": "123456",
        "cargo": "Administrador"
    }

    O serializer:

    1. cria o User nativo do Django
    2. criptografa a senha corretamente
    3. cria o PerfilAdministrativo vinculado

    ====================================================
    CAMPOS WRITE_ONLY
    ====================================================

    Esses campos chegam no backend,
    mas NÃO voltam na resposta da API.

    - nome
    - email
    - password

    Isso é importante principalmente para senha.

    Nunca retornamos password.

    ====================================================
    CAMPOS READ_ONLY
    ====================================================

    Esses campos são exibidos na resposta,
    mas não são enviados pelo frontend.

    - nome_usuario
    - email_usuario
    - data_promocao
    - id

    ====================================================
    OBSERVAÇÃO IMPORTANTE
    ====================================================

    O Django exige o campo username.

    Aqui usamos:

    username = email

    Ou seja:

    o email funciona como login interno,
    mas o frontend trabalha apenas com:

    - nome
    - email
    - password

    sem precisar lidar com username.
    """

    nome = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)

    nome_usuario = serializers.CharField(
        source="user.first_name",
        read_only=True
    )

    email_usuario = serializers.EmailField(
        source="user.email",
        read_only=True
    )

    class Meta:
        model = PerfilAdministrativo
        fields = [
            "id",
            "nome",
            "email",
            "password",
            "nome_usuario",
            "email_usuario",
            "cargo",
            "setor",
            "ativo",
            "data_promocao",
            "promovido_por",
            "observacoes",
        ]

        read_only_fields = [
            "id",
            "data_promocao",
            "nome_usuario",
            "email_usuario",
        ]

    def create(self, validated_data):
        """
        CREATE = POST

        Este método sobrescreve o padrão do DRF.

        Motivo:
        precisamos criar DUAS coisas:

        1. User (Django nativo)
        2. PerfilAdministrativo

        Primeiro criamos o User,
        depois vinculamos ao PerfilAdministrativo.

        IMPORTANTE:

        usamos create_user()
        e NÃO User.objects.create()

        porque create_user()
        faz a criptografia correta da senha.
        """

        nome = validated_data.pop("nome")
        email = validated_data.pop("email")
        password = validated_data.pop("password")

        user = User.objects.create_user(
            username=email,
            first_name=nome,
            email=email,
            password=password
        )

        perfil = PerfilAdministrativo.objects.create(
            user=user,
            **validated_data
        )

        return perfil

    def update(self, instance, validated_data):
        """
        UPDATE = PUT / PATCH

        Como nome, email e password
        pertencem ao model User
        e não ao PerfilAdministrativo,

        precisamos atualizar os dois models.

        Parte 1:
        atualiza User

        Parte 2:
        atualiza PerfilAdministrativo

        IMPORTANTE:

        senha usa:

        user.set_password()

        e NÃO:

        user.password = senha

        porque precisamos manter
        a criptografia segura.
        """

        user = instance.user

        nome = validated_data.pop("nome", None)
        email = validated_data.pop("email", None)
        password = validated_data.pop("password", None)

        if nome:
            user.first_name = nome

        if email:
            user.email = email
            user.username = email

        if password:
            user.set_password(password)

        user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        return instance