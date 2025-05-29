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

	// TODO: Also get the old fields to search for the id?
	$newFirstName = $inData["firstName"];
	$newLastName = $inData["lastName"];
	$newPhone = $inData["phone"];
	$newEmail = $inData["email"];
	$id = 0;

	$conn = new mysqli("localhost", "TheBeast", "WeLoveCOP4331", "COP4331");
	if( $conn->connect_error )
	{
		returnWithError( $conn->connect_error );
	}
	else
	{
		// TODO: Get the ID from the entry by...?
		$id = 
		$stmt = $conn->prepare("UPDATE Contacts SET firstName=?, lastName=?, phone=?, email=? WHERE ID=?");
		$stmt->bind_param("sssss", $newFirstName, $newLastName, $newPhone, $newEmail, $id);
		$stmt->execute();
		$stmt->close();
		$conn->close();
		returnWithError("");
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
