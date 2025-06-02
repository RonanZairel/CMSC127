# clinic/forms.py
from django import forms
from .models import Appointment, Pet, Vet
from django.contrib.auth.models import User


class AppointmentForm(forms.ModelForm):
    class Meta:
        model = Appointment
        fields = ['pet', 'vet', 'date', 'reason']
        
    def __init__(self, user, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['pet'].queryset = Pet.objects.filter(owner=user)