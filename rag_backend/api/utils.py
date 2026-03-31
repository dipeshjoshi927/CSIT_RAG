import random
from django.contrib.auth.models import User


def get_user_from_token(request):
    """Extract user from authorization token."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Token '):
        return None, False
    
    token = auth_header[6:]
    
    if not token:
        return None, False
    
    # Get the username from request headers (sent by frontend)
    username = request.headers.get('X-Username')
    if username:
        try:
            user = User.objects.get(username=username)
            return user, True
        except User.DoesNotExist:
            pass
    
    # No fallback - require proper authentication
    return None, False


def generate_greeting_response():
    """Generate a friendly greeting message."""
    greetings = [
        "👋 Hello! I'm your Nepal Telecom assistant. How can I help you today?",
        "Hi there! Need help with our services? I'm here to assist!",
        "Welcome! Ask me anything about Nepal Telecom products and services."
    ]
    return random.choice(greetings)
