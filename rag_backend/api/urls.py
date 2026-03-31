from django.urls import path
from .views import (
    QueryAPIView,
    ConversationListAPIView,
    ConversationDetailAPIView,
    SignupAPIView,
    LoginAPIView,
    LogoutAPIView,
    UserAPIView,
)

urlpatterns = [
    path("query/", QueryAPIView.as_view()),
    path("conversations/", ConversationListAPIView.as_view()),
    path("conversations/<int:conversation_id>/", ConversationDetailAPIView.as_view()),
    path("auth/signup/", SignupAPIView.as_view()),
    path("auth/login/", LoginAPIView.as_view()),
    path("auth/logout/", LogoutAPIView.as_view()),
    path("auth/user/", UserAPIView.as_view()),
]