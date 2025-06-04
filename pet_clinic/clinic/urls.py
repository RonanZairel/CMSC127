from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),  # This will be our main frontend page
    path('api/register/', views.register_user, name='register_user'),
    path('api/login/', views.login_user, name='login_user'),
    path('api/logout/', views.logout_user, name='logout_user'),
    path('api/pets/', views.get_pets, name='get_pets'),
    path('api/pets/add/', views.add_pet, name='add_pet'),
    path('api/pets/update/<int:pet_id>/', views.update_pet, name='update_pet'),
    path('api/pets/delete/<int:pet_id>/', views.delete_pet, name='delete_pet'),
    path('api/vets/', views.get_vets, name='get_vets'),
    path('api/appointments/', views.get_appointments, name='get_appointments'),
    path('api/appointments/book/', views.book_appointment, name='book_appointment'),
    path('api/appointments/<int:appointment_id>/update-status/', views.update_appointment_status, name='update_appointment_status'),
    path('api/appointments/<int:appointment_id>/update/', views.update_appointment, name='update_appointment'),
    path('api/appointments/<int:appointment_id>/cancel/', views.cancel_appointment, name='cancel_appointment'),
    path('api/appointments/<int:appointment_id>/delete/', views.delete_appointment, name='delete_appointment'),
    path('api/users/', views.get_users, name='get_users'),
]