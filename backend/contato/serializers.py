from rest_framework import serializers
from .models import ContatoAcapra


class ContatoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContatoAcapra
        fields = '__all__'
