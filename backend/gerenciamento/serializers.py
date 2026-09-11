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
        if len(value) > 128:
            raise serializers.ValidationError("A senha não pode ter mais de 128 caracteres.")
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

        Nivel = PerfilAdministrativo.Nivel

        # Valores que ficariam após a edição (mantém o atual se o campo não veio).
        nivel_atual = self.instance.nivel
        ativo_atual = self.instance.ativo
        novo_nivel = attrs.get("nivel", nivel_atual)
        novo_ativo = attrs.get("ativo", ativo_atual)

        # O resultado final preserva um diretor ativo?
        continua_diretor_ativo = novo_nivel == Nivel.DIRETOR_ACAPRA and novo_ativo

        # 1) Um diretor não pode remover/reduzir o próprio vínculo: rebaixar para
        #    qualquer nível OU se autodesativar travaria o acesso ao painel
        #    (só o diretor possui o módulo de gerenciamento de usuários).
        if (
            request
            and usuario_alvo == request.user
            and get_nivel_usuario(request.user) == Nivel.DIRETOR_ACAPRA
            and not continua_diretor_ativo
        ):
            raise serializers.ValidationError(
                "O diretor não pode remover ou reduzir o próprio vínculo administrativo."
            )

        # 2) Não permitir rebaixar/desativar o último diretor ativo do sistema,
        #    o que deixaria a gestão de usuários permanentemente inacessível.
        era_diretor_ativo = nivel_atual == Nivel.DIRETOR_ACAPRA and ativo_atual
        if era_diretor_ativo and not continua_diretor_ativo:
            outros_diretores_ativos = (
                PerfilAdministrativo.objects.filter(
                    nivel=Nivel.DIRETOR_ACAPRA,
                    ativo=True,
                )
                .exclude(pk=self.instance.pk)
                .exists()
            )
            if not outros_diretores_ativos:
                raise serializers.ValidationError(
                    "Não é possível rebaixar ou desativar o último diretor ativo do sistema."
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
        if len(value) > 128:
            raise serializers.ValidationError("A senha não pode ter mais de 128 caracteres.")
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