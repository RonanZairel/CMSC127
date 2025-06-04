from django.views.generic import (
    ListView, DetailView, CreateView,
    UpdateView, DeleteView
)
from .models import Pet, Vet, Appointment
from django.urls import reverse_lazy
from django.contrib.messages.views import SuccessMessageMixin



class HomeView(ListView):
    model = Appointment
    template_name = 'clinic/home.html'
    context_object_name = 'appointments'
    ordering = ['-date']

class PetListView(ListView):
    model = Pet
    template_name = 'clinic/pet_list.html'

class PetDetailView(DetailView):
    model = Pet
    template_name = 'clinic/pet_detail.html' 
    context_object_name = 'pet' 

class VetListView(ListView):
    model = Vet
    template_name = 'clinic/vet_list.html'


class PetCreateView(CreateView):
    model = Pet
    fields = ['name', 'species', 'breed', 'owner']
    template_name = 'clinic/pet_form.html'
    success_url = reverse_lazy('pet-list')

class PetUpdateView(UpdateView):
    model = Pet
    fields = ['name', 'species', 'breed', 'owner']
    template_name = 'clinic/pet_form.html'
    success_url = reverse_lazy('pet-list')

class PetDeleteView(DeleteView):
    model = Pet
    template_name = 'clinic/pet_confirm_delete.html'
    success_url = reverse_lazy('pet-list')

class AppointmentListView(ListView):
    model = Appointment
    template_name = 'clinic/appointment_list.html'
    context_object_name = 'appointments'
    ordering = ['-date']
    paginate_by = 10

class AppointmentCreateView(SuccessMessageMixin, CreateView):
    model = Appointment
    fields = ['pet', 'vet', 'date', 'reason']
    template_name = 'clinic/appointment_form.html'
    success_url = reverse_lazy('appointment-list')
    success_message = "Appointment was created successfully!"

class AppointmentUpdateView(SuccessMessageMixin, UpdateView):
    model = Appointment
    fields = ['pet', 'vet', 'date', 'reason']
    template_name = 'clinic/appointment_form.html'
    success_url = reverse_lazy('appointment-list')
    success_message = "Appointment was updated successfully!"

class AppointmentDeleteView(SuccessMessageMixin, DeleteView):
    model = Appointment
    template_name = 'clinic/appointment_confirm_delete.html'
    success_url = reverse_lazy('appointment-list')
    success_message = "Appointment was deleted successfully."

    def delete(self, request, *args, **kwargs):
        messages.success(self.request, self.success_message)
        return super().delete(request, *args, **kwargs)