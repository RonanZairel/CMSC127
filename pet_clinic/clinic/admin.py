from django.contrib import admin
from .models import Owner, Vet, Specialization, Pet, Appointment

@admin.register(Owner)
class OwnerAdmin(admin.ModelAdmin):
    list_display = ('fname', 'lname', 'email', 'phone', 'user')
    search_fields = ('fname', 'lname', 'email', 'phone')
    list_filter = ('user__is_staff',)
    readonly_fields = ('user',)

admin.site.register(Vet)
admin.site.register(Specialization)
admin.site.register(Pet)
admin.site.register(Appointment)