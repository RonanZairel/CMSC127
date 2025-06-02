from django.db import models
from django.contrib.auth.models import User

class Owner(models.Model):
    fname = models.CharField(max_length=100, verbose_name="First Name")
    minit = models.CharField(max_length=50, verbose_name="Middle Initial", blank=True)
    lname = models.CharField(max_length=100, verbose_name="Last Name")
    email = models.EmailField(verbose_name="Email")
    phone = models.CharField(max_length=15, verbose_name="Phone")

    def __str__(self):
        return f"{self.fname} {self.lname}"

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
    name = models.CharField(max_length=100, verbose_name="Pet Name")
    species = models.CharField(max_length=50, verbose_name="Species")
    breed = models.CharField(max_length=100, verbose_name="Breed")
    owner = models.ForeignKey(Owner, on_delete=models.CASCADE, related_name="pets")

    def __str__(self):
        return self.name

class Appointment(models.Model):
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name="appointments")
    vet = models.ForeignKey(Vet, on_delete=models.CASCADE, related_name="appointments")
    date = models.DateTimeField(verbose_name="Appointment Date")
    reason = models.CharField(max_length=200, verbose_name="Reason")

    def __str__(self):
        return f"{self.pet.name} with {self.vet.name} on {self.date}"