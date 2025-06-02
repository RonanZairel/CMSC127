from django.contrib import admin
from .models import Owner, Vet, Specialization, Pet, Appointment

admin.site.register(Owner)
admin.site.register(Vet)
admin.site.register(Specialization)
admin.site.register(Pet)
admin.site.register(Appointment)