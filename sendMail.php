<?php

switch ($_SERVER['REQUEST_METHOD']) {
    case ("OPTIONS"): // Allow preflighting to take place.
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: POST");
        header("Access-Control-Allow-Headers: content-type");
        exit;
    case("POST"): // Handle the POST request.
        header("Access-Control-Allow-Origin: *");
        
        // Payload is not sent to $_POST, but to php://input as a text stream
        $json = file_get_contents('php://input');
        $params = json_decode($json);

        // Extract email and name from the request payload
        $email = $params->email;
        $name = $params->name;  // Optional, you can leave this out if not needed
        
        // Prepare the email data
        $recipient = $email;  // The email of the user who is requesting the password reset
        $subject = "Passwort zurücksetzen";
        $messageBody = "Hallo " . $name . ",<br><br>";
        $messageBody .= "Klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen:<br>";
        $messageBody .= "<a href='https://deineseite.com/reset-password?email=" . $email . "'>Passwort zurücksetzen</a>";
        
        // Headers for the email
        $headers   = array();
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'Content-type: text/html; charset=utf-8';
        $headers[] = "From: noreply@mywebsite.com";

        // Commented out mail() for local testing
        // Uncomment below to send the mail in production
        // mail($recipient, $subject, $messageBody, implode("\r\n", $headers));

        // For local testing: Output email data instead of sending
        echo json_encode([
            "status" => "success",
            "email" => $email,
            "name" => $name,
            "subject" => $subject,
            "message" => $messageBody
        ]);
        break;
    default: // Reject any non-POST or OPTIONS requests.
        header("Allow: POST", true, 405);
        exit;
}
