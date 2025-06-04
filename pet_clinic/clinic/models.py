from django.db import models
from django.contrib.auth.models import User

class Owner(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True)
    fname = models.CharField(max_length=50)
    minit = models.CharField(max_length=1, blank=True)
    lname = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15)

    def __str__(self):
        return f"{self.fname} {self.lname}"

    def delete(self, *args, **kwargs):
        # Delete associated pets first
        self.pets.all().delete()
        # Then delete the owner
        super().delete(*args, **kwargs)

class Vet(models.Model):
    name = models.CharField(max_length=100)
    specializations = models.ManyToManyField('Specialization')
    experience = models.IntegerField(default=0, help_text="Years of experience")
    bio = models.TextField(default="No bio available")

    def __str__(self):
        return self.name

class Specialization(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Pet(models.Model):
    SPECIES_CHOICES = [
        ('dog', 'Dog'),
        ('cat', 'Cat'),
        ('bird', 'Bird'),
        ('rabbit', 'Rabbit'),
        ('other', 'Other')
    ]

    name = models.CharField(max_length=100)
    species = models.CharField(max_length=10, choices=SPECIES_CHOICES)
    breed = models.CharField(max_length=100)
    age = models.IntegerField(null=True, blank=True, help_text="Age in years")
    owner = models.ForeignKey(Owner, on_delete=models.CASCADE, related_name='pets')

    def __str__(self):
        return f"{self.name} ({self.get_species_display()})"

class Appointment(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ]

    pet = models.ForeignKey(Pet, on_delete=models.CASCADE)
    vet = models.ForeignKey(Vet, on_delete=models.CASCADE)
    date = models.DateTimeField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='confirmed')

    def __str__(self):
        return f"{self.pet.name} with {self.vet.name} on {self.date}"