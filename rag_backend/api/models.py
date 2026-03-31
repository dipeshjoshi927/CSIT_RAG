from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class AuthToken(models.Model):
    """Simple token-based authentication model"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='auth_tokens')
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Token for {self.user.username}"
    
    @staticmethod
    def generate_token():
        return uuid.uuid4().hex + uuid.uuid4().hex


class Conversation(models.Model):
    # Optional owner; null means guest / temporary conversation
    user = models.ForeignKey(
        User,
        related_name="conversations",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    # Optional title
    title = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        owner = self.user.username if self.user else "Guest"
        return f"{owner}: {self.title or 'Conversation'} - {self.created_at}"


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        related_name="messages",
        on_delete=models.CASCADE
    )
    role = models.CharField(max_length=20)  # 'user' or 'assistant'
    content = models.TextField()
    sources = models.JSONField(default=list, blank=True)  # Store source metadata for RAG
    is_greeting = models.BooleanField(default=False)  # Track if assistant response is a greeting
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.role} - {self.timestamp}"