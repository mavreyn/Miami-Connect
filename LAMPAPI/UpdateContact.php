<?php
	// Add CORS headers
	header('Access-Control-Allow-Origin: *');
	header('Access-Control-Allow-Methods: POST, OPTIONS');
	header('Access-Control-Allow-Headers: Content-Type');
	
	// Handle preflight requests
	if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
		exit(0);
	}

	$inData = getRequestInfo();

	// Get both new and old contact information
	$newFirstName = $inData["firstName"];
	$newLastName = $inData["lastName"];
	$newPhone = $inData["phone"];
	$newEmail = $inData["email"];
	$oldFirstName = $inData["oldFirstName"];
	$oldLastName = $inData["oldLastName"];
	$oldPhone = $inData["oldPhone"];
	$oldEmail = $inData["oldEmail"];
	$userId = $inData["userId"];

	$conn = new mysqli("localhost", "TheBeast", "WeLoveCOP4331", "COP4331");
	if( $conn->connect_error )
	{
		returnWithError( $conn->connect_error );
	}
	else
	{
		// First, find the contact using the old information
		$stmt = $conn->prepare("UPDATE Contacts SET firstName=?, lastName=?, phone=?, email=? WHERE firstName=? AND lastName=? AND phone=? AND email=? AND userId=?");
		$stmt->bind_param("sssssssss", $newFirstName, $newLastName, $newPhone, $newEmail, $oldFirstName, $oldLastName, $oldPhone, $oldEmail, $userId);
		$stmt->execute();
		
		if ($stmt->affected_rows > 0) {
			$stmt->close();
			$conn->close();
			returnWithError("");
		} else {
			$stmt->close();
			$conn->close();
			returnWithError("Contact not found or no changes made");
		}
	}

	function getRequestInfo()
	{
		return json_decode(file_get_contents('php://input'), true);
	}

	function sendResultInfoAsJson( $obj )
	{
		header('Content-type: application/json');
		echo $obj;
	}
	
	function returnWithError( $err )
	{
		$retValue = '{"error":"' . $err . '"}';
		sendResultInfoAsJson( $retValue );
	}
	
?>
