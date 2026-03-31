import secrets
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Conversation, Message
from .utils import get_user_from_token

# Constants
MAX_MESSAGE_LENGTH = 4000  # Max characters for user messages


# Lazy load rag_engine to avoid import issues
def get_rag_engine():
    from .rag_engine import RAGEngine
    return RAGEngine()


class SignupAPIView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username', '')
        password = request.data.get('password', '')
        email = request.data.get('email', '')
        
        if not username or not password:
            return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(password) < 8:
            return Response({'error': 'Password must be at least 8 characters long'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.create_user(username=username, password=password, email=email)
        token = secrets.token_hex(32)
        return Response({'token': token, 'user': {'id': user.id, 'username': user.username, 'email': user.email}}, status=status.HTTP_201_CREATED)


class LoginAPIView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        user = authenticate(username=request.data.get('username'), password=request.data.get('password'))
        if not user:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        token = secrets.token_hex(32)
        return Response({'token': token, 'user': {'id': user.id, 'username': user.username, 'email': user.email}})


class LogoutAPIView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        return Response({'message': 'Logged out successfully'})


class UserAPIView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        user, _ = get_user_from_token(request)
        if not user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response({'id': user.id, 'username': user.username, 'email': user.email})


class QueryAPIView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        user, _ = get_user_from_token(request)
        if not user:
            return Response({'error': 'Authentication required. Please login first.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user_message = request.data.get('message', '').strip()
        new_chat = request.data.get('new_chat', False)
        conversation_id = request.data.get('conversation_id')
        
        if not user_message:
            return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(user_message) > MAX_MESSAGE_LENGTH:
            return Response({'error': f'Message exceeds maximum length of {MAX_MESSAGE_LENGTH} characters'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Determine which conversation to use
            if new_chat or not conversation_id:
                conversation = Conversation.objects.create(user=user)
            else:
                try:
                    conversation = Conversation.objects.get(id=conversation_id, user=user)
                except Conversation.DoesNotExist:
                    conversation = Conversation.objects.create(user=user)
            
            # Set title based on first user message if not set
            if not conversation.title:
                conversation.title = user_message[:50] + ('...' if len(user_message) > 50 else '')
                conversation.save()
            
            Message.objects.create(conversation=conversation, role='user', content=user_message)
            
            # Get RAG engine response
            try:
                rag_engine = get_rag_engine()
                result = rag_engine.query(user_message)
                response_text = result.get('answer', '')
                sources = result.get('sources', [])
            except Exception as e:
                import traceback
                print(f"RAG Engine Error: {str(e)}")
                print(traceback.format_exc())
                response_text = "I apologize, but I encountered an error processing your request. Please try again."
                sources = []
            
            Message.objects.create(conversation=conversation, role='assistant', content=response_text, sources=sources)
            
            return Response({
                'conversation_id': conversation.id,
                'conversation_title': conversation.title,
                'user_message': {'role': 'user', 'content': user_message},
                'assistant_message': {'role': 'assistant', 'content': response_text, 'sources': sources}
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get(self, request):
        user, _ = get_user_from_token(request)
        if not user:
            return Response({'error': 'Unauthorized'}, status=401)
        conversation = Conversation.objects.filter(user=user).first()
        if not conversation:
            return Response({'messages': []})
        messages = list(conversation.messages.values('role', 'content', 'sources', 'is_greeting'))
        return Response({'messages': messages})


class ConversationListAPIView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        user, _ = get_user_from_token(request)
        if not user:
            return Response({'error': 'Unauthorized'}, status=401)
        conversations = Conversation.objects.filter(user=user).order_by('-created_at')
        return Response([{'id': c.id, 'title': c.title, 'created_at': c.created_at} for c in conversations])


class ConversationDetailAPIView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, conversation_id):
        user, _ = get_user_from_token(request)
        if not user:
            return Response({'error': 'Unauthorized'}, status=401)
        try:
            conversation = Conversation.objects.get(id=conversation_id, user=user)
            messages = list(conversation.messages.values('role', 'content', 'sources', 'is_greeting'))
            return Response({'messages': messages})
        except Conversation.DoesNotExist:
            return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)
