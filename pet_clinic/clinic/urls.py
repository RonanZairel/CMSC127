from django.urls import path
from django.contrib.auth import views as auth_views
from . import views
from .views import (
    HomeView, PetListView, PetDetailView,
    VetListView, AppointmentCreateView,
    AppointmentListView, AppointmentUpdateView,
    AppointmentDeleteView, PetCreateView, PetUpdateView,
    PetDeleteView,
    OwnerRegisterView, OwnerLoginView, OwnerLogoutView,
    OwnerProfileView, OwnerUpdateView, OwnerDeleteView, VetScheduleView, get_vets_by_specialization
)

urlpatterns = [
    path('', HomeView.as_view(), name='clinic-home'),
    
    # Authentication URLs
    path('register/', OwnerRegisterView.as_view(), name='owner-register'),
    path('login/', OwnerLoginView.as_view(), name='owner-login'),
    path('logout/', OwnerLogoutView.as_view(), name='owner-logout'),
    path('profile/', OwnerProfileView.as_view(), name='owner-profile'),
    path('profile/edit/', OwnerUpdateView.as_view(), name='owner-update'),
    path('profile/delete/', OwnerDeleteView.as_view(), name='owner-delete'),
    
    
    
    # Pet URLs
    path('pets/', PetListView.as_view(), name='pet-list'),
    path('pets/<int:pk>/', PetDetailView.as_view(), name='pet-detail'),
    path('pets/new/', PetCreateView.as_view(), name='pet-create'),
    path('pets/<int:pk>/edit/', PetUpdateView.as_view(), name='pet-update'),
    path('pets/<int:pk>/delete/', PetDeleteView.as_view(), name='pet-delete'),
    
    # Vet URLs
    path('vets/', VetListView.as_view(), name='vet-list'),
    path('vets/<int:pk>/schedule/', VetScheduleView.as_view(), name='vet-schedule'),

    
    # Appointment URLs
    path('appointments/new/', AppointmentCreateView.as_view(), name='appointment-create'),
    path('appointments/', AppointmentListView.as_view(), name='appointment-list'),
    path('appointments/<int:pk>/edit/', AppointmentUpdateView.as_view(), name='appointment-update'),
    path('appointments/<int:pk>/delete/', AppointmentDeleteView.as_view(), name='appointment-delete'),
    path('api/vets/', views.get_vets_by_specialization, name='api-vets'),

    


    
 
]