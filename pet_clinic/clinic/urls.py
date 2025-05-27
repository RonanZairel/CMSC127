from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='clinic-home'),
    path('about/', views.about, name='clinic-about'),
]
