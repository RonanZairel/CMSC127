from django.db import migrations

def handle_duplicate_emails(apps, schema_editor):
    Owner = apps.get_model('clinic', 'Owner')
    # Get all owners ordered by id
    owners = Owner.objects.all().order_by('id')
    seen_emails = set()
    
    for owner in owners:
        if owner.email in seen_emails:
            # If we've seen this email before, append a number to make it unique
            base_email = owner.email
            counter = 1
            while owner.email in seen_emails:
                owner.email = f"{base_email.split('@')[0]}{counter}@{base_email.split('@')[1]}"
                counter += 1
            owner.save()
        seen_emails.add(owner.email)

class Migration(migrations.Migration):
    dependencies = [
        ('clinic', '0003_owner_user'),
    ]

    operations = [
        migrations.RunPython(handle_duplicate_emails),
    ] 