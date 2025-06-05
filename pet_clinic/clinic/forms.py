from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.core.exceptions import ValidationError
from .models import Appointment, Pet, Owner, Specialization, Vet
from django.utils import timezone


class OwnerRegistrationForm(UserCreationForm):
    first_name = forms.CharField(
        max_length=100,
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'First Name'
        })
    )
    last_name = forms.CharField(
        max_length=100,
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Last Name'
        })
    )
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'Email'
        })
    )
    phone = forms.CharField(
        max_length=15,
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Phone Number'
        })
    )

    class Meta:
        model = Owner
        fields = [
            'username',
            'first_name',
            'last_name',
            'email',
            'phone',
            'password1',
            'password2'
        ]
        widgets = {
            'username': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Username'
            }),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['password1'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Password'
        })
        self.fields['password2'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Confirm Password'
        })


class PetForm(forms.ModelForm):
    SPECIES_CHOICES = [
        ('', 'Select or type species'),
        ('Dog', 'Dog'),
        ('Cat', 'Cat'),
        ('Rabbit', 'Rabbit'),
        ('Bird', 'Bird'),
        ('Hamster', 'Hamster'),
        ('Other', 'Other (specify below)'),
    ]

    species = forms.ChoiceField(
        choices=SPECIES_CHOICES,
        required=True,
        widget=forms.Select(attrs={
            'class': 'form-control',
            'id': 'species-select'
        })
    )
    
    custom_species = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control mt-2',
            'id': 'custom-species',
            'placeholder': 'Enter custom species',
            'style': 'display: none;'
        }),
        label=""
    )

    class Meta:
        model = Pet
        fields = ['name', 'species', 'custom_species', 'breed', 'photo']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'breed': forms.TextInput(attrs={'class': 'form-control'}),
            'photo': forms.FileInput(attrs={'class': 'form-control'})
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk and self.instance.species not in dict(self.SPECIES_CHOICES).values():
            self.fields['custom_species'].initial = self.instance.species
            self.fields['custom_species'].widget.attrs['style'] = 'display: block;'
            self.fields['species'].initial = 'Other'

    def clean(self):
        cleaned_data = super().clean()
        species = cleaned_data.get('species')
        custom_species = cleaned_data.get('custom_species')
        
        if species == 'Other' and not custom_species:
            self.add_error('custom_species', 'Please specify the species')
        elif species == 'Other':
            cleaned_data['species'] = custom_species
            
        return cleaned_data




class AppointmentForm(forms.ModelForm):
    REASON_CHOICES = [
        ('', 'Select a reason'),
        ('Surgery', 'Surgery'),
        ('Emergency Care', 'Emergency Care'),
        ('Dental Cleaning', 'Dental Cleaning'),
        ('Vaccination', 'Vaccination'),
        ('Check-up', 'Check-up'),
        ('Dermatology', 'Dermatology'),
    ]

    reason = forms.ChoiceField(
        choices=REASON_CHOICES,
        widget=forms.Select(attrs={
            'class': 'form-control',
            'required': 'required'
        })
    )

    vet_id = forms.IntegerField(
        required=True,
        widget=forms.HiddenInput()
    )

    class Meta:
        model = Appointment
        fields = ['pet', 'date', 'reason']
        widgets = {
            'date': forms.DateTimeInput(attrs={
                'type': 'datetime-local',
                'class': 'form-control',
                'required': 'required'
            }),
        }

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        
        if user:
            self.fields['pet'].queryset = user.pets.all()
            self.fields['pet'].widget.attrs.update({
                'class': 'form-control',
                'required': 'required'
            })

    def clean(self):
        cleaned_data = super().clean()
        vet_id = cleaned_data.get('vet_id')
        reason = cleaned_data.get('reason')

        if not vet_id:
            raise ValidationError("Please select a veterinarian")
        
        try:
            vet = Vet.objects.get(pk=vet_id)
            cleaned_data['vet'] = vet
            
            # Validate specialization
            required_spec = self.get_specialization_for_reason(reason)
            if not vet.specializations.filter(name=required_spec).exists():
                raise ValidationError("Selected vet does not specialize in this service")
                
        except Vet.DoesNotExist:
            raise ValidationError("Invalid veterinarian selected")

        return cleaned_data

    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.vet_id = self.cleaned_data['vet_id']
        if commit:
            instance.save()
        return instance

    def get_specialization_for_reason(self, reason):
        reason_to_spec = {
            'Surgery': 'Surgery',
            'Emergency Care': 'Emergency Care',
            'Dental Cleaning': 'Dentistry',
            'Vaccination': 'General Practice',
            'Check-up': 'General Practice',
            'Dermatology': 'Dermatology'
        }
        return reason_to_spec.get(reason)