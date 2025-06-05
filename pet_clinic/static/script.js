// data storage (in memory)
let currentUser = null;
let pets = [];
let vets = [];
let appointments = [];

let editingPetId = null;
let editingVetId = null;
let editingAppointmentId = null;

// API endpoints
const API = {
    register: '/api/register/',
    login: '/api/login/',
    logout: '/api/logout/',
    pets: '/api/pets/',
    addPet: '/api/pets/add/',
    updatePet: '/api/pets/update/',
    deletePet: '/api/pets/delete/',
    vets: '/api/vets/',
    addVet: '/api/vets/add/',
    updateVet: '/api/vets/update/',
    deleteVet: '/api/vets/delete/',
    appointments: '/api/appointments/',
    bookAppointment: '/api/appointments/book/',
    updateAppointmentStatus: '/api/appointments/',
    checkSession: '/api/check-session/'
};

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
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString(undefined, options);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
    }
}

function formatTime(timeString) {
    if (!timeString) return 'N/A';
    try {
        const [hours, minutes] = timeString.split(':');
        const h = parseInt(hours);
        if (isNaN(h)) return 'Invalid Time';
        const ampm = h >= 12 ? 'PM' : 'AM';
        const formattedHours = h % 12 === 0 ? 12 : h % 12;
        return `${formattedHours}:${minutes} ${ampm}`;
    } catch (error) {
        console.error('Error formatting time:', error);
        return 'Invalid Time';
    }
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
            document.getElementById('specialization').value = Array.isArray(vet.specializations) ? vet.specializations.join(', ') : '';
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

// Authentication functions
async function loginUser(credentials) {
    try {
        console.log('Attempting to login with email:', credentials.email);
        
        // Validate required fields
        if (!credentials.email || !credentials.password) {
            showMessage('Please enter both email and password', 'error');
            return false;
        }

        const response = await fetch(API.login, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(credentials)
        });

        console.log('Login response status:', response.status);
        const data = await response.json();
        console.log('Login response data:', data);

        if (data.status === 'success') {
            currentUser = {
                id: data.user.id,  // Make sure we have the user's ID
                name: data.user.name,
                email: data.user.email,
                isAdmin: data.user.isAdmin
            };
            console.log('Login successful, current user:', currentUser);
            
            // Hide the login modal
            hideModal('loginModal');
            
            // Show appropriate dashboard
            if (currentUser.isAdmin) {
                document.getElementById('userDashboard').style.display = 'none';
                document.getElementById('adminDashboard').style.display = 'block';
                document.getElementById('userName').textContent = currentUser.name;
                await loadAdminData();
                showAdminTab('pets');
            } else {
                document.getElementById('adminDashboard').style.display = 'none';
                document.getElementById('userDashboard').style.display = 'block';
                document.getElementById('userName').textContent = currentUser.name;
                await loadUserData();
                showUserTab('pets');
            }
            
            // Hide homepage sections
            hideHomepageSections();
            
            // Update navigation
            updateNavForLoggedInUser();
            
            showMessage(`Welcome back, ${currentUser.name}!`);
            return true;
        }
        showMessage(data.message || 'Login failed', 'error');
        return false;
    } catch (error) {
        console.error('Login error:', error);
        showMessage('An error occurred during login', 'error');
        return false;
    }
}

async function registerUser(userData) {
    try {
        console.log('Attempting to register with data:', userData);
        
        // Validate required fields
        if (!userData.firstName || !userData.lastName || !userData.email || !userData.phone || !userData.password) {
            showMessage('Please fill in all required fields', 'error');
            return false;
        }

        const response = await fetch(API.register, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')  // Add CSRF token
            },
            body: JSON.stringify(userData)
        });

        console.log('Registration response status:', response.status);
        const data = await response.json();
        console.log('Registration response data:', data);

        if (data.status === 'success') {
            hideModal('signupModal');
            showMessage('Registration successful! Please login.', 'success');
            showLoginModal();
            return true;
        }
        showMessage(data.message || 'Registration failed', 'error');
        return false;
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('An error occurred during registration', 'error');
        return false;
    }
}

// Add CSRF token helper function
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

async function logoutUser() {
    try {
        const response = await fetch(API.logout, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        const responseData = await response.json();
        if (responseData.status === 'success') {
            currentUser = null;
            hideAllDashboards();
            showHomepageSections();
            updateNavForLoggedOutUser();
            showMessage('Logged out successfully');
            // Reset the display of the homepage sections
            document.getElementById('home').style.display = 'block';
            document.getElementById('services').style.display = 'block';
            document.getElementById('vets').style.display = 'block';
            document.getElementById('about').style.display = 'block';
            // Show the navigation bar
            document.querySelector('nav').style.display = 'flex';
        } else {
            showMessage(responseData.message || 'Logout failed', 'error');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showMessage('An error occurred during logout', 'error');
    }
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
        if (el) el.style.display = '';
    });
    loadVetsDisplay(); 
}

function hideAllDashboards() {
    document.getElementById('userDashboard').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'none';
}

// tab
async function showUserTab(tabName, appointmentToEditId = null) {
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
        await loadBookingForm();
        if (editingAppointmentId) {
            const appointment = appointments.find(a => a.id === editingAppointmentId);
            if (appointment) {
                // Wait for the next tick to ensure form elements are loaded
                setTimeout(() => {
                    document.getElementById('petSelect').value = appointment.petId;
                    document.getElementById('vetSelect').value = appointment.vetId;
                    document.getElementById('appointmentDate').value = appointment.date;
                    document.getElementById('appointmentTime').value = appointment.time;
                    document.getElementById('reason').value = appointment.reason;
                    bookingFormTitle.textContent = 'Reschedule Appointment';
                    bookingSubmitBtn.textContent = 'Update Appointment';
                    appointmentStatusGroup.style.display = 'none';
                }, 0);
            }
        } else {
            // Reset form and UI elements for new appointment
            document.getElementById('bookingForm').reset();
            document.getElementById('petSelect').value = '';
            document.getElementById('vetSelect').value = '';
            document.getElementById('appointmentDate').value = '';
            document.getElementById('appointmentTime').value = '';
            document.getElementById('reason').value = '';
            bookingFormTitle.textContent = 'Book New Appointment';
            bookingSubmitBtn.textContent = 'Book Appointment';
            appointmentStatusGroup.style.display = 'none';
        }
    }
    localStorage.setItem('lastUserTab', tabName);
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
    localStorage.setItem('lastAdminTab', tabName);
}


// data loading functions
async function loadUserData() {
    await loadUserPets();
    await loadUserAppointments();
    await loadBookingForm();
}

async function loadAdminData() {
    await loadAdminPets();
    await loadAdminVets();
    await loadAdminAppointments();
}

function createPetCardHTML(pet, isUserView = true) {
    return `
        <div class="admin-card pet-admin-card" data-pet-id="${pet.id}">
            <div class="pet-card">
                <div class="pet-avatar">
                    <i class="fas fa-paw"></i>
                </div>
                <h3>${pet.name}</h3>
                <div class="pet-species">${pet.species}</div>
                <p><strong>Breed:</strong> ${pet.breed}</p>
                <p><strong>Age:</strong> ${pet.age || 'Not specified'} years</p>
                ${!isUserView ? `<p><strong>Owner:</strong> ${pet.ownerName || 'Unknown'}</p>` : ''}
                <div class="pet-actions">
                    <button class="btn-small btn-edit" onclick="handleEditPet(${pet.id})">Edit</button>
                    <button class="btn-small btn-delete" onclick="handleDeletePet(${pet.id})">Delete</button>
                </div>
            </div>
        </div>`;
}

async function loadUserPets() {
    try {
        const response = await fetch(API.pets);
        const data = await response.json();
        if (data.status === 'success') {
            pets = data.pets;
            const petsList = document.getElementById('petsList');
            petsList.innerHTML = '';
            
            if (pets.length === 0) {
                petsList.innerHTML = `<div class="empty-state"><i class="fas fa-paw"></i><h3>No pets registered</h3><p>Add your first pet to get started!</p><button class="btn-primary" onclick="showAddPetModal()">Add First Pet</button></div>`;
                return;
            }
            pets.forEach(pet => petsList.innerHTML += createPetCardHTML(pet, true));
        }
    } catch (error) {
        console.error('Error loading pets:', error);
        showMessage('Error loading pets. Please try again later.', 'error');
    }
}

async function loadAdminPets() {
    try {
        const response = await fetch(API.pets);
        const data = await response.json();
        if (data.status === 'success') {
            pets = data.pets;
            const adminPetsList = document.getElementById('adminPetsList');
            adminPetsList.innerHTML = '';
            
            if (pets.length === 0) {
                adminPetsList.innerHTML = `<div class="empty-state"><i class="fas fa-paw"></i><h3>No pets in the system</h3><p>Pets will appear here as they are registered by users.</p></div>`;
                return;
            }
            pets.forEach(pet => adminPetsList.innerHTML += createPetCardHTML(pet, false));
        }
    } catch (error) {
        console.error('Error loading pets:', error);
        showMessage('Error loading pets. Please try again later.', 'error');
    }
}

function createVetAdminCardHTML(vet) {
    return `
        <div class="admin-card vet-admin-card" data-vet-id="${vet.id}">
            <div class="vet-card">
                <div class="pet-avatar vet-avatar">
                    <i class="fas fa-user-md"></i>
                </div>
                <h3>${vet.name}</h3>
                <div class="vet-specialization">
                    ${Array.isArray(vet.specializations) ? vet.specializations.join(', ') : ''}
                </div>
                <p><strong>Experience:</strong> ${vet.experience} years</p>
                <p class="vet-bio">${vet.bio}</p>
                <div class="pet-actions">
                    <button class="btn-small btn-edit" onclick="handleEditVet(${vet.id})">Edit</button>
                    <button class="btn-small btn-delete" onclick="handleDeleteVet(${vet.id})">Delete</button>
                </div>
            </div>
        </div>`;
}

async function loadAdminVets() {
    try {
        console.log('Fetching vets for admin from:', API.vets);
        const response = await fetch(API.vets, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        console.log('Admin vets response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Admin vets data:', data);

        if (data.status === 'success') {
            vets = data.vets;
            const adminVetsList = document.getElementById('adminVetsList');
            if (!adminVetsList) {
                console.error('Admin vets list element not found');
                return;
            }
            adminVetsList.innerHTML = '';
            
            if (!vets || vets.length === 0) {
                adminVetsList.innerHTML = `<div class="empty-state"><i class="fas fa-user-md"></i><h3>No veterinarians in the system.</h3><p>Add veterinarians to make them available for appointments.</p><button class="btn-primary" onclick="showAddVetModal()">Add First Veterinarian</button></div>`;
                return;
            }

            vets.forEach(vet => {
                console.log('Admin vet data:', vet);
                console.log('Admin vet name:', vet.name);
                console.log('Admin vet specializations:', vet.specializations);
                console.log('Admin vet experience:', vet.experience);
                console.log('Admin vet bio:', vet.bio);

                adminVetsList.innerHTML += `
                    <div class="admin-card vet-admin-card" data-vet-id="${vet.id}">
                        <div class="vet-card">
                            <div class="pet-avatar vet-avatar">
                                <i class="fas fa-user-md"></i>
                            </div>
                            <h3>${vet.name || 'Unnamed Veterinarian'}</h3>
                            <div class="vet-specialization">${vet.specializations ? vet.specializations.join(', ') : 'General Practice'}</div>
                            <p><strong>Experience:</strong> ${vet.experience || 'Not specified'} years</p>
                            <p class="vet-bio">${vet.bio || 'No bio available'}</p>
                            <div class="pet-actions">
                                <button class="btn-small btn-edit" onclick="handleEditVet(${vet.id})">Edit</button>
                                <button class="btn-small btn-delete" onclick="handleDeleteVet(${vet.id})">Delete</button>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            console.error('Failed to load admin vets:', data.message);
            showMessage(data.message || 'Error loading veterinarians', 'error');
        }
    } catch (error) {
        console.error('Error in loadAdminVets:', error);
        showMessage('Error loading veterinarians. Please try again later.', 'error');
    }
}

function createAppointmentCardHTML(appointment, isUserView = true) {
    const pet = pets.find(p => p.id === appointment.petId);
    const vet = vets.find(v => v.id === appointment.vetId);
    
    const petName = pet ? pet.name : 'Unknown Pet';
    const vetName = vet ? vet.name : 'Unknown Vet';
    const statusDisplay = appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1);

    let actionButtons = '';
    if (isUserView) {
        if (appointment.status === 'confirmed') {
            actionButtons = `
                <div class="appointment-actions">
                    <button class="btn-small btn-edit" onclick="handleRescheduleAppointment(${appointment.id})">Reschedule</button>
                    <button class="btn-small btn-delete" onclick="handleCancelAppointment(${appointment.id})">Cancel</button>
                </div>
            `;
        } else if (appointment.status === 'cancelled') {
            actionButtons = `
                <div class="appointment-actions">
                    <button class="btn-small btn-delete" onclick="handleDeleteAppointment(${appointment.id})">Delete</button>
                </div>
            `;
        }
    } else {
        // Admin view
        if (appointment.status === 'confirmed') {
            actionButtons = `
                <div class="appointment-actions">
                    <button class="btn-small btn-edit" onclick="handleUpdateAppointmentStatus(${appointment.id}, 'completed')">Mark Completed</button>
                    <button class="btn-small btn-delete" onclick="handleCancelAppointment(${appointment.id}, true)">Cancel</button>
                </div>
            `;
        } else if (appointment.status === 'completed') {
            actionButtons = `
                <div class="appointment-actions">
                    <button class="btn-small" disabled>Completed</button>
                </div>
            `;
        } else if (appointment.status === 'cancelled') {
            actionButtons = `
                <div class="appointment-actions">
                    <button class="btn-small btn-delete" onclick="handleDeleteAppointment(${appointment.id})">Delete</button>
                </div>
            `;
        }
    }

    return `
        <div class="appointment-card" data-appointment-id="${appointment.id}">
            <div class="appointment-header">
                <h3>${petName}</h3>
                <span class="appointment-status ${appointment.status}">${statusDisplay}</span>
            </div>
            <div class="appointment-details">
                <div class="appointment-detail">
                    <strong>Date</strong>
                    <span>${appointment.date}</span>
                </div>
                <div class="appointment-detail">
                    <strong>Time</strong>
                    <span>${appointment.time}</span>
                </div>
                <div class="appointment-detail">
                    <strong>Veterinarian</strong>
                    <span>${vetName}</span>
                </div>
                <div class="appointment-detail">
                    <strong>Reason</strong>
                    <span>${appointment.reason}</span>
                </div>
                ${!isUserView ? `
                <div class="appointment-detail">
                    <strong>Owner</strong>
                    <span>${appointment.ownerName || 'Unknown'}</span>
                </div>
                ` : ''}
            </div>
            ${actionButtons}
        </div>`;
}

async function loadUserAppointments() {
    try {
        const response = await fetch(API.appointments);
        const data = await response.json();
        if (data.status === 'success') {
            appointments = data.appointments;
            const appointmentsList = document.getElementById('appointmentsList');
            appointmentsList.innerHTML = '';

            if (appointments.length === 0) {
                appointmentsList.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-times"></i><h3>No upcoming appointments</h3><p>Book an appointment for your pet today!</p><button class="btn-primary" onclick="showUserTab('book')">Book Appointment</button></div>`;
                return;
            }
            appointments.forEach(app => appointmentsList.innerHTML += createAppointmentCardHTML(app, true));
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        showMessage('Error loading appointments. Please try again later.', 'error');
    }
}

async function loadAdminAppointments() {
    try {
        const response = await fetch(API.appointments);
        const data = await response.json();
        if (data.status === 'success') {
            appointments = data.appointments;
            const adminAppointmentsList = document.getElementById('adminAppointmentsList');
            adminAppointmentsList.innerHTML = '';

            if (appointments.length === 0) {
                adminAppointmentsList.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-check"></i><h3>No appointments in the system</h3><p>Appointments will appear here as they are booked.</p></div>`;
                return;
            }
            appointments.forEach(app => adminAppointmentsList.innerHTML += createAppointmentCardHTML(app, false));
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        showMessage('Error loading appointments. Please try again later.', 'error');
    }
}

async function loadBookingForm() {
    try {
        const [petsResponse, vetsResponse] = await Promise.all([
            fetch(API.pets),
            fetch(API.vets)
        ]);
        
        const petsData = await petsResponse.json();
        const vetsData = await vetsResponse.json();
        
        if (petsData.status === 'success' && vetsData.status === 'success') {
            const userPets = petsData.pets;
            const petSelect = document.getElementById('petSelect');
            petSelect.innerHTML = '<option value="">Choose a pet...</option>' + 
                userPets.map(pet => `<option value="${pet.id}">${pet.name} (${pet.species})</option>`).join('');
            
            const vetSelect = document.getElementById('vetSelect');
            vetSelect.innerHTML = '<option value="">Choose a veterinarian...</option>' + 
                vetsData.vets.map(vet => `<option value="${vet.id}">${vet.name} - ${vet.specializations.join(', ')}</option>`).join('');
            
            const today = new Date();
            today.setDate(today.getDate()); 
            document.getElementById('appointmentDate').min = today.toISOString().split('T')[0];
        }
    } catch (error) {
        showMessage('Error loading booking form data', 'error');
    }
}

async function loadVetsDisplay() {
    try {
        console.log('Fetching vets from:', API.vets);
        const response = await fetch(API.vets, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            }
        });
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Raw vets data:', data);

        if (data.status === 'success') {
            vets = data.vets;
            console.log('Processed vets array:', vets);

            const vetsGrid = document.getElementById('vetsGrid');
            if (!vetsGrid) {
                console.error('Vets grid element not found');
                return;
            }
            vetsGrid.innerHTML = '';
            
            if (!vets || vets.length === 0) {
                vetsGrid.innerHTML = "<p>No veterinarians currently listed. Please check back later.</p>";
                return;
            }

            vets.forEach((vet, index) => {
                console.log(`Vet ${index} data:`, vet);
                console.log('Vet name:', vet.name);
                console.log('Vet specializations:', vet.specializations);
                console.log('Vet experience:', vet.experience);
                console.log('Vet bio:', vet.bio);

                vetsGrid.innerHTML += `
                    <div class="vet-card">
                        <div class="vet-avatar">
                            <i class="fas fa-user-md"></i>
                        </div>
                        <h3>${vet.name || 'Unnamed Veterinarian'}</h3>
                        <div class="vet-specialization">${vet.specializations ? vet.specializations.join(', ') : 'General Practice'}</div>
                        <p><strong> ${vet.experience || 'Not specified'} years of experience</strong></p>
                        <p class="vet-bio"> ${vet.bio || 'No bio available'}</p>
                    </div>
                `;
            });
        } else {
            console.error('Failed to load vets:', data.message);
            showMessage(data.message || 'Error loading veterinarians', 'error');
        }
    } catch (error) {
        console.error('Error in loadVetsDisplay:', error);
        showMessage('Error loading veterinarians. Please try again later.', 'error');
    }
}


// crud

// pet crud
async function handleEditPet(petId) {
    try {
        console.log('Attempting to edit pet:', petId);
        const pet = pets.find(p => p.id === petId);
        if (!pet) {
            console.error('Pet not found:', petId);
            showMessage('Pet not found.', 'error');
            return;
        }

        // Show the edit modal with current pet data
        showAddPetModal(petId);
        
        // Update form fields with current pet data
        document.getElementById('petName').value = pet.name;
        // Set the species dropdown to the current pet's species
        const speciesSelect = document.getElementById('species');
        const speciesValue = pet.species.toLowerCase();
        console.log('Setting species to:', speciesValue);
        Array.from(speciesSelect.options).forEach(option => {
            if (option.value.toLowerCase() === speciesValue) {
                speciesSelect.value = option.value;
            }
        });
        document.getElementById('breed').value = pet.breed;
        document.getElementById('age').value = pet.age || '';
        
        // Update modal title and submit button
        document.getElementById('petModalTitle').textContent = 'Edit Pet Details';
        document.getElementById('petFormSubmitBtn').textContent = 'Save Changes';
    } catch (error) {
        console.error('Error preparing pet edit:', error);
        showMessage('Error preparing pet edit', 'error');
    }
}

async function handleDeletePet(petId) {
    try {
        console.log('Attempting to delete pet:', petId);
        const pet = pets.find(p => p.id === petId);
        if (!pet) {
            console.error('Pet not found:', petId);
            showMessage('Pet not found.', 'error');
            return;
        }

        if (confirm(`Are you sure you want to delete ${pet.name}? This will also cancel associated appointments.`)) {
            const response = await fetch(`${API.deletePet}${petId}/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                }
            });

            console.log('Delete response status:', response.status);
            const data = await response.json();
            console.log('Delete response data:', data);

            if (data.status === 'success') {
                showMessage('Pet deleted successfully!');
                // Refresh the pets list
                if (currentUser.isAdmin) {
                    await loadAdminPets();
                } else {
                    await loadUserPets();
                }
                // Refresh appointments as they might be affected
                await loadUserAppointments();
                if (currentUser.isAdmin) {
                    await loadAdminAppointments();
                }
                // Refresh booking form as pet options might have changed
                await loadBookingForm();
            } else {
                showMessage(data.message || 'Failed to delete pet', 'error');
            }
        }
    } catch (error) {
        console.error('Error deleting pet:', error);
        showMessage('An error occurred while deleting the pet', 'error');
    }
}

async function handleAddPetFormSubmit(event) {
    event.preventDefault();
    const ageValue = document.getElementById('age').value;
    const petData = {
        name: document.getElementById('petName').value.trim(),
        species: document.getElementById('species').value.toLowerCase(),
        breed: document.getElementById('breed').value.trim(),
        age: ageValue ? parseInt(ageValue) : null
    };

    if (!petData.name || !petData.species || !petData.breed) {
        showMessage('Please fill in all required fields for the pet.', 'error');
        return;
    }

    if (petData.age !== null && (isNaN(petData.age) || petData.age < 0)) {
        showMessage('Please enter a valid age (0 or greater).', 'error');
        return;
    }

    try {
        let url, method;
        if (editingPetId) {
            url = `${API.updatePet}${editingPetId}/`;
            method = 'PUT';
            petData.id = editingPetId;
        } else {
            url = API.addPet;
            method = 'POST';
        }

        console.log('Sending pet data:', petData);
        console.log('Request URL:', url);
        console.log('Request method:', method);

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(petData)
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Server response:', data);

        if (data.status === 'success') {
            showMessage(editingPetId ? 'Pet updated successfully!' : 'Pet added successfully!');
            hideModal('addPetModal');
            
            // Reset form and editing state
            document.getElementById('addPetForm').reset();
            editingPetId = null;
            document.getElementById('petModalTitle').textContent = 'Add New Pet';
            document.getElementById('petFormSubmitBtn').textContent = 'Add Pet';
            
            // Refresh the pets list
            if (currentUser.isAdmin) {
                await loadAdminPets();
            } else {
                await loadUserPets();
            }
            // Refresh booking form as pet options might have changed
            await loadBookingForm();
        } else {
            showMessage(data.message || (editingPetId ? 'Failed to update pet' : 'Failed to add pet'), 'error');
        }
    } catch (error) {
        console.error('Error saving pet:', error);
        showMessage('An error occurred while saving the pet', 'error');
    }
}

// vet crud in admin
function handleAddVetFormSubmit(event) {
    event.preventDefault();
    if (!currentUser || !currentUser.isAdmin) return;

    const specializationText = document.getElementById('specialization').value.trim();
    const specializations = specializationText.split(',').map(s => s.trim()).filter(s => s);

    const vetData = {
        name: document.getElementById('vetName').value.trim(),
        specializations: specializations,
        experience: parseInt(document.getElementById('experience').value) || 0,
        bio: document.getElementById('bio').value.trim()
    };

    console.log('Submitting vet data:', vetData);

    if (!vetData.name || specializations.length === 0 || !vetData.bio) {
        showMessage('Please fill all required fields for the veterinarian.', 'error');
        return;
    }

    try {
        const url = editingVetId ? `${API.updateVet}${editingVetId}/` : API.addVet;
        const method = editingVetId ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(vetData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Server response:', data);
            if (data.status === 'success') {
                showMessage(editingVetId ? 'Veterinarian updated successfully!' : 'Veterinarian added successfully!');
                hideModal('addVetModal');
                editingVetId = null;
                loadAdminVets();
                loadVetsDisplay();
                loadBookingForm();
            } else {
                showMessage(data.message || 'Failed to save veterinarian', 'error');
            }
        })
        .catch(error => {
            console.error('Error saving veterinarian:', error);
            showMessage('An error occurred while saving the veterinarian', 'error');
        });
    } catch (error) {
        console.error('Error in form submission:', error);
        showMessage('An error occurred while submitting the form', 'error');
    }
}

function handleEditVet(vetId) {
    if (!currentUser || !currentUser.isAdmin) return;
    showAddVetModal(vetId);
}

function handleDeleteVet(vetId) {
    if (!currentUser || !currentUser.isAdmin) return;
    
    if (confirm('Are you sure you want to delete this veterinarian? This action cannot be undone.')) {
        fetch(`${API.deleteVet}${vetId}/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showMessage('Veterinarian deleted successfully!');
                loadAdminVets();
                loadVetsDisplay();
                loadBookingForm();
            } else {
                showMessage(data.message || 'Failed to delete veterinarian', 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting veterinarian:', error);
            showMessage('An error occurred while deleting the veterinarian', 'error');
        });
    }
}

// appointment crud
async function handleBookingFormSubmit(event) {
    event.preventDefault();
    const appointmentData = {
        pet_id: parseInt(document.getElementById('petSelect').value),
        vet_id: parseInt(document.getElementById('vetSelect').value),
        date: document.getElementById('appointmentDate').value,
        time: document.getElementById('appointmentTime').value,
        reason: document.getElementById('reason').value.trim(),
    };

    if (!appointmentData.pet_id || !appointmentData.vet_id || !appointmentData.date || !appointmentData.time || !appointmentData.reason) {
        showMessage('Please fill all appointment details.', 'error');
        return;
    }
    
    const selectedDateTime = new Date(`${appointmentData.date}T${appointmentData.time}:00`);
    if (selectedDateTime < new Date()) {
        showMessage('Cannot book an appointment in the past.', 'error');
        return;
    }

    try {
        if (editingAppointmentId) {
            // Rescheduling existing appointment
            const response = await fetch(`${API.appointments}${editingAppointmentId}/update/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(appointmentData)
            });
            
            const data = await response.json();
            if (data.status === 'success') {
                showMessage('Appointment rescheduled successfully!');
                await loadUserAppointments();
                if (currentUser.isAdmin) await loadAdminAppointments();
            } else {
                showMessage(data.message || 'Failed to reschedule appointment', 'error');
                return;
            }
        } else {
            // Creating new appointment
            const response = await fetch(API.bookAppointment, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(appointmentData)
            });
            
            const data = await response.json();
            if (data.status === 'success') {
                showMessage('Appointment booked successfully!');
                // Add the new appointment to the local array
                appointments.push({
                    id: data.appointment.id,
                    petId: appointmentData.pet_id,
                    vetId: appointmentData.vet_id,
                    date: appointmentData.date,
                    time: appointmentData.time,
                    reason: appointmentData.reason,
                    status: 'confirmed'
                });
                // Refresh the appointments list
                await loadUserAppointments();
                if (currentUser.isAdmin) await loadAdminAppointments();
            } else {
                showMessage(data.message || 'Failed to book appointment', 'error');
                return;
            }
        }
        
        // Reset form and UI elements
        document.getElementById('bookingForm').reset();
        document.getElementById('petSelect').value = '';
        document.getElementById('vetSelect').value = '';
        document.getElementById('appointmentDate').value = '';
        document.getElementById('appointmentTime').value = '';
        document.getElementById('reason').value = '';
        editingAppointmentId = null;
        document.getElementById('bookingFormTitle').textContent = 'Book New Appointment';
        document.getElementById('bookingSubmitBtn').textContent = 'Book Appointment';
        
        // Switch to appointments tab to show the new appointment
        showUserTab('appointments');
    } catch (error) {
        console.error('Error processing appointment:', error);
        showMessage('An error occurred while processing your request', 'error');
    }
}

async function handleRescheduleAppointment(appointmentId) {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) {
        showMessage('Appointment not found', 'error');
        return;
    }

    const pet = pets.find(p => p.id === appointment.petId);
    if (!currentUser.isAdmin && (!pet || pet.ownerId !== currentUser.id)) {
        showMessage('You do not have permission to reschedule this appointment.', 'error');
        return;
    }
    if (appointment.status !== 'confirmed') {
        showMessage('Only confirmed appointments can be rescheduled.', 'error');
        return;
    }

    // Show the booking tab with the appointment ID
    await showUserTab('book', appointmentId);
}

async function handleCancelAppointment(appointmentId, isAdminCancel = false) {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) {
        showMessage('Appointment not found', 'error');
        return;
    }

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
        try {
            const response = await fetch(`${API.appointments}${appointmentId}/cancel/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                }
            });
            const data = await response.json();
            if (data.status === 'success') {
                showMessage('Appointment cancelled successfully.');
                await loadUserAppointments();
                if (currentUser.isAdmin || isAdminCancel) await loadAdminAppointments();
            } else {
                showMessage(data.message || 'Failed to cancel appointment', 'error');
            }
        } catch (error) {
            showMessage('An error occurred while cancelling the appointment', 'error');
        }
    }
}

async function handleAdminEditAppointmentStatus(appointmentId) {
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
    const tempSubmitHandler = async (event) => {
        event.preventDefault();
        const newStatus = appointmentStatusSelect.value;
        
        try {
            const response = await fetch(`${API.appointments}${editingAppointmentId}/update-status/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            const data = await response.json();
            if (data.status === 'success') {
                showMessage(`Appointment status updated to ${newStatus}.`);
                await loadAdminAppointments();
                await loadUserAppointments();
                showAdminTab('appointments');
            } else {
                showMessage(data.message || 'Failed to update appointment status', 'error');
            }
        } catch (error) {
            showMessage('An error occurred while updating the appointment status', 'error');
        }
        
        bookingForm.removeEventListener('submit', tempSubmitHandler);
        bookingForm.addEventListener('submit', handleBookingFormSubmit); 
        appointmentStatusGroup.style.display = 'none';
        editingAppointmentId = null;
    };
    
    bookingForm.removeEventListener('submit', handleBookingFormSubmit); 
    bookingForm.addEventListener('submit', tempSubmitHandler);
}

async function handleDeleteAppointment(appointmentId) {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) {
        showMessage('Appointment not found', 'error');
        return;
    }

    if (appointment.status !== 'cancelled') {
        showMessage('Only cancelled appointments can be deleted', 'error');
        return;
    }

    if (confirm('Are you sure you want to permanently delete this appointment? This action cannot be undone.')) {
        try {
            const response = await fetch(`${API.appointments}${appointmentId}/delete/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                }
            });
            const data = await response.json();
            if (data.status === 'success') {
                showMessage('Appointment deleted successfully');
                // Remove from local array
                appointments = appointments.filter(a => a.id !== appointmentId);
                // Refresh the appointments list
                await loadUserAppointments();
                if (currentUser.isAdmin) await loadAdminAppointments();
            } else {
                showMessage(data.message || 'Failed to delete appointment', 'error');
            }
        } catch (error) {
            showMessage('An error occurred while deleting the appointment', 'error');
        }
    }
}

async function handleUpdateAppointmentStatus(appointmentId, newStatus) {
    if (!currentUser || !currentUser.isAdmin) return;
    
    try {
        const response = await fetch(`${API.updateAppointmentStatus}${appointmentId}/update-status/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        const data = await response.json();
        if (data.status === 'success') {
            showMessage('Appointment status updated successfully!');
            await loadAdminAppointments();
            await loadUserAppointments();
        } else {
            showMessage(data.message || 'Failed to update appointment status', 'error');
        }
    } catch (error) {
        console.error('Error updating appointment status:', error);
        showMessage('An error occurred while updating the appointment status', 'error');
    }
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
    checkUserSession();
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
        const credentials = {
            email: document.getElementById('loginEmail').value,
            password: document.getElementById('loginPassword').value
        };
        loginUser(credentials);
    });
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const userData = {
            firstName: document.getElementById('firstName').value,
            middleInitial: document.getElementById('middleInitial').value,
            lastName: document.getElementById('lastName').value,
            suffix: document.getElementById('suffix').value,
            email: document.getElementById('signupEmail').value,
            phone: document.getElementById('phone').value,
            password: document.getElementById('signupPassword').value
        };
        const success = await registerUser(userData);
        if (success) {
            document.getElementById('signupForm').reset();
        }
    });

    document.getElementById('addPetForm').addEventListener('submit', handleAddPetFormSubmit);
    document.getElementById('addVetForm').addEventListener('submit', handleAddVetFormSubmit);
    document.getElementById('bookingForm').addEventListener('submit', handleBookingFormSubmit);

    document.getElementById('switchToSignupLink').addEventListener('click', (e) => { e.preventDefault(); showSignupModal(); });
    document.getElementById('switchToLoginLink').addEventListener('click', (e) => { e.preventDefault(); showLoginModal(); });
    
    document.getElementById('bookingModalSignupBtn').addEventListener('click', showSignupModal);
    document.getElementById('bookingModalLoginBtn').addEventListener('click', showLoginModal);

    document.getElementById('logoutUserBtn').addEventListener('click', logoutUser);
    document.getElementById('logoutAdminBtn').addEventListener('click', logoutUser);
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

async function checkUserSession() {
    try {
        const response = await fetch(API.checkSession);
        const data = await response.json();
        console.log('Session check response:', data);
        if (data.isLoggedIn) {
            currentUser = data.user;
            document.querySelector('nav').style.display = 'none';
            if (data.user.role === 'admin') {
                document.getElementById('adminDashboard').style.display = 'block';
                document.getElementById('userDashboard').style.display = 'none';
                
                const adminNameElement = document.getElementById('adminName');
                if (adminNameElement) {
                    adminNameElement.textContent = currentUser.name;
                }
                await loadAdminData();
                showAdminTab(localStorage.getItem('lastAdminTab') || 'pets');
            } else {
                document.getElementById('userDashboard').style.display = 'block';
                document.getElementById('adminDashboard').style.display = 'none';
                const userNameElement = document.getElementById('userName');
                if (userNameElement) {
                    userNameElement.textContent = currentUser.name;
                }
                await loadUserData();
                showUserTab(localStorage.getItem('lastUserTab') || 'pets');
            }
            // Ensure the dashboard is visible and homepage sections are hidden
            document.getElementById('home').style.display = 'none';
            document.getElementById('services').style.display = 'none';
            document.getElementById('vets').style.display = 'none';
            document.getElementById('about').style.display = 'none';
        } else {
            showHomepageSections();
            updateNavForLoggedOutUser();
            document.querySelector('nav').style.display = '';
            console.log('Navigation bar display set to:', document.querySelector('nav').style.display);
        }
    } catch (error) {
        console.error('Session check error:', error);
        showMessage('An error occurred while checking the session', 'error');
    }
}

async function addPet(event) {
    event.preventDefault();
    const name = document.getElementById('petName').value;
    const species = document.getElementById('petSpecies').value;
    const breed = document.getElementById('petBreed').value;
    const age = document.getElementById('petAge').value;
    const weight = document.getElementById('petWeight').value;
    const owner = document.getElementById('petOwner').value;

    if (!name || !species || !breed || !age || !weight || !owner) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    try {
        const response = await fetch(API.pets, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ name, species, breed, age, weight, owner })
        });

        const data = await response.json();
        if (data.success) {
            showMessage('Pet added successfully!', 'success');
            await loadUserData();
            hideModal('addPetModal');
        } else {
            showMessage(data.message || 'Failed to add pet', 'error');
        }
    } catch (error) {
        console.error('Add pet error:', error);
        showMessage('An error occurred while adding the pet', 'error');
    }
}
