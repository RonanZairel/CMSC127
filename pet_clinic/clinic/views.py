from django.views.generic import (
    ListView, DetailView, CreateView,
    UpdateView, DeleteView
)
from .models import Pet, Vet, Appointment, Owner, Specialization
from django.urls import reverse_lazy
from django.contrib.messages.views import SuccessMessageMixin
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
import json
from datetime import datetime



class HomeView(ListView):
    model = Appointment
    template_name = 'clinic/home.html'
    context_object_name = 'appointments'
    ordering = ['-date']

class PetListView(ListView):
    model = Pet
    template_name = 'clinic/pet_list.html'

class PetDetailView(DetailView):
    model = Pet
    template_name = 'clinic/pet_detail.html' 
    context_object_name = 'pet' 

class VetListView(ListView):
    model = Vet
    template_name = 'clinic/vet_list.html'


class PetCreateView(CreateView):
    model = Pet
    fields = ['name', 'species', 'breed', 'owner']
    template_name = 'clinic/pet_form.html'
    success_url = reverse_lazy('pet-list')

class PetUpdateView(UpdateView):
    model = Pet
    fields = ['name', 'species', 'breed', 'owner']
    template_name = 'clinic/pet_form.html'
    success_url = reverse_lazy('pet-list')

class PetDeleteView(DeleteView):
    model = Pet
    template_name = 'clinic/pet_confirm_delete.html'
    success_url = reverse_lazy('pet-list')

class AppointmentListView(ListView):
    model = Appointment
    template_name = 'clinic/appointment_list.html'
    context_object_name = 'appointments'
    ordering = ['-date']
    paginate_by = 10

class AppointmentCreateView(SuccessMessageMixin, CreateView):
    model = Appointment
    fields = ['pet', 'vet', 'date', 'reason']
    template_name = 'clinic/appointment_form.html'
    success_url = reverse_lazy('appointment-list')
    success_message = "Appointment was created successfully!"

class AppointmentUpdateView(SuccessMessageMixin, UpdateView):
    model = Appointment
    fields = ['pet', 'vet', 'date', 'reason']
    template_name = 'clinic/appointment_form.html'
    success_url = reverse_lazy('appointment-list')
    success_message = "Appointment was updated successfully!"

class AppointmentDeleteView(SuccessMessageMixin, DeleteView):
    model = Appointment
    template_name = 'clinic/appointment_confirm_delete.html'
    success_url = reverse_lazy('appointment-list')
    success_message = "Appointment was deleted successfully."

    def delete(self, request, *args, **kwargs):
        messages.success(self.request, self.success_message)
        return super().delete(request, *args, **kwargs)

def index(request):
    return render(request, 'index.html')

@csrf_exempt
def register_user(request):
    if request.method == 'POST':
        try:
            print("Received registration request")
            data = json.loads(request.body)
            print("Registration data:", data)
            
            # Validate required fields
            required_fields = ['firstName', 'lastName', 'email', 'phone', 'password']
            for field in required_fields:
                if not data.get(field):
                    return JsonResponse({
                        'status': 'error',
                        'message': f'Missing required field: {field}'
                    })
            
            # Check if email already exists
            if User.objects.filter(email=data['email']).exists():
                print(f"Email already exists: {data['email']}")
                return JsonResponse({
                    'status': 'error',
                    'message': 'Email already registered'
                })
            
            # Create User account
            try:
                print("Creating user with email:", data['email'])
                user = User.objects.create_user(
                    username=data['email'],
                    email=data['email'],
                    password=data['password'],
                    first_name=data['firstName'],
                    last_name=data['lastName']
                )
                print(f"User created successfully: {user.username}")
                
                # Create Owner profile
                try:
                    owner = Owner.objects.create(
                        user=user,
                        fname=data['firstName'],
                        minit=data.get('middleInitial', ''),
                        lname=data['lastName'],
                        email=data['email'],
                        phone=data['phone']
                    )
                    print(f"Owner profile created successfully: {owner.email}")
                    
                    # Verify the owner was created
                    if not Owner.objects.filter(email=data['email']).exists():
                        raise Exception("Owner creation failed - owner not found in database")
                    
                except Exception as e:
                    print(f"Error creating owner profile: {str(e)}")
                    # Clean up the created user if owner creation fails
                    user.delete()
                    return JsonResponse({
                        'status': 'error',
                        'message': f'Error creating owner profile: {str(e)}'
                    })
                
                return JsonResponse({'status': 'success'})
                
            except Exception as e:
                print(f"Error creating user: {str(e)}")
                return JsonResponse({
                    'status': 'error',
                    'message': f'Error creating user account: {str(e)}'
                })
            
        except json.JSONDecodeError:
            print("Invalid JSON data received")
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid data format'
            })
        except Exception as e:
            print(f"Unexpected error during registration: {str(e)}")
            # Clean up if user was created
            if 'user' in locals():
                user.delete()
            return JsonResponse({
                'status': 'error',
                'message': f'Registration failed: {str(e)}'
            })
    
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request method'
    })

@csrf_exempt
def login_user(request):
    if request.method == 'POST':
        try:
            print("Received login request")
            data = json.loads(request.body)
            print("Login attempt for email:", data.get('email'))
            
            # Validate required fields
            if not data.get('email') or not data.get('password'):
                return JsonResponse({
                    'status': 'error',
                    'message': 'Email and password are required'
                })

            # Authenticate user
            user = authenticate(username=data['email'], password=data['password'])
            print("Authentication result:", "Success" if user else "Failed")
            
            if user is not None:
                login(request, user)
                try:
                    owner = Owner.objects.get(user=user)
                    print(f"Login successful for user: {owner.email}")
                    return JsonResponse({
                        'status': 'success',
                        'user': {
                            'id': owner.id,
                            'name': f"{owner.fname} {owner.lname}",
                            'email': owner.email,
                            'isAdmin': user.is_staff
                        }
                    })
                except Owner.DoesNotExist:
                    print(f"Owner profile not found for user: {user.email}")
                    return JsonResponse({
                        'status': 'error',
                        'message': 'Owner profile not found'
                    })
            else:
                print(f"Invalid credentials for email: {data.get('email')}")
                return JsonResponse({
                    'status': 'error',
                    'message': 'Invalid email or password'
                })
                
        except json.JSONDecodeError:
            print("Invalid JSON data received in login request")
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid data format'
            })
        except Exception as e:
            print(f"Unexpected error during login: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': f'Login failed: {str(e)}'
            })
    
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request method'
    })

@csrf_exempt
def logout_user(request):
    logout(request)
    return JsonResponse({'status': 'success'})

@csrf_exempt
def get_pets(request):
    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error', 'message': 'Not authenticated'})
    
    try:
        if request.user.is_staff:
            # Admin can see all pets
            pets = Pet.objects.all()
        else:
            # Regular users can only see their own pets
            owner = Owner.objects.get(email=request.user.email)
            pets = Pet.objects.filter(owner=owner)

        return JsonResponse({
            'status': 'success',
            'pets': [{
                'id': pet.id,
                'name': pet.name,
                'species': pet.get_species_display(),  # Get the display value
                'breed': pet.breed,
                'age': pet.age,
                'ownerId': pet.owner.id,
                'ownerName': f"{pet.owner.fname} {pet.owner.lname}" if request.user.is_staff else None
            } for pet in pets]
        })
    except Owner.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Owner profile not found. Please contact support.'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Error retrieving pets: {str(e)}'
        })

@csrf_exempt
def get_vets(request):
    vets = Vet.objects.all()
    return JsonResponse({
        'status': 'success',
        'vets': [{
            'id': vet.id,
            'name': vet.name,
            'specializations': [spec.name for spec in vet.specializations.all()],
            'experience': vet.experience,
            'bio': vet.bio
        } for vet in vets]
    })

@csrf_exempt
def add_pet(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            print(f"Received pet data: {data}")  # Debug log
            
            # Validate required fields
            required_fields = ['name', 'species', 'breed']
            for field in required_fields:
                if not data.get(field):
                    return JsonResponse({
                        'status': 'error',
                        'message': f'Missing required field: {field}'
                    })
            
            # Get owner
            try:
                owner = Owner.objects.get(email=request.user.email)
            except Owner.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Owner not found'
                })
            
            # Create pet
            try:
                pet = Pet.objects.create(
                    name=data['name'],
                    species=data['species'],
                    breed=data['breed'],
                    age=data.get('age'),  # Optional field
                    owner=owner
                )
                print(f"Created pet: {pet}")  # Debug log
                
                return JsonResponse({
                    'status': 'success',
                    'pet': {
                        'id': pet.id,
                        'name': pet.name,
                        'species': pet.species,
                        'breed': pet.breed,
                        'age': pet.age
                    }
                })
            except Exception as e:
                print(f"Error creating pet: {str(e)}")  # Debug log
                return JsonResponse({
                    'status': 'error',
                    'message': f'Error creating pet: {str(e)}'
                })
                
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid JSON data'
            })
        except Exception as e:
            print(f"Unexpected error in add_pet: {str(e)}")  # Debug log
            return JsonResponse({
                'status': 'error',
                'message': f'Unexpected error: {str(e)}'
            })
            
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

@csrf_exempt
def get_appointments(request):
    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error', 'message': 'Not authenticated'})
    
    try:
        if request.user.is_staff:
            # Admin can see all appointments
            appointments = Appointment.objects.all()
        else:
            # Regular users can only see their own appointments
            owner = Owner.objects.get(email=request.user.email)
            appointments = Appointment.objects.filter(pet__owner=owner)

        return JsonResponse({
            'status': 'success',
            'appointments': [{
                'id': apt.id,
                'petId': apt.pet.id,
                'pet_name': apt.pet.name,
                'vetId': apt.vet.id,
                'vet_name': apt.vet.name,
                'date': apt.date.strftime('%Y-%m-%d'),
                'time': apt.date.strftime('%H:%M'),
                'reason': apt.reason,
                'status': apt.status,
                'ownerName': f"{apt.pet.owner.fname} {apt.pet.owner.lname}" if request.user.is_staff else None
            } for apt in appointments]
        })
    except Owner.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Owner not found'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

@csrf_exempt
def book_appointment(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        appointment = Appointment.objects.create(
            pet_id=data['pet_id'],
            vet_id=data['vet_id'],
            date=datetime.strptime(f"{data['date']} {data['time']}", '%Y-%m-%d %H:%M'),
            reason=data['reason'],
            status='confirmed'  # Set status to confirmed by default
        )
        return JsonResponse({
            'status': 'success',
            'appointment': {
                'id': appointment.id,
                'pet_name': appointment.pet.name,
                'vet_name': appointment.vet.name,
                'date': appointment.date.strftime('%Y-%m-%d %H:%M'),
                'reason': appointment.reason,
                'status': appointment.status
            }
        })
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

@csrf_exempt
def get_users(request):
    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({'status': 'error', 'message': 'Not authorized'})
    
    owners = Owner.objects.all()
    return JsonResponse({
        'status': 'success',
        'users': [{
            'id': owner.id,
            'name': f"{owner.fname} {owner.lname}",
            'email': owner.email,
            'phone': owner.phone,
            'isAdmin': owner.user.is_staff if owner.user else False
        } for owner in owners]
    })

@csrf_exempt
def update_pet(request, pet_id):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            print(f"Updating pet {pet_id} with data:", data)
            
            try:
                pet = Pet.objects.get(id=pet_id)
            except Pet.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Pet not found'
                })
            
            # Check if user is the owner or admin
            owner = Owner.objects.get(email=request.user.email)
            if not request.user.is_staff and pet.owner.id != owner.id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'You do not have permission to edit this pet'
                })
            
            # Update pet fields
            pet.name = data.get('name', pet.name)
            pet.species = data.get('species', pet.species)
            pet.breed = data.get('breed', pet.breed)
            pet.age = data.get('age', pet.age)
            
            pet.save()
            print(f"Pet {pet_id} updated successfully")
            
            return JsonResponse({
                'status': 'success',
                'pet': {
                    'id': pet.id,
                    'name': pet.name,
                    'species': pet.get_species_display(),  # Get the display value
                    'breed': pet.breed,
                    'age': pet.age,
                    'ownerId': pet.owner.id
                }
            })
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid data format'
            })
        except Exception as e:
            print(f"Error updating pet: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': f'Error updating pet: {str(e)}'
            })
    
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request method'
    })

@csrf_exempt
def delete_pet(request, pet_id):
    if request.method == 'DELETE':
        try:
            print(f"Attempting to delete pet {pet_id}")
            try:
                pet = Pet.objects.get(id=pet_id)
            except Pet.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Pet not found'
                })
            
            # Check if user is the owner or admin
            owner = Owner.objects.get(email=request.user.email)
            if not request.user.is_staff and pet.owner.id != owner.id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'You do not have permission to delete this pet'
                })
            
            # Delete associated appointments first
            Appointment.objects.filter(pet=pet).delete()
            
            # Delete the pet
            pet.delete()
            print(f"Pet {pet_id} deleted successfully")
            
            return JsonResponse({
                'status': 'success',
                'message': 'Pet and associated appointments deleted successfully'
            })
        except Exception as e:
            print(f"Error deleting pet: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': f'Error deleting pet: {str(e)}'
            })
    
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request method'
    })

@csrf_exempt
def update_appointment_status(request, appointment_id):
    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error', 'message': 'Not authenticated'})
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            new_status = data.get('status')
            
            if not new_status:
                return JsonResponse({'status': 'error', 'message': 'Status is required'})
            
            try:
                appointment = Appointment.objects.get(id=appointment_id)
            except Appointment.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Appointment not found'})
            
            # Check if user is admin or the pet owner
            owner = Owner.objects.get(email=request.user.email)
            if not request.user.is_staff and appointment.pet.owner.id != owner.id:
                return JsonResponse({'status': 'error', 'message': 'You do not have permission to update this appointment'})
            
            appointment.status = new_status
            appointment.save()
            
            return JsonResponse({
                'status': 'success',
                'message': f'Appointment status updated to {new_status}',
                'appointment': {
                    'id': appointment.id,
                    'status': appointment.status
                }
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

@csrf_exempt
def update_appointment(request, appointment_id):
    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error', 'message': 'Not authenticated'})
    
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            try:
                appointment = Appointment.objects.get(id=appointment_id)
            except Appointment.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Appointment not found'})
            
            # Check if user is admin or the pet owner
            owner = Owner.objects.get(email=request.user.email)
            if not request.user.is_staff and appointment.pet.owner.id != owner.id:
                return JsonResponse({'status': 'error', 'message': 'You do not have permission to update this appointment'})
            
            # Update appointment fields
            appointment.pet_id = data.get('pet_id', appointment.pet_id)
            appointment.vet_id = data.get('vet_id', appointment.vet_id)
            appointment.date = datetime.strptime(f"{data['date']} {data['time']}", '%Y-%m-%d %H:%M')
            appointment.reason = data.get('reason', appointment.reason)
            
            appointment.save()
            
            return JsonResponse({
                'status': 'success',
                'message': 'Appointment updated successfully',
                'appointment': {
                    'id': appointment.id,
                    'pet_name': appointment.pet.name,
                    'vet_name': appointment.vet.name,
                    'date': appointment.date.strftime('%Y-%m-%d'),
                    'time': appointment.date.strftime('%H:%M'),
                    'reason': appointment.reason,
                    'status': appointment.status
                }
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

@csrf_exempt
def cancel_appointment(request, appointment_id):
    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error', 'message': 'Not authenticated'})
    
    if request.method == 'POST':
        try:
            appointment = Appointment.objects.get(id=appointment_id)
            
            # Check if user is admin or the pet owner
            owner = Owner.objects.get(email=request.user.email)
            if not request.user.is_staff and appointment.pet.owner.id != owner.id:
                return JsonResponse({'status': 'error', 'message': 'You do not have permission to cancel this appointment'})
            
            if appointment.status in ['completed', 'cancelled']:
                return JsonResponse({'status': 'error', 'message': f'Appointment is already {appointment.status}'})
            
            appointment.status = 'cancelled'
            appointment.save()
            
            return JsonResponse({
                'status': 'success',
                'message': 'Appointment cancelled successfully',
                'appointment': {
                    'id': appointment.id,
                    'status': appointment.status
                }
            })
        except Appointment.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Appointment not found'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

@csrf_exempt
def delete_appointment(request, appointment_id):
    if not request.user.is_authenticated:
        return JsonResponse({'status': 'error', 'message': 'Not authenticated'})
    
    if request.method == 'DELETE':
        try:
            appointment = Appointment.objects.get(id=appointment_id)
            
            # Check if user is admin or the pet owner
            owner = Owner.objects.get(email=request.user.email)
            if not request.user.is_staff and appointment.pet.owner.id != owner.id:
                return JsonResponse({'status': 'error', 'message': 'You do not have permission to delete this appointment'})
            
            # Only allow deletion of cancelled appointments
            if appointment.status != 'cancelled':
                return JsonResponse({'status': 'error', 'message': 'Only cancelled appointments can be deleted'})
            
            appointment.delete()
            
            return JsonResponse({
                'status': 'success',
                'message': 'Appointment deleted successfully'
            })
        except Appointment.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Appointment not found'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

@csrf_exempt
def update_vet(request, vet_id):
    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({'status': 'error', 'message': 'Not authorized'})
    
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            try:
                vet = Vet.objects.get(id=vet_id)
            except Vet.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Vet not found'})
            
            # Update vet fields
            vet.name = data.get('name', vet.name)
            vet.experience = data.get('experience', vet.experience)
            vet.bio = data.get('bio', vet.bio)
            
            # Handle specializations
            if 'specializations' in data:
                # Clear existing specializations
                vet.specializations.clear()
                # Add new specializations
                for spec_name in data['specializations']:
                    spec, created = Specialization.objects.get_or_create(name=spec_name)
                    vet.specializations.add(spec)
            
            vet.save()
            
            return JsonResponse({
                'status': 'success',
                'vet': {
                    'id': vet.id,
                    'name': vet.name,
                    'specializations': [spec.name for spec in vet.specializations.all()],
                    'experience': vet.experience,
                    'bio': vet.bio
                }
            })
        except Exception as e:
            print(f"Error updating vet: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': f'Error updating vet: {str(e)}'
            })
    
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request method'
    })

@csrf_exempt
def add_vet(request):
    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({'status': 'error', 'message': 'Not authorized'})
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Create new vet
            vet = Vet.objects.create(
                name=data['name'],
                experience=data.get('experience', 0),
                bio=data.get('bio', 'No bio available')
            )
            
            # Handle specializations
            if 'specializations' in data:
                for spec_name in data['specializations']:
                    spec, created = Specialization.objects.get_or_create(name=spec_name)
                    vet.specializations.add(spec)
            
            return JsonResponse({
                'status': 'success',
                'vet': {
                    'id': vet.id,
                    'name': vet.name,
                    'specializations': [spec.name for spec in vet.specializations.all()],
                    'experience': vet.experience,
                    'bio': vet.bio
                }
            })
        except Exception as e:
            print(f"Error adding vet: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': f'Error adding vet: {str(e)}'
            })
    
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request method'
    })

@csrf_exempt
def delete_vet(request, vet_id):
    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({'status': 'error', 'message': 'Not authorized'})
    
    if request.method == 'DELETE':
        try:
            try:
                vet = Vet.objects.get(id=vet_id)
            except Vet.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Vet not found'})
            
            # Check if vet has any appointments
            if Appointment.objects.filter(vet=vet).exists():
                return JsonResponse({
                    'status': 'error',
                    'message': 'Cannot delete veterinarian with existing appointments'
                })
            
            vet.delete()
            return JsonResponse({
                'status': 'success',
                'message': 'Veterinarian deleted successfully'
            })
        except Exception as e:
            print(f"Error deleting vet: {str(e)}")
            return JsonResponse({
                'status': 'error',
                'message': f'Error deleting vet: {str(e)}'
            })
    
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request method'
    })

def check_session(request):
    if request.user.is_authenticated:
        return JsonResponse({
            'isLoggedIn': True,
            'user': {
                'id': request.user.id,
                'name': request.user.get_full_name() or request.user.username,
                'role': 'admin' if request.user.is_staff else 'user'
            }
        })
    else:
        return JsonResponse({'isLoggedIn': False})