from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

urlpatterns = [
    path("admin/", admin.site.urls),

    # RAG API
    path("api/", include("api.urls")), 
    path("", lambda request: JsonResponse({"status": "RAG backend running"})),
]