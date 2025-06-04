from django.core.management.base import BaseCommand
from clinic.models import Owner
from django.db.models import Count

class Command(BaseCommand):
    help = 'Cleans up duplicate owner records while handling foreign key relationships'

    def handle(self, *args, **kwargs):
        # Find all duplicate emails
        duplicates = Owner.objects.values('email').annotate(
            email_count=Count('email')
        ).filter(email_count__gt=1)

        for dup in duplicates:
            self.stdout.write(f"Processing duplicates for email: {dup['email']}")
            
            # Get all owners with this email, ordered by ID
            owners = Owner.objects.filter(email=dup['email']).order_by('id')
            
            # Keep the first one, delete the rest
            first_owner = owners.first()
            for owner in owners[1:]:
                self.stdout.write(f"Deleting duplicate owner ID: {owner.id}")
                # This will trigger our custom delete method
                owner.delete()

        self.stdout.write(self.style.SUCCESS('Successfully cleaned up duplicate owners')) 