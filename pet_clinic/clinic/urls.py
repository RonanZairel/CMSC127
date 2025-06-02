from django.urls import path
from .views import (
    HomeView, PetListView, PetDetailView, 
    VetListView, AppointmentCreateView,
    AppointmentListView, AppointmentUpdateView, 
    AppointmentDeleteView, PetCreateView,PetUpdateView,
    PetDeleteView
)

urlpatterns = [
    path('', HomeView.as_view(), name='clinic-home'),
    path('pets/', PetListView.as_view(), name='pet-list'),
    path('pets/<int:pk>/', PetDetailView.as_view(), name='pet-detail'),
    path('pets/new/', PetCreateView.as_view(), name='pet-create'),
    path('pets/<int:pk>/edit/', PetUpdateView.as_view(), name='pet-update'),
    path('pets/<int:pk>/delete/', PetDeleteView.as_view(), name='pet-delete'),
    path('vets/', VetListView.as_view(), name='vet-list'),
    path('appointments/new/', AppointmentCreateView.as_view(), name='appointment-create'),
    path('appointments/', AppointmentListView.as_view(), name='appointment-list'),
    path('appointments/<int:pk>/edit/', AppointmentUpdateView.as_view(), name='appointment-update'),
    path('appointments/<int:pk>/delete/', AppointmentDeleteView.as_view(), name='appointment-delete'),
]