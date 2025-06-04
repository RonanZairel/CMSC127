// data storage (in memory)
let currentUser = null;
let users = [
    {
        id: 1,
        firstName: 'John',
        middleInitial: 'D',
        lastName: 'Smith',
        suffix: '',
        email: 'john.smith@email.com',
        phone: '555-0101',
        password: 'password123',
        isAdmin: false
    },
    {
        id: 2,
        firstName: 'Admin',
        middleInitial: '',
        lastName: 'User',
        email: 'admin@pawsitibo.com',
        phone: '555-0000',
        password: 'admin123',
        isAdmin: true
    }
];

let pets = [
    {
        id: 1, name: 'Buddy', species: 'Dog', breed: 'Golden Retriever', age: 3, ownerId: 1
    },
    {
        id: 2, name: 'Whiskers', species: 'Cat', breed: 'Persian', age: 2, ownerId: 1
    }
];

let vets = [
    {
        id: 1,
        name: 'Dr. Nicolete Guarin',
        specialization: 'Small Animal Internal Medicine',
        experience: 7,
        bio: 'Focuses on diagnosing and treating complex internal diseases in cats and dogs, ensuring comprehensive care.'
    },
    {
        id: 2,
        name: 'Dr. Keanne Domingo',
        specialization: 'Avian and Exotic Pet Medicine',
        experience: 5,
        bio: 'Specializes in the unique healthcare needs of birds, reptiles, and small mammals with a gentle touch.'
    },
    {
        id: 3,
        name: 'Dr. Ronan Alcordo',
        specialization: 'Veterinary Surgery & Orthopedics',
        experience: 10,
        bio: 'Expert in a wide range of surgical procedures, including advanced orthopedic and soft tissue surgeries.'
    },
    {
        id: 4,
        name: 'Dr. Tammy Putalan',
        specialization: 'Dermatology & Allergy',
        experience: 6,
        bio: 'Dedicated to treating skin conditions, ear infections, and allergies to improve your pet\'s comfort and quality of life.'
    }
];

let appointments = [
    {
        id: 1, petId: 1, vetId: 1, date: '2025-05-28', time: '10:00', reason: 'Annual check-up', status: 'confirmed' // confirmed, completed, cancelled
    },
    {
        id: 2, petId: 2, vetId: 2, date: '2025-05-30', time: '14:00', reason: 'Vaccination', status: 'confirmed'
    }
];

let editingPetId = null;
let editingVetId = null;
let editingAppointmentId = null;

// utility functions
function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000); 
}

const messageContainer = document.createElement('div');
messageContainer.className = 'message-container';
document.body.appendChild(messageContainer);

function showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    
    messageContainer.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(-20px)';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const yOffset = -70; 
        const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({top: y, behavior: 'smooth'});
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString + 'T00:00:00').toLocaleDateString(undefined, options); 
}

function formatTime(timeString) {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedHours = h % 12 === 0 ? 12 : h % 12;
    return `${formattedHours}:${minutes} ${ampm}`;
}


// modal
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'block';
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

function showLoginModal() {
    hideModal('signupModal');
    hideModal('bookingModal');
    showModal('loginModal');
    document.getElementById('loginForm').reset();
}

function showSignupModal() {
    hideModal('loginModal');
    hideModal('bookingModal');
    showModal('signupModal');
    document.getElementById('signupForm').reset();
}

function showBookingPromptModal() {
    if (currentUser) {
        showUserTab('book');
        // ensure dashboard is visible if user was on homepage
        if (document.getElementById('userDashboard').style.display === 'none') {
            showDashboard();
        }
    } else {
        showModal('bookingModal');
    }
}

function showAddPetModal(petId = null) {
    editingPetId = petId;
    const form = document.getElementById('addPetForm');
    const modalTitle = document.getElementById('petModalTitle');
    const submitBtn = document.getElementById('petFormSubmitBtn');
    form.reset();

    if (petId) {
        const pet = pets.find(p => p.id === petId);
        if (pet) {
            document.getElementById('petName').value = pet.name;
            document.getElementById('species').value = pet.species;
            document.getElementById('breed').value = pet.breed;
            document.getElementById('age').value = pet.age;
            modalTitle.textContent = 'Edit Pet Details';
            submitBtn.textContent = 'Save Changes';
        }
    } else {
        modalTitle.textContent = 'Add New Pet';
        submitBtn.textContent = 'Add Pet';
    }
    showModal('addPetModal');
}

function showAddVetModal(vetId = null) {
    editingVetId = vetId;
    const form = document.getElementById('addVetForm');
    const modalTitle = document.getElementById('vetModalTitle');
    const submitBtn = document.getElementById('vetFormSubmitBtn');
    form.reset();

    if (vetId) {
        const vet = vets.find(v => v.id === vetId);
        if (vet) {
            document.getElementById('vetName').value = vet.name;
            document.getElementById('specialization').value = vet.specialization; // assuming string, not array for simplicity
            document.getElementById('experience').value = vet.experience;
            document.getElementById('bio').value = vet.bio;
            modalTitle.textContent = 'Edit Veterinarian Details';
            submitBtn.textContent = 'Save Changes';
        }
    } else {
        modalTitle.textContent = 'Add New Veterinarian';
        submitBtn.textContent = 'Add Veterinarian';
    }
    showModal('addVetModal');
}

// authentication
function login(email, password) {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        currentUser = user;
        hideModal('loginModal');
        showDashboard();
        showMessage(`Welcome back, ${user.firstName}!`);
        updateNavForLoggedInUser();
        return true;
    }
    showMessage('Invalid email or password.', 'error');
    return false;
}

function signup(userData) {
    if (users.find(u => u.email === userData.email)) {
        showMessage('Email already exists!', 'error');
        return false;
    }
    const newUser = { id: generateId(), ...userData, isAdmin: false };
    users.push(newUser);
    currentUser = newUser;
    hideModal('signupModal');
    showDashboard();
    showMessage(`Account created for ${newUser.firstName}! Welcome!`);
    updateNavForLoggedInUser();
    return true;
}

function logout() {
    currentUser = null;
    editingPetId = null;
    editingVetId = null;
    editingAppointmentId = null;
    hideAllDashboards();
    showHomepageSections();
    showMessage('Logged out successfully!');
    updateNavForLoggedOutUser();
    document.getElementById('loginForm').reset();
    document.getElementById('signupForm').reset();
    closeMobileMenu(); 
}

function updateNavForLoggedInUser() {
    const authButtons = document.querySelector('.nav-menu .auth-buttons');
    if (authButtons) {
        authButtons.style.display = 'none'; // hide login/signup
    }
}

function updateNavForLoggedOutUser() {
    const authButtons = document.querySelector('.nav-menu .auth-buttons');
     if (authButtons) {
        authButtons.style.display = 'flex'; // show login/signup
    }
}


// dashboard and page 
function showDashboard() {
    hideHomepageSections();
    closeMobileMenu();
    if (currentUser.isAdmin) {
        document.getElementById('userDashboard').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        document.getElementById('userName').textContent = currentUser.firstName; 
        loadAdminData();
        showAdminTab('pets'); 
    } else {
        document.getElementById('adminDashboard').style.display = 'none';
        document.getElementById('userDashboard').style.display = 'block';
        document.getElementById('userName').textContent = currentUser.firstName;
        loadUserData();
        showUserTab('pets'); 
    }
}

function hideHomepageSections() {
    ['home', 'services', 'vets', 'about'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function showHomepageSections() {
    ['home', 'services', 'vets', 'about'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'block';
    });
    loadVetsDisplay(); 
}

function hideAllDashboards() {
    document.getElementById('userDashboard').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'none';
}

// tab
function showUserTab(tabName, appointmentToEditId = null) {
    document.querySelectorAll('#userDashboard .tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('#userDashboard .tab-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabName + 'Tab').classList.add('active');
    document.querySelector(`#userDashboard .tab-btn[data-tab="${tabName}"]`).classList.add('active');

    editingAppointmentId = appointmentToEditId; 
    const bookingFormTitle = document.getElementById('bookingFormTitle');
    const bookingSubmitBtn = document.getElementById('bookingSubmitBtn');
    const appointmentStatusGroup = document.getElementById('appointmentStatusGroup');

    if (tabName === 'pets') loadUserPets();
    if (tabName === 'appointments') loadUserAppointments();
    if (tabName === 'book') {
        loadBookingForm();
        if (editingAppointmentId) {
            const appointment = appointments.find(a => a.id === editingAppointmentId);
            if (appointment) {
                document.getElementById('petSelect').value = appointment.petId;
                document.getElementById('vetSelect').value = appointment.vetId;
                document.getElementById('appointmentDate').value = appointment.date;
                document.getElementById('appointmentTime').value = appointment.time;
                document.getElementById('reason').value = appointment.reason;
                bookingFormTitle.textContent = 'Reschedule Appointment';
                bookingSubmitBtn.textContent = 'Update Appointment';
                appointmentStatusGroup.style.display = 'none'; 
            }
        } else {
            bookingFormTitle.textContent = 'Book New Appointment';
            bookingSubmitBtn.textContent = 'Book Appointment';
            appointmentStatusGroup.style.display = 'none';
        }
    }
}

function showAdminTab(tabName, itemToEditId = null) {
    document.querySelectorAll('#adminDashboard .tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('#adminDashboard .tab-btn').forEach(btn => btn.classList.remove('active'));

    const currentAdminTab = document.getElementById('admin' + tabName.charAt(0).toUpperCase() + tabName.slice(1) + 'Tab');
    if (currentAdminTab) currentAdminTab.classList.add('active');
    
    const currentAdminBtn = document.querySelector(`#adminDashboard .tab-btn[data-admin-tab="${tabName}"]`);
    if (currentAdminBtn) currentAdminBtn.classList.add('active');

    if (tabName === 'pets') loadAdminPets();
    if (tabName === 'vets') loadAdminVets();
    if (tabName === 'appointments') loadAdminAppointments();
    
    // For admin editing appointments directly from their list (if we implement that button)
    // This example focuses on users rescheduling. Admins can edit status.
    if (tabName === 'appointments' && itemToEditId) {
        // Potentially open a dedicated admin edit appointment modal or reuse booking form with status field
        // For simplicity, admin edit of appointments here means they can cancel or mark completed.
        // Rescheduling for admin can be similar to user's, or more direct.
        // The current HTML doesn't have an "edit" button on admin appointment list that links to the booking form.
        // It has cancel/edit (edit could be for status).
    }
}


// data loading functions
function loadUserData() {
    loadUserPets();
    loadUserAppointments();
    loadBookingForm();
}

function loadAdminData() {
    loadAdminPets();
    loadAdminVets();
    loadAdminAppointments();
}

function createPetCardHTML(pet, isUserView = true) {
    const owner = users.find(u => u.id === pet.ownerId);
    let ownerInfo = '';
    if (!isUserView && owner) {
        ownerInfo = `<div class="pet-detail"><span>Owner:</span><strong>${owner.firstName} ${owner.lastName}</strong></div>`;
    }

    return `
        <div class="pet-card" data-pet-id="${pet.id}">
            <div class="pet-header">
                <div class="pet-avatar">
                    <i class="fas fa-${pet.species.toLowerCase() === 'dog' ? 'dog' : pet.species.toLowerCase() === 'cat' ? 'cat' : 'paw'}"></i>
                </div>
                <div class="pet-info">
                    <h3>${pet.name}</h3>
                    <div class="pet-breed">${pet.breed}</div>
                </div>
            </div>
            <div class="pet-details">
                <div class="pet-detail"><span>Species:</span><strong>${pet.species}</strong></div>
                <div class="pet-detail"><span>Age:</span><strong>${pet.age} years</strong></div>
                ${ownerInfo}
            </div>
            <div class="pet-actions">
                <button class="btn-small btn-edit" onclick="handleEditPet(${pet.id})">Edit</button>
                <button class="btn-small btn-delete" onclick="handleDeletePet(${pet.id})">Delete</button>
            </div>
        </div>`;
}

function loadUserPets() {
    const userPets = pets.filter(p => p.ownerId === currentUser.id);
    const petsList = document.getElementById('petsList');
    petsList.innerHTML = '';
    if (userPets.length === 0) {
        petsList.innerHTML = `<div class="empty-state"><i class="fas fa-paw"></i><h3>No pets registered yet</h3><p>Add your first pet to get started.</p><button class="btn-primary" onclick="showAddPetModal()">Add Your First Pet</button></div>`;
        return;
    }
    userPets.forEach(pet => petsList.innerHTML += createPetCardHTML(pet, true));
}

function loadAdminPets() {
    const adminPetsList = document.getElementById('adminPetsList');
    adminPetsList.innerHTML = '';
     if (pets.length === 0) {
        adminPetsList.innerHTML = `<div class="empty-state"><i class="fas fa-paw"></i><h3>No pets in the system</h3><p>Pets will appear here as they are registered by users.</p></div>`;
        return;
    }
    pets.forEach(pet => adminPetsList.innerHTML += createPetCardHTML(pet, false));
}

function createVetAdminCardHTML(vet) {
    return `
        <div class="admin-card vet-admin-card" data-vet-id="${vet.id}">
            <div class="vet-card"> <!-- Re-use vet-card styling -->
                <div class="pet-avatar vet-avatar"> <!-- Use pet-avatar for consistency, or vet-avatar if defined separately -->
                    <i class="fas fa-user-md"></i>
                </div>
                <h3>${vet.name}</h3>
                <div class="vet-specialization">${vet.specialization}</div>
                <p><strong>Experience:</strong> ${vet.experience} years</p>
                <p class="vet-bio">${vet.bio}</p>
                <div class="pet-actions">
                    <button class="btn-small btn-edit" onclick="handleEditVet(${vet.id})">Edit</button>
                    <button class="btn-small btn-delete" onclick="handleDeleteVet(${vet.id})">Delete</button>
                </div>
            </div>
        </div>`;
}

function loadAdminVets() {
    const adminVetsList = document.getElementById('adminVetsList');
    adminVetsList.innerHTML = '';
    if (vets.length === 0) {
        adminVetsList.innerHTML = `<div class="empty-state"><i class="fas fa-user-md"></i><h3>No veterinarians in the system.</h3><p>Add veterinarians to make them available for appointments.</p><button class="btn-primary" onclick="showAddVetModal()">Add First Veterinarian</button></div>`;
        return;
    }
    vets.forEach(vet => adminVetsList.innerHTML += createVetAdminCardHTML(vet));
}

function createAppointmentCardHTML(appointment, isUserView = true) {
    const pet = pets.find(p => p.id === appointment.petId);
    const vet = vets.find(v => v.id === appointment.vetId);
    let ownerInfo = '';
    if (!isUserView && pet) { 
        const owner = users.find(u => u.id === pet.ownerId);
        ownerInfo = `<div class="appointment-detail"><strong>Owner</strong><span>${owner ? `${owner.firstName} ${owner.lastName}` : 'Unknown'}</span></div>`;
    }
    
    const petName = pet ? pet.name : 'Unknown Pet';
    const vetName = vet ? vet.name : 'Unknown Vet';

    let actionButtons = '';
    if (isUserView) {
        if (appointment.status === 'confirmed') {
             actionButtons = `
                <button class="btn-small btn-edit" onclick="handleRescheduleAppointment(${appointment.id})">Reschedule</button>
                <button class="btn-small btn-delete" onclick="handleCancelAppointment(${appointment.id})">Cancel</button>
            `;
        } else if (appointment.status === 'cancelled' || appointment.status === 'completed'){
             actionButtons = `<button class="btn-small btn-delete" disabled>Cancel</button>`;
        }
    } else { 
        actionButtons = `
            <button class="btn-small btn-edit" onclick="handleAdminEditAppointmentStatus(${appointment.id})">Edit Status</button>
            <button class="btn-small btn-delete" onclick="handleCancelAppointment(${appointment.id}, true)">Cancel</button>
        `;
    }

    return `
        <div class="appointment-card" data-appointment-id="${appointment.id}">
            <div class="appointment-info">
                <h3>${petName} with ${vetName}</h3>
                <div class="appointment-details">
                    ${ownerInfo} 
                    <div class="appointment-detail"><strong>Date</strong><span>${formatDate(appointment.date)}</span></div>
                    <div class="appointment-detail"><strong>Time</strong><span>${formatTime(appointment.time)}</span></div>
                    <div class="appointment-detail"><strong>Reason</strong><span>${appointment.reason || 'N/A'}</span></div>
                    <div class="appointment-detail"><strong>Status</strong><span class="status-badge status-${appointment.status}">${appointment.status}</span></div>
                </div>
                <div class="appointment-actions"> 
                    ${actionButtons}
                </div>
            </div>
        </div>`;
}

function loadUserAppointments() {
    const userPetIds = pets.filter(p => p.ownerId === currentUser.id).map(p => p.id);
    const userAppointments = appointments.filter(a => userPetIds.includes(a.petId)).sort((a,b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
    const appointmentsList = document.getElementById('appointmentsList');
    appointmentsList.innerHTML = '';

    if (userAppointments.length === 0) {
        appointmentsList.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-times"></i><h3>No upcoming appointments</h3><p>Book an appointment for your pet today!</p><button class="btn-primary" onclick="showUserTab('book')">Book Appointment</button></div>`;
        return;
    }
    userAppointments.forEach(app => appointmentsList.innerHTML += createAppointmentCardHTML(app, true));
}

function loadAdminAppointments() {
    const adminAppointmentsList = document.getElementById('adminAppointmentsList');
    adminAppointmentsList.innerHTML = '';
    const sortedAppointments = [...appointments].sort((a,b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));

    if (sortedAppointments.length === 0) {
        adminAppointmentsList.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-check"></i><h3>No appointments in the system</h3><p>Appointments will appear here as they are booked.</p></div>`;
        return;
    }
    sortedAppointments.forEach(app => adminAppointmentsList.innerHTML += createAppointmentCardHTML(app, false));
}

function loadBookingForm() {
    const userPets = pets.filter(p => p.ownerId === currentUser.id); 
    const petSelect = document.getElementById('petSelect');
    petSelect.innerHTML = '<option value="">Choose a pet...</option>' + 
        userPets.map(pet => `<option value="${pet.id}">${pet.name} (${pet.species})</option>`).join('');
    
    const vetSelect = document.getElementById('vetSelect');
    vetSelect.innerHTML = '<option value="">Choose a veterinarian...</option>' + 
        vets.map(vet => `<option value="${vet.id}">${vet.name} - ${vet.specialization}</option>`).join('');
    
    const today = new Date();
    today.setDate(today.getDate()); 
    document.getElementById('appointmentDate').min = today.toISOString().split('T')[0];
    document.getElementById('bookingForm').reset(); 
}


function loadVetsDisplay() { 
    const vetsGrid = document.getElementById('vetsGrid');
    if (!vetsGrid) return;
    vetsGrid.innerHTML = '';
    if (vets.length === 0) {
        vetsGrid.innerHTML = "<p>No veterinarians currently listed. Please check back later.</p>";
        return;
    }
    vets.forEach(vet => {
        vetsGrid.innerHTML += `
            <div class="vet-card">
                <div class="vet-avatar">
                    <i class="fas fa-user-md"></i>
                </div>
                <h3>${vet.name}</h3>
                <div class="vet-specialization">${vet.specialization}</div>
                <p><strong>${vet.experience} years of experience</strong></p>
                <p class="vet-bio">${vet.bio}</p>
            </div>
        `;
    });
}


// crud

// pet crud
function handleAddPetFormSubmit(event) {
    event.preventDefault();
    const petData = {
        name: document.getElementById('petName').value.trim(),
        species: document.getElementById('species').value,
        breed: document.getElementById('breed').value.trim(),
        age: parseInt(document.getElementById('age').value)
    };

    if (!petData.name || !petData.species || !petData.breed || isNaN(petData.age) || petData.age < 0) {
        showMessage('Please fill all fields correctly for the pet.', 'error');
        return;
    }

    if (editingPetId) { 
        const petIndex = pets.findIndex(p => p.id === editingPetId);
        if (petIndex > -1) {
            pets[petIndex] = { ...pets[petIndex], ...petData };
            showMessage('Pet details updated successfully!');
        }
    } else { 
        const newPet = { id: generateId(), ...petData, ownerId: currentUser.id };
        pets.push(newPet);
        showMessage('Pet added successfully!');
    }
    hideModal('addPetModal');
    editingPetId = null;
    if (currentUser.isAdmin) loadAdminPets();
    loadUserPets(); 
    loadBookingForm(); 
}

function handleEditPet(petId) {
    const pet = pets.find(p => p.id === petId);
    if (!pet || (!currentUser.isAdmin && pet.ownerId !== currentUser.id)) {
        showMessage('You do not have permission to edit this pet.', 'error');
        return;
    }
    showAddPetModal(petId);
}

function handleDeletePet(petId) {
    const pet = pets.find(p => p.id === petId);
    if (!pet || (!currentUser.isAdmin && pet.ownerId !== currentUser.id)) {
        showMessage('You do not have permission to delete this pet.', 'error');
        return;
    }

    if (confirm(`Are you sure you want to delete ${pet.name}? This will also cancel associated appointments.`)) {
        pets = pets.filter(p => p.id !== petId);
        appointments = appointments.filter(app => app.petId !== petId);
        showMessage('Pet and associated appointments deleted successfully!');
        if (currentUser.isAdmin) loadAdminPets();
        loadUserPets();
        loadUserAppointments(); 
        if (currentUser.isAdmin) loadAdminAppointments();
        loadBookingForm();
    }
}

// vet crud in admin
function handleAddVetFormSubmit(event) {
    event.preventDefault();
    if (!currentUser || !currentUser.isAdmin) return;

    const vetData = {
        name: document.getElementById('vetName').value.trim(),
        specialization: document.getElementById('specialization').value.trim(),
        experience: parseInt(document.getElementById('experience').value),
        bio: document.getElementById('bio').value.trim()
    };

    if (!vetData.name || !vetData.specialization || isNaN(vetData.experience) || vetData.experience < 0 || !vetData.bio) {
        showMessage('Please fill all fields correctly for the veterinarian.', 'error');
        return;
    }

    if (editingVetId) {
        const vetIndex = vets.findIndex(v => v.id === editingVetId);
        if (vetIndex > -1) {
            vets[vetIndex] = { ...vets[vetIndex], ...vetData };
            showMessage('Veterinarian details updated successfully!');
        }
    } else {
        vets.push({ id: generateId(), ...vetData });
        showMessage('Veterinarian added successfully!');
    }
    hideModal('addVetModal');
    editingVetId = null;
    loadAdminVets();
    loadVetsDisplay(); 
    loadBookingForm(); 
}

function handleEditVet(vetId) {
    if (!currentUser || !currentUser.isAdmin) return;
    showAddVetModal(vetId);
}

function handleDeleteVet(vetId) {
    if (!currentUser || !currentUser.isAdmin) return;
    const vet = vets.find(v => v.id === vetId);
    if (!vet) return;

    if (confirm(`Are you sure you want to delete ${vet.name}? This will also cancel appointments with this vet.`)) {
        vets = vets.filter(v => v.id !== vetId);
        // Option: Mark appointments with this vet as "Vet Unavailable" or remove them
        appointments = appointments.filter(app => app.vetId !== vetId); 
        showMessage('Veterinarian and their appointments deleted successfully!');
        loadAdminVets();
        loadVetsDisplay();
        loadUserAppointments(); 
        loadAdminAppointments();
        loadBookingForm();
    }
}

// appointment crud
function handleBookingFormSubmit(event) {
    event.preventDefault();
    const appointmentData = {
        petId: parseInt(document.getElementById('petSelect').value),
        vetId: parseInt(document.getElementById('vetSelect').value),
        date: document.getElementById('appointmentDate').value,
        time: document.getElementById('appointmentTime').value,
        reason: document.getElementById('reason').value.trim(),
    };

    if (!appointmentData.petId || !appointmentData.vetId || !appointmentData.date || !appointmentData.time || !appointmentData.reason) {
        showMessage('Please fill all appointment details.', 'error');
        return;
    }
    
    const selectedDateTime = new Date(`${appointmentData.date}T${appointmentData.time}:00`);
    if (selectedDateTime < new Date()) {
        showMessage('Cannot book an appointment in the past.', 'error');
        return;
    }


    if (editingAppointmentId) { 
        const appIndex = appointments.findIndex(a => a.id === editingAppointmentId);
        if (appIndex > -1) {
            const petOfAppointment = pets.find(p => p.id === appointments[appIndex].petId);
            if (!currentUser.isAdmin && (!petOfAppointment || petOfAppointment.ownerId !== currentUser.id)) {
                showMessage('You do not have permission to reschedule this appointment.', 'error');
                return;
            }
            appointments[appIndex] = { ...appointments[appIndex], ...appointmentData, status: 'confirmed' }; 
            showMessage('Appointment rescheduled successfully!');
        }
    } else { 
        const newAppointment = { id: generateId(), ...appointmentData, status: 'confirmed' };
        appointments.push(newAppointment);
        showMessage('Appointment booked successfully!');
    }
    
    document.getElementById('bookingForm').reset();
    editingAppointmentId = null;
    document.getElementById('bookingFormTitle').textContent = 'Book New Appointment';
    document.getElementById('bookingSubmitBtn').textContent = 'Book Appointment';
    
    loadUserAppointments();
    if (currentUser.isAdmin) loadAdminAppointments();
    showUserTab('appointments'); 
}

function handleRescheduleAppointment(appointmentId) {
    const appointment = appointments.find(a => a.id === appointmentId);
    const pet = pets.find(p => p.id === appointment.petId);

    if (!currentUser.isAdmin && (!pet || pet.ownerId !== currentUser.id)) {
         showMessage('You do not have permission to reschedule this appointment.', 'error');
         return;
    }
    if (appointment.status !== 'confirmed') {
        showMessage('Only confirmed appointments can be rescheduled.', 'error');
        return;
    }
    showUserTab('book', appointmentId); 
}

function handleCancelAppointment(appointmentId, isAdminCancel = false) {
    const appIndex = appointments.findIndex(a => a.id === appointmentId);
    if (appIndex === -1) return;

    const appointment = appointments[appIndex];
    const pet = pets.find(p => p.id === appointment.petId);

    if (!isAdminCancel && !currentUser.isAdmin && (!pet || pet.ownerId !== currentUser.id)) {
        showMessage('You do not have permission to cancel this appointment.', 'error');
        return;
    }
    
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
        showMessage(`This appointment is already ${appointment.status}.`, 'error');
        return;
    }


    if (confirm('Are you sure you want to cancel this appointment?')) {
        appointments[appIndex].status = 'cancelled';
        showMessage('Appointment cancelled successfully.');
        loadUserAppointments();
        if (currentUser.isAdmin || isAdminCancel) loadAdminAppointments();
    }
}

function handleAdminEditAppointmentStatus(appointmentId) {
    if (!currentUser || !currentUser.isAdmin) return;
    
    editingAppointmentId = appointmentId;
    const appointment = appointments.find(a => a.id === editingAppointmentId);
    if (!appointment) return;

    showUserTab('book', appointmentId); 
    
    const bookingFormTitle = document.getElementById('bookingFormTitle');
    const bookingSubmitBtn = document.getElementById('bookingSubmitBtn');
    const appointmentStatusGroup = document.getElementById('appointmentStatusGroup');
    const appointmentStatusSelect = document.getElementById('appointmentStatus');

    bookingFormTitle.textContent = 'Edit Appointment Status (Admin)';
    bookingSubmitBtn.textContent = 'Save Status';
    appointmentStatusSelect.value = appointment.status;
    appointmentStatusGroup.style.display = 'block'; 

    const bookingForm = document.getElementById('bookingForm');
    const tempSubmitHandler = (event) => {
        event.preventDefault();
        const newStatus = appointmentStatusSelect.value;
        const appIndex = appointments.findIndex(a => a.id === editingAppointmentId);
        if (appIndex > -1) {
            appointments[appIndex].status = newStatus;
            showMessage(`Appointment status updated to ${newStatus}.`);
        }
        bookingForm.removeEventListener('submit', tempSubmitHandler);
        bookingForm.addEventListener('submit', handleBookingFormSubmit); 
        appointmentStatusGroup.style.display = 'none';
        editingAppointmentId = null;
        loadAdminAppointments();
        loadUserAppointments(); 
        showAdminTab('appointments'); 
    };
    
    bookingForm.removeEventListener('submit', handleBookingFormSubmit); 
    bookingForm.addEventListener('submit', tempSubmitHandler);
}


// hamburger
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

function toggleMobileMenu() {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
}
function closeMobileMenu() {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}


document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginNavBtn').addEventListener('click', showLoginModal);
    document.getElementById('signupNavBtn').addEventListener('click', showSignupModal);
    document.getElementById('heroBookAppointmentBtn').addEventListener('click', showBookingPromptModal);

    document.querySelectorAll('.close[data-modal-id]').forEach(btn => {
        btn.addEventListener('click', () => hideModal(btn.dataset.modalId));
    });
    window.addEventListener('click', (event) => { 
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) {
                hideModal(modal.id);
            }
        });
    });

    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        login(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value);
    });
    document.getElementById('signupForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const userData = {
            firstName: document.getElementById('firstName').value.trim(),
            middleInitial: document.getElementById('middleInitial').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            suffix: document.getElementById('suffix').value.trim(),
            email: document.getElementById('signupEmail').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            password: document.getElementById('signupPassword').value
        };
        if (!userData.firstName || !userData.lastName || !userData.email || !userData.phone || userData.password.length < 6) {
            showMessage('Please fill all required fields. Password must be at least 6 characters.', 'error');
            return;
        }
        signup(userData);
    });

    document.getElementById('addPetForm').addEventListener('submit', handleAddPetFormSubmit);
    document.getElementById('addVetForm').addEventListener('submit', handleAddVetFormSubmit);
    document.getElementById('bookingForm').addEventListener('submit', handleBookingFormSubmit);

    document.getElementById('switchToSignupLink').addEventListener('click', (e) => { e.preventDefault(); showSignupModal(); });
    document.getElementById('switchToLoginLink').addEventListener('click', (e) => { e.preventDefault(); showLoginModal(); });
    
    document.getElementById('bookingModalSignupBtn').addEventListener('click', showSignupModal);
    document.getElementById('bookingModalLoginBtn').addEventListener('click', showLoginModal);

    document.getElementById('logoutUserBtn').addEventListener('click', logout);
    document.getElementById('logoutAdminBtn').addEventListener('click', logout);
    document.getElementById('userAddPetBtn').addEventListener('click', () => showAddPetModal());
    document.getElementById('adminAddVetBtn').addEventListener('click', () => showAddVetModal());

    document.querySelectorAll('#userDashboard .tab-btn').forEach(button => {
        button.addEventListener('click', () => showUserTab(button.dataset.tab));
    });
    document.querySelectorAll('#adminDashboard .tab-btn').forEach(button => {
        button.addEventListener('click', () => showAdminTab(button.dataset.adminTab));
    });

    hamburger.addEventListener('click', toggleMobileMenu);
    document.querySelectorAll('.nav-menu .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
            const sectionId = link.getAttribute('href').substring(1);
            if (document.getElementById(sectionId)) {
                setTimeout(() => scrollToSection(sectionId), 50);
            }
        });
    });


    loadVetsDisplay(); 
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    updateNavForLoggedOutUser(); 
});

