from django.views.generic import (
    ListView, DetailView, CreateView,
    UpdateView, DeleteView, View, FormView
)
from django.contrib.auth import authenticate, login
from django.urls import reverse_lazy
from django.contrib.messages.views import SuccessMessageMixin
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth import login, logout
from django.contrib.auth.views import LoginView
from django.shortcuts import redirect
from .models import Pet, Vet, Appointment, Owner, Specialization
from .forms import AppointmentForm, PetForm, OwnerRegistrationForm
from django.contrib import messages
from django.http import JsonResponse
from django import forms


def get_vets_by_specialization(request):
    specialization = request.GET.get('specialization', '')
    
    try:
        vets = Vet.objects.filter(
            specializations__name=specialization
        ).distinct().values('id', 'name')
        
        return JsonResponse({
            'vets': list(vets),
            'status': 'success'
        })
    except Exception as e:
        return JsonResponse({
            'vets': [],
            'status': 'error',
            'message': str(e)
        }, status=500)
    
class HomeView(ListView):
    model = Appointment
    template_name = 'clinic/home.html'
    context_object_name = 'appointments'
    ordering = ['-date']

class PetListView(LoginRequiredMixin, ListView):
    model = Pet
    template_name = 'clinic/pet_list.html'
    context_object_name = 'pets'

    def get_queryset(self):
        return Pet.objects.filter(owner=self.request.user)


class PetDetailView(DetailView):
    model = Pet
    template_name = 'clinic/pet_detail.html' 
    context_object_name = 'pet' 

class VetListView(LoginRequiredMixin, ListView):
    model = Vet
    template_name = 'clinic/vet_list.html'
    
    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('owner-login')
        return super().dispatch(request, *args, **kwargs)

class VetScheduleView(LoginRequiredMixin, DetailView):
    model = Vet
    template_name = 'clinic/vet_schedule.html'
    context_object_name = 'vet'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['appointments'] = Appointment.objects.filter(
            vet=self.object
        ).order_by('date')
        return context

class PetCreateView(LoginRequiredMixin, CreateView):
    model = Pet
    form_class = PetForm
    template_name = 'clinic/pet_form.html'
    success_url = reverse_lazy('pet-list')

    def form_valid(self, form):
        form.instance.owner = self.request.user
        return super().form_valid(form)

class PetUpdateView(LoginRequiredMixin, UpdateView):
    model = Pet
    form_class = PetForm  
    template_name = 'clinic/pet_form.html'
    success_url = reverse_lazy('pet-list')

    def get_queryset(self):
        return super().get_queryset().filter(owner=self.request.user)

class PetDeleteView(LoginRequiredMixin, DeleteView):
    model = Pet
    template_name = 'clinic/pet_confirm_delete.html'
    success_url = reverse_lazy('pet-list')

    def get_queryset(self):
        return super().get_queryset().filter(owner=self.request.user)

class AppointmentListView(LoginRequiredMixin, ListView):
    model = Appointment
    template_name = 'clinic/appointment_list.html'
    context_object_name = 'appointments'

    def get_queryset(self):
        return Appointment.objects.filter(pet__owner=self.request.user).order_by('date')


class AppointmentCreateView(LoginRequiredMixin, CreateView):
    model = Appointment
    form_class = AppointmentForm
    template_name = 'clinic/appointment_form.html'
    success_url = reverse_lazy('appointment-list')

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

    def form_valid(self, form):
        try:
            # This will trigger the clean() method
            response = super().form_valid(form)
            messages.success(self.request, 'Appointment created successfully!')
            return response
        except ValidationError as e:
            # If validation fails, add the error to the form
            form.add_error(None, e)
            return self.form_invalid(form)
    

class AppointmentUpdateView(LoginRequiredMixin, UpdateView):
    model = Appointment
    form_class = AppointmentForm
    template_name = 'clinic/appointment_form.html'
    success_url = reverse_lazy('appointment-list')

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

    def form_valid(self, form):
        messages.success(self.request, 'Appointment updated successfully!')
        return super().form_valid(form)

    def get_queryset(self):
        return super().get_queryset().filter(pet__owner=self.request.user)


class AppointmentDeleteView(LoginRequiredMixin, DeleteView):
    model = Appointment
    template_name = 'clinic/appointment_confirm_delete.html'
    success_url = reverse_lazy('appointment-list')

    def delete(self, request, *args, **kwargs):
        messages.success(self.request, 'Appointment cancelled successfully!')
        return super().delete(request, *args, **kwargs)

    def get_queryset(self):
        return super().get_queryset().filter(pet__owner=self.request.user)


class OwnerRegisterView(CreateView):
    form_class = OwnerRegistrationForm
    template_name = 'clinic/owner_register.html'
    success_url = reverse_lazy('clinic-home')

    def form_valid(self, form):
        user = form.save()
        
        username = form.cleaned_data.get('username')
        password = form.cleaned_data.get('password1')
        user = authenticate(username=username, password=password)
        
        if user is not None:
            login(self.request, user)
            messages.success(
                self.request,
                f'Welcome {user.get_full_name()}! Your account has been created successfully.'
            )

        
        return super().form_valid(form)

class OwnerLoginView(LoginView):
    template_name = 'clinic/owner_login.html'
    
    def get_success_url(self):
        next_url = self.request.GET.get('next')
        return next_url if next_url else reverse_lazy('clinic-home')

class OwnerLogoutView(View):
    def get(self, request):
        logout(request)
        return redirect('clinic-home')
    
class OwnerProfileView(LoginRequiredMixin, DetailView):
    template_name = 'clinic/owner_profile.html'
    
    def get_object(self):
        return self.request.user

class OwnerUpdateView(LoginRequiredMixin, UpdateView):
    model = Owner
    fields = ['first_name', 'last_name', 'email', 'phone', 'profile_picture']
    template_name = 'clinic/owner_form.html'
    success_url = reverse_lazy('owner-profile')
    
    def get_object(self):
        return self.request.user
    
class OwnerDeleteView(LoginRequiredMixin, DeleteView):
    model = Owner
    template_name = 'clinic/owner_confirm_delete.html'
    success_url = reverse_lazy('clinic-home')
    
    def get_object(self):
        return self.request.user
    
    def delete(self, request, *args, **kwargs):
        logout(request)
        return super().delete(request, *args, **kwargs)
