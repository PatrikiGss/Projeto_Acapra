from django.contrib.auth.password_validation import validate_password
from django.core.validators import validate_email
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from .models import PerfilAdministrativo, Usuario
from .permissions import get_nivel_usuario


class UsuarioSerializer(serializers.ModelSerializer):
    """
    Serializer principal para criação e atualização de usuários.
    - Usa create_user para garantir hash da senha
    - Oculta a senha nas respostas (write_only)
    """

    class Meta:
        model = Usuario
        fields = ['id', 'nome', 'email', 'telefone', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }
    def validate_email(self, value):
        try:
            validate_email(value)
        except DjangoValidationError:
            raise serializers.ValidationError("Informe um e-mail válido.")
        return value.lower().strip()

    def validate_password(self, value):
        # Aplica validações do Django (tamanho, comum, numérica, etc)
        validate_password(value)
        return value

    def create(self, validated_data):
        """
        Cria usuário utilizando o manager customizado.
        """
        return Usuario.objects.create_user(**validated_data)

    def update(self, instance, validated_data):
        """
        Atualiza dados do usuário.
        Se senha for enviada, faz hash corretamente.
        """
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class UpdateUsuarioSerializer(serializers.ModelSerializer):
    """
    Serializer para atualização parcial de dados básicos do usuário.
    (sem alterar senha)
    """

    class Meta:
        model = Usuario
        fields = ['nome', 'telefone']


class PerfilAdministrativoSerializer(serializers.ModelSerializer):
    nivel_display = serializers.CharField(source="get_nivel_display", read_only=True)

    class Meta:
        model = PerfilAdministrativo
        fields = ["nivel", "nivel_display", "cargo", "setor", "ativo"]


class GetUsuarioSerializer(serializers.ModelSerializer):
    """
    Serializer para retorno de dados do usuário.
    Não expõe informações sensíveis.
    """

    perfil_admin = PerfilAdministrativoSerializer(read_only=True)

    class Meta:
        model = Usuario
        fields = ["id", "nome", "email", "telefone", "perfil_admin"]


class AdminUsuarioSerializer(serializers.ModelSerializer):
    perfil_admin = PerfilAdministrativoSerializer(read_only=True)

    class Meta:
        model = Usuario
        fields = ["id", "nome", "email", "telefone", "date_joined", "perfil_admin"]


class AtualizarPerfilAdministrativoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerfilAdministrativo
        fields = ["nivel", "cargo", "setor", "ativo", "observacoes"]

    def validate_nivel(self, value):
        niveis_validos = {choice[0] for choice in PerfilAdministrativo.Nivel.choices}
        if value not in niveis_validos:
            raise serializers.ValidationError("Nível administrativo inválido.")
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        usuario_alvo = self.instance.usuario

        if (
            request
            and usuario_alvo == request.user
            and attrs.get("nivel") == PerfilAdministrativo.Nivel.USUARIO
            and get_nivel_usuario(request.user) == PerfilAdministrativo.Nivel.DIRETOR_ACAPRA
        ):
            raise serializers.ValidationError(
                "O diretor não pode remover o próprio vínculo administrativo."
            )

        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        return value.lower().strip()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer para troca de senha.
    - Valida senha atual
    - Valida nova senha com regras do Django
    """

    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_old_password(self, value):
        """
        Verifica se a senha atual está correta.
        """
        user = self.context['request'].user

        if not user.check_password(value):
            raise serializers.ValidationError("Senha atual incorreta.")

        return value

    def validate_new_password(self, value):
        """
        Aplica validações de segurança do Django.
        """
        user = self.context['request'].user
        validate_password(value, user)
        return value

    def validate(self, attrs):
        """
        Garante que a nova senha seja diferente da antiga.
        """
        if attrs['old_password'] == attrs['new_password']:
            raise serializers.ValidationError(
                "A nova senha não pode ser igual à atual."
            )

        return attrs