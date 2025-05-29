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
	
	$searchResults = "";
	$searchCount = 0;
	$totalContacts = 0;

	// Set default values for pagination
	$page = isset($inData["page"]) ? (int)$inData["page"] : 1;
	$limit = isset($inData["limit"]) ? (int)$inData["limit"] : 10;
	$offset = ($page - 1) * $limit;

	$conn = new mysqli("localhost", "TheBeast", "WeLoveCOP4331", "COP4331");
	if ($conn->connect_error) 
	{
		returnWithError( $conn->connect_error );
	} 
	else
	{
		// First get total count
		$stmt = $conn->prepare("SELECT COUNT(*) as total FROM Contacts WHERE (firstName LIKE ? OR lastName LIKE ?) AND UserID=?");
		$contactName = "%" . $inData["search"] . "%";
		$stmt->bind_param("sss", $contactName, $contactName, $inData["userId"]);
		$stmt->execute();
		$result = $stmt->get_result();
		$row = $result->fetch_assoc();
		$totalContacts = $row['total'];
		$stmt->close();

		// Then get paginated results
		$stmt = $conn->prepare("SELECT * FROM Contacts WHERE (firstName LIKE ? OR lastName LIKE ?) AND UserID=? LIMIT ? OFFSET ?");
		$stmt->bind_param("sssii", $contactName, $contactName, $inData["userId"], $limit, $offset);
		$stmt->execute();
		
		$result = $stmt->get_result();
		
		while($row = $result->fetch_assoc())
		{
			if( $searchCount > 0 )
			{
				$searchResults .= ",";
			}
			$searchCount++;
			$searchResults .= '{"FirstName" : "' . $row["FirstName"] . '", "LastName" : "' . $row["LastName"] . '", "Phone" : "' . $row["Phone"] . '", "Email" : "' . $row["Email"]  . '"}';
		}
		
		if( $searchCount == 0 )
		{
			returnWithError( "No Contacts Found" );
		}
		else
		{
			returnWithInfo( $searchResults, $totalContacts );
		}
		
		$stmt->close();
		$conn->close();
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
		$retValue = '{"id":0,"firstName":"","lastName":"","error":"' . $err . '","total":0}';
		sendResultInfoAsJson( $retValue );
	}
	
	function returnWithInfo( $searchResults, $total )
	{
		$retValue = '{"results":[' . $searchResults . '],"error":"","total":' . $total . '}';
		sendResultInfoAsJson( $retValue );
	}
	
?>
