from django.core.management.base import BaseCommand
from clinic.models import Owner, Pet, Vet, Specialization, Appointment
from django.utils import timezone
from datetime import datetime

class Command(BaseCommand):
    help = 'Loads sample data for the pet clinic'

    def handle(self, *args, **options):
        # Create sample owners
        john = Owner.objects.create_user(
            username='johnsmith',
            first_name='John',
            last_name='Smith',
            email='johnsmith@gmail.com',
            phone='123-4567',
            password='testpass123'
        )
        
        sarah = Owner.objects.create_user(
            username='sarahj',
            first_name='Sarah',
            last_name='Johnson',
            email='sarahj@gmail.com',
            phone='987-6543',
            password='testpass123'
        )
        
        maria = Owner.objects.create_user(
            username='mariag',
            first_name='Maria',
            last_name='Garcia',
            email='mariag@gmail.com',
            phone='555-5555',
            password='testpass123'
        )

        # Create sample vets
        emily = Vet.objects.create(name="Dr. Emily Wilson")
        michael = Vet.objects.create(name="Dr. Michael Chen")
        sarah_vet = Vet.objects.create(name="Dr. Sarah Lopez")

        # Add specializations
        Specialization.objects.create(vet=emily, name="Surgery")
        Specialization.objects.create(vet=emily, name="Emergency Care")
        Specialization.objects.create(vet=michael, name="Dentistry")
        Specialization.objects.create(vet=sarah_vet, name="General Practice")
        Specialization.objects.create(vet=sarah_vet, name="Dermatology")

        # Create sample pets
        buddy = Pet.objects.create(
            name="Buddy",
            species="Dog",
            breed="Golden Retriever",
            owner=john
        )
        
        mittens = Pet.objects.create(
            name="Mittens",
            species="Cat",
            breed="Siamese",
            owner=sarah
        )
        
        thumper = Pet.objects.create(
            name="Thumper",
            species="Rabbit",
            breed="Holland Lop",
            owner=john
        )
        
        max_pet = Pet.objects.create(
            name="Max",
            species="Dog",
            breed="German Shepherd",
            owner=maria
        )

        # Create sample appointments
        Appointment.objects.create(
            pet=buddy,
            vet=emily,
            date=datetime(2025, 5, 15, 10, 0, tzinfo=timezone.utc),
            reason="Surgery"
        )
        
        Appointment.objects.create(
            pet=mittens,
            vet=michael,
            date=datetime(2025, 5, 16, 14, 0, tzinfo=timezone.utc),
            reason="Dental Cleaning"
        )
        
        Appointment.objects.create(
            pet=buddy,
            vet=sarah_vet,
            date=datetime(2025, 5, 20, 15, 30, tzinfo=timezone.utc),
            reason="Vaccination"
        )
        
        Appointment.objects.create(
            pet=thumper,
            vet=emily,
            date=datetime(2025, 5, 17, 9, 0, tzinfo=timezone.utc),
            reason="Check-up"
        )

        self.stdout.write(self.style.SUCCESS('Successfully loaded sample data'))