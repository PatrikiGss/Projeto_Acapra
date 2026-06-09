import uuid
from django.db import models
from django.conf import settings


class MetaOAuthState(models.Model):
    state = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='meta_oauth_states',
    )
    user_access_token = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"OAuthState({self.user_id}, {self.state})"


class MetaConnection(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='meta_connections',
    )
    page_id = models.CharField(max_length=50)
    page_name = models.CharField(max_length=100)
    page_access_token = models.TextField()
    instagram_id = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [('user', 'page_id')]

    def __str__(self):
        return f"{self.page_name} ({self.user})"
