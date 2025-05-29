const urlBase = 'https://21project.site/LAMPAPI';
const extension = 'php';

let userId = 0;
let firstName = "";
let lastName = "";

let deleteContactData = null;
let editContactData = null;

let currentPage = 1;
const contactsPerPage = 10;
let totalResults = 0;

function isValidEmail(email) {
    // Check if email contains @ and has a . after the @
    const atIndex = email.indexOf('@');
    if (atIndex === -1) return false;
    
    const dotIndex = email.indexOf('.', atIndex);
    return dotIndex > atIndex;
}

function checkPasswordRequirements() {
    const password = document.getElementById("registerPassword").value;
    let isValid = true;

    // Check length
    const hasLength = password.length >= 8;
    updateRequirement('lengthCheck', hasLength);
    isValid = isValid && hasLength;

    // Check for letter
    const hasLetter = /[a-zA-Z]/.test(password);
    updateRequirement('letterCheck', hasLetter);
    isValid = isValid && hasLetter;

    // Check for special character
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    updateRequirement('specialCheck', hasSpecial);
    isValid = isValid && hasSpecial;

    // Disable/enable register button based on validation
    const registerBtn = document.querySelector('#registerForm button[type="submit"]');
    if (registerBtn) {
        registerBtn.disabled = !isValid;
    }

    return isValid;
}

function updateRequirement(requirementId, isMet) {
    const requirement = document.getElementById(requirementId);
    if (requirement) {
        const icon = requirement.querySelector('.requirement-icon');
        if (icon) {
            icon.textContent = isMet ? '✅' : '❌';
        }
        requirement.querySelector('small').className = isMet ? 'text-success' : 'text-muted';
    }
}

function doLogin()
{
	userId = 0;
	firstName = "";
	lastName = "";
	
	let login = document.getElementById("loginUsername").value;
	let password = document.getElementById("loginPassword").value;
	let hash = md5(password);
	
	document.getElementById("loginResult").innerHTML = "";

	let tmp = {login:login,password:hash};
	let jsonPayload = JSON.stringify(tmp);
	
	let url = urlBase + '/Login.' + extension;

	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	xhr.setRequestHeader("Accept", "application/json");
	// Add error handling for CORS
	xhr.onerror = function() {
		document.getElementById("loginResult").innerHTML = "Error: Cannot connect to the server";
		document.getElementById("loginResult").style.display = "block";
	};
	
	try
	{
		xhr.onreadystatechange = function() 
		{
			console.log("Ready state:", this.readyState, "Status:", this.status);
			
			if (this.readyState == 4) 
			{
				if (this.status == 200) {
					let jsonObject = JSON.parse(xhr.responseText);
					userId = jsonObject.id;
			
					if( userId < 1 )
					{		
						document.getElementById("loginResult").innerHTML = "Invalid Username or Password";
						document.getElementById("loginResult").style.display = "block";
						return;
					}
			
					firstName = jsonObject.firstName;
					lastName = jsonObject.lastName;

					saveCookie();
		
					window.location.href = "contacts.html";
				} else {
					document.getElementById("loginResult").innerHTML = "Server returned status: " + this.status;
					document.getElementById("loginResult").style.display = "block";
				}
			}
		};
		xhr.send(jsonPayload);
		console.log("Request sent:", jsonPayload);
	}
	catch(err)
	{
		document.getElementById("loginResult").innerHTML = err.message;
		document.getElementById("loginResult").style.display = "block";
		console.error("Login error:", err);
	}
}

function saveCookie()
{
	let minutes = 20;
	let date = new Date();
	date.setTime(date.getTime()+(minutes*60*1000));	
	document.cookie = "firstName=" + firstName + ",lastName=" + lastName + ",userId=" + userId + ";expires=" + date.toGMTString();
}

function readCookie()
{
	userId = -1;
	let data = document.cookie;
	let splits = data.split(",");
	for(var i = 0; i < splits.length; i++) 
	{
		let thisOne = splits[i].trim();
		let tokens = thisOne.split("=");
		if( tokens[0] == "firstName" )
		{
			firstName = tokens[1];
		}
		else if( tokens[0] == "lastName" )
		{
			lastName = tokens[1];
		}
		else if( tokens[0] == "userId" )
		{
			userId = parseInt( tokens[1].trim() );
		}
	}
	
	if( userId < 0 )
	{
		window.location.href = "index.html";
	}
	else
	{
		// Update the welcome message with the user's name
		document.getElementById("userFullName").textContent = firstName;
		
		// Load contacts if search input exists
		let searchInput = document.getElementById("searchInput");
		if (searchInput) {
			searchContacts(searchInput.value);
		}
	}
}

function doLogout()
{
	userId = 0;
	firstName = "";
	lastName = "";
	document.cookie = "firstName= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
	window.location.href = "index.html";
}

function showAddContact() {
    // Clear previous form data and messages
    document.getElementById("addContactForm").reset();
    document.getElementById("addContactResult").style.display = "none";
    
    // Show the modal
    let modal = new bootstrap.Modal(document.getElementById('addContactModal'));
    modal.show();
}

function addContact() {
    let firstName = document.getElementById("firstName").value;
    let lastName = document.getElementById("lastName").value;
    let email = document.getElementById("email").value;
    let phone = document.getElementById("phone").value;

    // Basic validation
    if (!firstName || !lastName || !email || !phone) {
        document.getElementById("addContactResult").innerHTML = "All fields are required";
        document.getElementById("addContactResult").className = "alert alert-danger";
        document.getElementById("addContactResult").style.display = "block";
        return;
    }

    // Check for whitespace-only entries
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
        document.getElementById("addContactResult").innerHTML = "Fields cannot be empty or contain only spaces";
        document.getElementById("addContactResult").className = "alert alert-danger";
        document.getElementById("addContactResult").style.display = "block";
        return;
    }

    // Validate email
    if (!isValidEmail(email)) {
        document.getElementById("addContactResult").innerHTML = "Please enter a valid email address";
        document.getElementById("addContactResult").className = "alert alert-danger";
        document.getElementById("addContactResult").style.display = "block";
        return;
    }

    let tmp = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        userId: userId
    };
    let jsonPayload = JSON.stringify(tmp);

    let url = urlBase + '/AddContact.' + extension;
    
    let xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    
    try {
        xhr.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    let jsonObject = JSON.parse(xhr.responseText);
                    
                    if (jsonObject.error) {
                        document.getElementById("addContactResult").innerHTML = jsonObject.error;
                        document.getElementById("addContactResult").className = "alert alert-danger";
                        document.getElementById("addContactResult").style.display = "block";
                        return;
                    }
                    
                    // Success! Clear form and show success message
                    document.getElementById("addContactResult").innerHTML = "Contact added successfully!";
                    document.getElementById("addContactResult").className = "alert alert-success";
                    document.getElementById("addContactResult").style.display = "block";
                    
                    // Clear the form
                    document.getElementById("addContactForm").reset();
                    
                    // Update the search results to show the new contact
                    let searchInput = document.getElementById("searchInput");
                    if (searchInput) {
                        searchContacts(searchInput.value);
                    }
                    
                    // Close the modal after a short delay
                    setTimeout(function() {
                        let modal = bootstrap.Modal.getInstance(document.getElementById('addContactModal'));
                        modal.hide();
                        
                        // Clear the success message after hiding
                        document.getElementById("addContactResult").style.display = "none";
                    }, 1500);
                    
                } else {
                    document.getElementById("addContactResult").innerHTML = "Error adding contact: " + this.status;
                    document.getElementById("addContactResult").className = "alert alert-danger";
                    document.getElementById("addContactResult").style.display = "block";
                }
            }
        };
        xhr.send(jsonPayload);
    }
    catch(err) {
        document.getElementById("addContactResult").innerHTML = err.message;
        document.getElementById("addContactResult").className = "alert alert-danger";
        document.getElementById("addContactResult").style.display = "block";
    }
}

function showDeleteConfirmation(firstName, lastName, phone, email) {
    // Store the contact data for deletion
    deleteContactData = {
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        email: email
    };
    
    // Set the contact name in the modal
    document.getElementById("deleteContactName").textContent = `${firstName} ${lastName}`;
    
    // Show the modal
    let modal = new bootstrap.Modal(document.getElementById('deleteContactModal'));
    modal.show();
}

function deleteContact() {
    // If no contact data, return
    if (!deleteContactData) return;
    
    // Get the modal instance to close it later
    let modal = bootstrap.Modal.getInstance(document.getElementById('deleteContactModal'));
    
    // Disable the confirm button and show loading state
    let confirmBtn = document.getElementById("confirmDeleteBtn");
    let originalText = confirmBtn.innerHTML;
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Deleting...
    `;

    let tmp = {
        firstName: deleteContactData.firstName,
        lastName: deleteContactData.lastName,
        phone: deleteContactData.phone,
        email: deleteContactData.email,
        userId: userId
    };
    let jsonPayload = JSON.stringify(tmp);

    let url = urlBase + '/DeleteContact.' + extension;
    
    let xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    
    try {
        xhr.onreadystatechange = function() {
            if (this.readyState == 4) {
                // Reset button state
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = originalText;
                
                if (this.status == 200) {
                    let jsonObject = JSON.parse(xhr.responseText);
                    
                    if (jsonObject.error && jsonObject.error !== "") {
                        // Show error in a temporary alert
                        let alertDiv = document.createElement('div');
                        alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
                        alertDiv.setAttribute('role', 'alert');
                        alertDiv.innerHTML = `
                            Error deleting contact: ${jsonObject.error}
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        `;
                        document.body.appendChild(alertDiv);
                        
                        // Remove the alert after 3 seconds
                        setTimeout(() => alertDiv.remove(), 3000);
                        
                        // Close the modal
                        modal.hide();
                        return;
                    }
                    
                    // Success - refresh the search results
                    let searchInput = document.getElementById("searchInput");
                    if (searchInput) {
                        searchContacts(searchInput.value);
                    }
                    
                    // Show success message
                    let alertDiv = document.createElement('div');
                    alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
                    alertDiv.setAttribute('role', 'alert');
                    alertDiv.innerHTML = `
                        Contact deleted successfully
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    `;
                    document.body.appendChild(alertDiv);
                    
                    // Remove the success message after 3 seconds
                    setTimeout(() => alertDiv.remove(), 3000);
                    
                    // Close the modal
                    modal.hide();
                    
                } else {
                    // Show error in a temporary alert
                    let alertDiv = document.createElement('div');
                    alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
                    alertDiv.setAttribute('role', 'alert');
                    alertDiv.innerHTML = `
                        Error deleting contact: Server returned status ${this.status}
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    `;
                    document.body.appendChild(alertDiv);
                    
                    // Remove the alert after 3 seconds
                    setTimeout(() => alertDiv.remove(), 3000);
                    
                    // Close the modal
                    modal.hide();
                }
            }
        };
        xhr.send(jsonPayload);
    }
    catch(err) {
        // Reset button state
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalText;
        
        // Show error in a temporary alert
        let alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `
            Error deleting contact: ${err.message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        document.body.appendChild(alertDiv);
        
        // Remove the alert after 3 seconds
        setTimeout(() => alertDiv.remove(), 3000);
        console.error("Delete error:", err);
        
        // Close the modal
        modal.hide();
    }
    
    // Clear the stored contact data
    deleteContactData = null;
}

// Add event listener for the confirm delete button when the page loads
window.addEventListener('load', function() {
    document.getElementById('confirmDeleteBtn').addEventListener('click', deleteContact);
});

function showEditContact(firstName, lastName, phone, email) {
    // Store the original contact data for the update
    editContactData = {
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        email: email
    };
    
    // Populate the form with current contact data
    document.getElementById("editFirstName").value = firstName;
    document.getElementById("editLastName").value = lastName;
    document.getElementById("editEmail").value = email;
    document.getElementById("editPhone").value = phone;
    
    // Clear any previous messages
    document.getElementById("editContactResult").style.display = "none";
    
    // Show the modal
    let modal = new bootstrap.Modal(document.getElementById('editContactModal'));
    modal.show();
}

function updateContact() {
    // If no contact data, return
    if (!editContactData) return;
    
    // Get the modal instance to close it later
    let modal = bootstrap.Modal.getInstance(document.getElementById('editContactModal'));
    
    // Get updated values
    let firstName = document.getElementById("editFirstName").value;
    let lastName = document.getElementById("editLastName").value;
    let email = document.getElementById("editEmail").value;
    let phone = document.getElementById("editPhone").value;

    // Basic validation
    if (!firstName || !lastName || !email || !phone) {
        document.getElementById("editContactResult").innerHTML = "All fields are required";
        document.getElementById("editContactResult").className = "alert alert-danger";
        document.getElementById("editContactResult").style.display = "block";
        return;
    }

    // Check for whitespace-only entries
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
        document.getElementById("editContactResult").innerHTML = "Fields cannot be empty or contain only spaces";
        document.getElementById("editContactResult").className = "alert alert-danger";
        document.getElementById("editContactResult").style.display = "block";
        return;
    }

    // Validate email
    if (!isValidEmail(email)) {
        document.getElementById("editContactResult").innerHTML = "Please enter a valid email address";
        document.getElementById("editContactResult").className = "alert alert-danger";
        document.getElementById("editContactResult").style.display = "block";
        return;
    }

    // Disable the save button and show loading state
    let saveBtn = modal._element.querySelector('.btn-primary');
    let originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Saving...
    `;

    let tmp = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        oldFirstName: editContactData.firstName,
        oldLastName: editContactData.lastName,
        oldEmail: editContactData.email,
        oldPhone: editContactData.phone,
        userId: userId
    };
    let jsonPayload = JSON.stringify(tmp);

    let url = urlBase + '/UpdateContact.' + extension;
    
    let xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    
    try {
        xhr.onreadystatechange = function() {
            if (this.readyState == 4) {
                // Reset button state
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalText;
                
                if (this.status == 200) {
                    let jsonObject = JSON.parse(xhr.responseText);
                    
                    if (jsonObject.error && jsonObject.error !== "") {
                        document.getElementById("editContactResult").innerHTML = jsonObject.error;
                        document.getElementById("editContactResult").className = "alert alert-danger";
                        document.getElementById("editContactResult").style.display = "block";
                        return;
                    }
                    
                    // Success - refresh the search results
                    let searchInput = document.getElementById("searchInput");
                    if (searchInput) {
                        searchContacts(searchInput.value);
                    }
                    
                    // Show success message
                    let alertDiv = document.createElement('div');
                    alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
                    alertDiv.setAttribute('role', 'alert');
                    alertDiv.innerHTML = `
                        Contact updated successfully
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    `;
                    document.body.appendChild(alertDiv);
                    
                    // Remove the success message after 3 seconds
                    setTimeout(() => alertDiv.remove(), 3000);
                    
                    // Close the modal
                    modal.hide();
                    
                    // Clear the stored contact data
                    editContactData = null;
                    
                } else {
                    document.getElementById("editContactResult").innerHTML = "Error updating contact: " + this.status;
                    document.getElementById("editContactResult").className = "alert alert-danger";
                    document.getElementById("editContactResult").style.display = "block";
                }
            }
        };
        xhr.send(jsonPayload);
    }
    catch(err) {
        // Reset button state
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
        
        document.getElementById("editContactResult").innerHTML = err.message;
        document.getElementById("editContactResult").className = "alert alert-danger";
        document.getElementById("editContactResult").style.display = "block";
        console.error("Update error:", err);
    }
}

function changePage(direction) {
    // direction: 1 for next, -1 for previous
    const newPage = currentPage + direction;
    if (newPage > 0 && (newPage - 1) * contactsPerPage < totalResults) {
        currentPage = newPage;
        // Get the current search text and perform the search again
        const searchText = document.getElementById("searchInput").value;
        searchContacts(searchText);
    }
}

function updatePaginationControls() {
    const startIndex = (currentPage - 1) * contactsPerPage + 1;
    const endIndex = Math.min(currentPage * contactsPerPage, totalResults);
    
    // Update range and total displays
    document.getElementById("startRange").textContent = totalResults > 0 ? startIndex : 0;
    document.getElementById("endRange").textContent = endIndex;
    document.getElementById("totalContacts").textContent = totalResults;
    
    // Update button states
    document.getElementById("prevPage").classList.toggle("disabled", currentPage === 1);
    document.getElementById("nextPage").classList.toggle("disabled", endIndex >= totalResults);
}

function searchContacts(searchText) {
    // Reset page to 1 if the search text changes
    if (this.lastSearchText !== searchText) {
        currentPage = 1;
        this.lastSearchText = searchText;
    }

    // Don't search if the search text is empty
    if (!searchText.trim()) {
        document.getElementById("contactsTableBody").innerHTML = "";
        document.getElementById("searchResult").style.display = "none";
        totalResults = 0;
        updatePaginationControls();
        return;
    }

    // Clear any previous messages
    document.getElementById("searchResult").style.display = "none";
    
    // Create the payload
    let tmp = {
        search: searchText,
        userId: userId,
        page: currentPage,
        limit: contactsPerPage
    };
    let jsonPayload = JSON.stringify(tmp);
    
    let url = urlBase + '/SearchContacts.' + extension;
	
	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
				
    try {
        xhr.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    let jsonObject = JSON.parse(xhr.responseText);
                    
                    // Clear the table body
                    let tableBody = document.getElementById("contactsTableBody");
                    tableBody.innerHTML = "";
                    
                    if (jsonObject.error && jsonObject.error !== "") {
                        document.getElementById("searchResult").innerHTML = jsonObject.error;
                        document.getElementById("searchResult").className = "alert alert-info";
                        document.getElementById("searchResult").style.display = "block";
                        totalResults = 0;
                        updatePaginationControls();
                        return;
                    }
                    
                    // Make sure we have results
                    if (!jsonObject.results || jsonObject.results.length === 0) {
                        document.getElementById("searchResult").innerHTML = "No contacts found";
                        document.getElementById("searchResult").className = "alert alert-info";
                        document.getElementById("searchResult").style.display = "block";
                        totalResults = 0;
                        updatePaginationControls();
                        return;
                    }
                    
                    // Hide the no results message if we have results
                    document.getElementById("searchResult").style.display = "none";
                    
                    // Update total results
                    totalResults = jsonObject.total || jsonObject.results.length;
                    
                    // Populate the table with results
                    for (let i = 0; i < jsonObject.results.length; i++) {
                        let contact = jsonObject.results[i];
                        let row = document.createElement("tr");
                        
                        // Create cells for first name and last name
                        let firstNameCell = document.createElement("td");
                        firstNameCell.textContent = contact.FirstName;
                        
                        let lastNameCell = document.createElement("td");
                        lastNameCell.textContent = contact.LastName;
                        
                        let emailCell = document.createElement("td");
                        emailCell.textContent = contact.Email || "";
                        
                        let phoneCell = document.createElement("td");
                        phoneCell.textContent = contact.Phone || "";
                        
                        let actionsCell = document.createElement("td");
                        actionsCell.innerHTML = `
                            <button class="btn btn-sm btn-primary me-2" onclick="showEditContact('${contact.FirstName}', '${contact.LastName}', '${contact.Phone}', '${contact.Email}')">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="showDeleteConfirmation('${contact.FirstName}', '${contact.LastName}', '${contact.Phone}', '${contact.Email}')">Delete</button>
                        `;
                        
                        // Add cells to row
                        row.appendChild(firstNameCell);
                        row.appendChild(lastNameCell);
                        row.appendChild(emailCell);
                        row.appendChild(phoneCell);
                        row.appendChild(actionsCell);
                        
                        // Add row to table
                        tableBody.appendChild(row);
                    }
                    
                    // Update pagination controls
                    updatePaginationControls();
                    
                } else {
                    document.getElementById("searchResult").innerHTML = "Error searching contacts: " + this.status;
                    document.getElementById("searchResult").className = "alert alert-danger";
                    document.getElementById("searchResult").style.display = "block";
                    totalResults = 0;
                    updatePaginationControls();
                }
            }
        };
        xhr.send(jsonPayload);
    }
    catch(err) {
        document.getElementById("searchResult").innerHTML = err.message;
        document.getElementById("searchResult").className = "alert alert-danger";
        document.getElementById("searchResult").style.display = "block";
        console.error("Search error:", err);
        totalResults = 0;
        updatePaginationControls();
    }
}

function doRegister() {
    // Get form values
    let firstName = document.getElementById("registerFirstName").value;
    let lastName = document.getElementById("registerLastName").value;
    let login = document.getElementById("registerUsername").value;
    let password = document.getElementById("registerPassword").value;

    // Clear any previous error messages
    document.getElementById("registerResult").innerHTML = "";
    
    // Check for whitespace-only entries
    if (!firstName.trim() || !lastName.trim() || !login.trim()) {
        document.getElementById("registerResult").innerHTML = "Fields cannot be empty or contain only spaces";
        document.getElementById("registerResult").className = "alert alert-danger";
        document.getElementById("registerResult").style.display = "block";
        return false;
    }
    
    // Validate password requirements
    if (!checkPasswordRequirements()) {
        document.getElementById("registerResult").innerHTML = "Please meet all password requirements";
        document.getElementById("registerResult").className = "alert alert-danger";
        document.getElementById("registerResult").style.display = "block";
        return false;
    }

    let hash = md5(password);
    
    // Create the payload
    let tmp = {
        firstName: firstName,
        lastName: lastName,
        login: login,
        password: hash
    };
    let jsonPayload = JSON.stringify(tmp);
    
    let url = urlBase + '/Register.' + extension;

    let xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    xhr.setRequestHeader("Accept", "application/json");
    
    // Add error handling for CORS
    xhr.onerror = function() {
        document.getElementById("registerResult").innerHTML = "Error: Cannot connect to the server";
    };
    
    try {
        xhr.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    let jsonObject = JSON.parse(xhr.responseText);
                    
                    if (jsonObject.error) {
                        document.getElementById("registerResult").innerHTML = jsonObject.error;
                        document.getElementById("registerResult").style.display = "block";
                        return;
                    }
                    
                    // Registration successful
                    document.getElementById("registerResult").className = "alert alert-success";
                    document.getElementById("registerResult").innerHTML = "Registration successful! Redirecting to login...";
                    document.getElementById("registerResult").style.display = "block";
                    
                    // Clear the form
                    document.getElementById("registerForm").reset();
                    
                    // Redirect to login after a short delay
                    setTimeout(function() {
                        window.location.href = "login.html";
                    }, 1000);
                    
                } else {
                    document.getElementById("registerResult").innerHTML = "Server returned status: " + this.status;
                    document.getElementById("registerResult").style.display = "block";
                }
            }
        };
        xhr.send(jsonPayload);
    }
    catch(err) {
        document.getElementById("registerResult").innerHTML = err.message;
        document.getElementById("registerResult").style.display = "block";
        console.error("Registration error:", err);
    }
    
    return false;
}

// Dashboard initialization
window.addEventListener('load', function() {
    if (document.getElementById('userFullName')) {  // Check if we're on the dashboard page
        readCookie();
        // Update additional user info
        document.getElementById('userFullName').textContent = firstName + ' ' + lastName;
        document.getElementById('userId').textContent = userId;
    }
});
