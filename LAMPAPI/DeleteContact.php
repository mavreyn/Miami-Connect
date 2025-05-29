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

	$firstName = $inData["firstName"];
	$lastName = $inData["lastName"];
	$phone = $inData["phone"];
	$email = $inData["email"];
	$userId = $inData["userId"];

	$conn = new mysqli("localhost", "TheBeast", "WeLoveCOP4331", "COP4331");
	if( $conn->connect_error )
	{
		returnWithError( $conn->connect_error );
	}
	else
	{
		// $stmt = $conn->prepare("DELETE FROM Contacts WHERE (firstName, lastName, phone, email, userId) LIKE VALUES (?,?,?,?,?)");
		$stmt = $conn->prepare("DELETE FROM Contacts WHERE (firstName=? AND lastName=? AND phone=? AND email=? AND userId=?");
		$stmt->bind_param("sssss", $firstName, $lastName, $phone, $email, $userId);
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
