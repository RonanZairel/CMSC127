from django.db import migrations

def update_existing_appointments(apps, schema_editor):
    Appointment = apps.get_model('clinic', 'Appointment')
    # Update all existing appointments to 'confirmed' status
    Appointment.objects.filter(status='scheduled').update(status='confirmed')

def reverse_update(apps, schema_editor):
    Appointment = apps.get_model('clinic', 'Appointment')
    # Revert appointments back to 'scheduled' status
    Appointment.objects.filter(status='confirmed').update(status='scheduled')

class Migration(migrations.Migration):
    dependencies = [
        ('clinic', '0007_alter_appointment_status'),
    ]

    operations = [
        migrations.RunPython(update_existing_appointments, reverse_update),
    ] 