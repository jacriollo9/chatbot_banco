function sendMessage() {
    var userInput = document.getElementById("user-input");
    var message = userInput.value;

    if (message.trim() !== "") {
        var chatBody = document.getElementById("chat-body");
        var newMessage = document.createElement("div");
        newMessage.className = "message";
        newMessage.innerHTML = "<br><strong>Tú:</strong> " + message;
        chatBody.appendChild(newMessage);

        // Send the user message to the server using fetch
        fetch("/get_response", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "user_message=" + encodeURIComponent(message),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.error("Error from server:", data.error);
            } else {
                var chatbotResponse = document.createElement("div");
                response = data.response.replace(/\n/g, "<br>");
                chatbotResponse.className = "message bot-message";
                chatbotResponse.innerHTML = "<br><strong>Chatbot:</strong> " + response;
                chatBody.appendChild(chatbotResponse);
        
                userInput.value = "";
        
                chatBody.scrollTop = chatBody.scrollHeight;
            }
        })
        .catch(error => {
            console.error("Error sending message:", error);
        });
    }
}
