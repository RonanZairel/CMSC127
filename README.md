# **Pet Clinic Appointment System**

### **Project Overview**
This app will allow a pet clinic to manage pets, vets, and appointments. 

You can add, edit, delete, view pets and vets, and book appointments between pets and vets for specific dates.

--- 

### **Database Tables**
*pets*
- id (Primary Key): Unique identifier for each pet
- name: Pet's name (e.g., "Buddy", "Mittens")
- species: Type of animal (e.g., "Dog", "Cat", "Rabbit")
- breed: Specific breed (e.g., "Golden Retriever", "Siamese")
- owner_name: Name of the pet's owner

*vets*
- id (Primary Key):Unique identifier for each vet
- vet_name: Full name of the veterinarian
- specialization: Field of expertise (e.g."Surgery", "Dentistry", "General Practice")

*appointments*
- id (Primary Key): Unique identifier for each appointment
- pet_id (Foreign Key -> pets.id): Which pet has the appointment
- vet_id (Foreign Key -> vets.id): Which vet is handling it
- appointment_date: Scheduled date and time
- reason: Why the pet is visiting (e.g. "Annual Vaccination", "Check-up", "Skin Allergy")

---

### **CRUD Operations**
*Create*
- Register a new pet
- Add a new pet
- Book a new appointment

*Read*
- View list of all pets
- View list of all vets
- View upcoming appointments (joined with pet and vet names)

*Update*
- Edit pet information (e.g. typo in bread or owner name)
- Edit vet details (e.g. changed specialization)
- Reschedule an appointment (update date or reason)

*Delete*
- Delete a pet (maybe if they moved or passed away)
- Delete a vet (if they left the clinic)
- Cancel an appointment
