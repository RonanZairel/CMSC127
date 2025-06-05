from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.utils import timezone

class Owner(AbstractUser):
    phone = models.CharField(max_length=15, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)

    def __str__(self):
        return self.get_full_name() or self.username

    class Meta:
        verbose_name = "Owner"
        verbose_name_plural = "Owners"

    
class Vet(models.Model):
    name = models.CharField(max_length=100, verbose_name="Veterinarian Name")

    def __str__(self):
        return self.name

class Specialization(models.Model):
    vet = models.ForeignKey(Vet, on_delete=models.CASCADE, related_name="specializations")
    name = models.CharField(max_length=100, verbose_name="Specialization")

    def __str__(self):
        return f"{self.vet.name} - {self.name}"

class Pet(models.Model):
    owner = models.ForeignKey(Owner, on_delete=models.CASCADE, related_name='pets')
    name = models.CharField(max_length=100)
    species = models.CharField(max_length=50)  
    breed = models.CharField(max_length=100)
    photo = models.ImageField(upload_to='pet_photos/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Appointment(models.Model):
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name="appointments")
    vet = models.ForeignKey(Vet, on_delete=models.CASCADE, related_name="appointments")
    date = models.DateTimeField(verbose_name="Appointment Date")
    reason = models.CharField(max_length=200, verbose_name="Reason")

    def __str__(self):
        return f"{self.pet.name} with {self.vet.name} on {self.date}"
    
    class Meta:
        unique_together = ('vet', 'date')
        
    def clean(self):
        if hasattr(self, 'vet') and self.vet:
            if self.date and self.date <= timezone.now():
                raise ValidationError("Appointment date must be in the future")
            
            conflicting_appointments = Appointment.objects.filter(
                vet=self.vet,
                date=self.date
            ).exclude(pk=self.pk if self.pk else None)
            
            if conflicting_appointments.exists():
                raise ValidationError("This vet already has an appointment at this time")