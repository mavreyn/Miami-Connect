const urlBase = 'http://21project.site/LAMPAPI';
const extension = 'php';

let userId = 0;
let firstName = "";
let lastName = "";

function doLogin()
{
	userId = 0;
	firstName = "";
	lastName = "";
	
	let login = document.getElementById("loginUsername").value;
	let password = document.getElementById("loginPassword").value;
//	var hash = md5( password );
	
	document.getElementById("loginResult").innerHTML = "";

	let tmp = {login:login,password:password};
//	var tmp = {login:login,password:hash};
	let jsonPayload = JSON.stringify( tmp );
	
	let url = urlBase + '/Login.' + extension;

	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	xhr.setRequestHeader("Accept", "application/json");
	// Add error handling for CORS
	xhr.onerror = function() {
		document.getElementById("loginResult").innerHTML = "Error: Cannot connect to the server";
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
						document.getElementById("loginResult").innerHTML = "User/Password combination incorrect";
						return;
					}
			
					firstName = jsonObject.firstName;
					lastName = jsonObject.lastName;

					saveCookie();
		
					window.location.href = "contacts.html";
				} else {
					document.getElementById("loginResult").innerHTML = "Server returned status: " + this.status;
				}
			}
		};
		xhr.send(jsonPayload);
		console.log("Request sent:", jsonPayload);
	}
	catch(err)
	{
		document.getElementById("loginResult").innerHTML = err.message;
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
		document.getElementById("userName").innerHTML = "Logged in as " + firstName + " " + lastName;
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

function addColor()
{
	let newColor = document.getElementById("colorText").value;
	document.getElementById("colorAddResult").innerHTML = "";

	let tmp = {color:newColor,userId,userId};
	let jsonPayload = JSON.stringify( tmp );

	let url = urlBase + '/AddColor.' + extension;
	
	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	try
	{
		xhr.onreadystatechange = function() 
		{
			if (this.readyState == 4 && this.status == 200) 
			{
				document.getElementById("colorAddResult").innerHTML = "Color has been added";
			}
		};
		xhr.send(jsonPayload);
	}
	catch(err)
	{
		document.getElementById("colorAddResult").innerHTML = err.message;
	}
	
}

function searchContacts(searchText) {
    // Don't search if the search text is empty
    if (!searchText.trim()) {
        document.getElementById("contactsTableBody").innerHTML = "";
        document.getElementById("searchResult").style.display = "none";
        return;
    }

    // Clear any previous messages
    document.getElementById("searchResult").style.display = "none";
    
    // Create the payload - note the userId key matches the API expectation
    let tmp = {
        search: searchText,
        userId: userId  // This matches the API's expected format
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
                        document.getElementById("totalContacts").textContent = "0";
                        return;
                    }
                    
                    // Make sure we have results
                    if (!jsonObject.results || jsonObject.results.length === 0) {
                        document.getElementById("searchResult").innerHTML = "No contacts found";
                        document.getElementById("searchResult").className = "alert alert-info";
                        document.getElementById("searchResult").style.display = "block";
                        document.getElementById("totalContacts").textContent = "0";
                        return;
                    }
                    
                    // Hide the no results message if we have results
                    document.getElementById("searchResult").style.display = "none";
                    
                    // Populate the table with results
                    for (let i = 0; i < jsonObject.results.length; i++) {
                        let contact = jsonObject.results[i];
                        let row = document.createElement("tr");
                        
                        // Create cells
                        let nameCell = document.createElement("td");
                        nameCell.textContent = contact.FirstName + " " + contact.LastName;
                        
                        let emailCell = document.createElement("td");
                        emailCell.textContent = contact.Email || "";
                        
                        let phoneCell = document.createElement("td");
                        phoneCell.textContent = contact.Phone || "";
                        
                        let actionsCell = document.createElement("td");
                        actionsCell.innerHTML = `
                            <button class="btn btn-sm btn-primary me-2" onclick="editContact(${contact.ID})">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteContact(${contact.ID})">Delete</button>
                        `;
                        
                        // Add cells to row
                        row.appendChild(nameCell);
                        row.appendChild(emailCell);
                        row.appendChild(phoneCell);
                        row.appendChild(actionsCell);
                        
                        // Add row to table
                        tableBody.appendChild(row);
                    }
                    
                    // Update total contacts count
                    document.getElementById("totalContacts").textContent = jsonObject.results.length;
                } else {
                    document.getElementById("searchResult").innerHTML = "Error searching contacts: " + this.status;
                    document.getElementById("searchResult").className = "alert alert-danger";
                    document.getElementById("searchResult").style.display = "block";
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
    
    // Create the payload
    let tmp = {
        firstName: firstName,
        lastName: lastName,
        login: login,
        password: password
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
                        window.location.href = "auth.html";
                    }, 2000);
                    
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
