window.addEventListener("load", function () {
  document
    .getElementById("user-input")
    .addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
      }
    });

  document.getElementById("file-input").addEventListener("change", function () {
    var files = this.files;
    var fileList = document.getElementById("file-list");

    fileList.innerHTML = "";

    for (var i = 0; i < files.length; i++) {
      var fileDiv = document.createElement("li");
      fileDiv.textContent = files[i].name;
      fileList.appendChild(fileDiv);
    }
  });

  document
    .getElementById("train-bot-btn")
    .addEventListener("click", function () {
      uploadFiles();
    });
});

function uploadFiles() {
  document.getElementById("train-bot-btn").style.display = "none";
  console.log("Uploading files...");
  var files = document.getElementById("file-input").files;
  var formData = new FormData();

  for (var i = 0; i < files.length; i++) {
    formData.append("files[]", files[i]);
  }

  // Initialize progress variables
  var displayedProgress = 0;
  var interval = 30; // in milliseconds

  // Show the progress bar
  var progressBar = document.getElementById("upload-progress");
  progressBar.value = 0;
  document.getElementById("progress-container").style.display = "block";
  document.getElementById("train-bot-btn").style.display = "none";

  // Function to smoothly update the progress bar
  var smoothProgress = function () {
    if (displayedProgress < 95) {
      displayedProgress += 1; // Increment displayed progress
      progressBar.value = displayedProgress;
      setTimeout(smoothProgress, interval);
    }
  };

  // Start the smooth progress animation
  smoothProgress();

  // Use fetch API for the upload
  fetch("/upload", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      document.getElementById("progress-container").style.display = "none";
      
      if (data.error) {
        console.error("Error:", data.error);
      } else {
        console.log("Success:", data.message);
       
        document.getElementById("chat-input").style.display = "flex";
        progressBar.value = 100;
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      document.getElementById("progress-container").style.display = "none"; 
    });
}

function sendMessage() {
  var userInput = document.getElementById("user-input");
  var message = userInput.value;

  if (message.trim() !== "") {
    var chatBody = document.getElementById("chat-body");

    var newMessage = document.createElement("div");
    newMessage.className = "message";
    newMessage.innerHTML = "<h3><strong>Tú:</h3></strong>";
    messageContent = document.createElement("div");
    messageContent.className = "message-content user-message";
    messageContent.innerHTML = message;

    newMessage.appendChild(messageContent);

    chatBody.appendChild(newMessage);

    // Send the user message to the server using fetch
    fetch("/get_response", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "user_message=" + encodeURIComponent(message),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.error) {
          console.error("Error from server:", data.error);
        } else {
          var chatbotMessage = data.response;
          var source = data.source; // Extracted source information
          var similarity = data.similarity; // Extracted similarity information

          var messageDiv = createMessageElement(chatbotMessage, source, similarity);
        
          chatBody.appendChild(messageDiv);

          userInput.value = "";

          // Scroll to the bottom of the chat body
          chatBody.scrollTop = chatBody.scrollHeight;
        }
      })
      .catch((error) => {
        console.error("Error sending message:", error);
      });

    userInput.value = "";
  }
}

function createMessageElement(message, source, similarity) {
  var messageDiv = document.createElement("div");
  messageDiv.className = "message";

  var image = document.createElement("img");
  image.src = "/static/img/bot.png";
  image.alt = "";
  image.className = "user-img";
  messageDiv.appendChild(image);

  var messageContentDiv = document.createElement("div");
  messageContentDiv.className = "message-content";

  var messageParagraph = document.createElement("p");
  messageParagraph.innerHTML = message.replace(/\n/g, "<br>");
  messageContentDiv.appendChild(messageParagraph);

  var contentInfo = document.createElement("div");
  contentInfo.className = "content-info";

  if (source) {
      var sourceParagraph = document.createElement("p");
      var sourceBold = document.createElement("strong");
      sourceBold.textContent = "Fuente: ";
      sourceParagraph.appendChild(sourceBold);
      sourceParagraph.append(document.createTextNode(source));
      contentInfo.appendChild(sourceParagraph);
  }

  if (similarity) {
      var similarityParagraph = document.createElement("p");
      var similarityBold = document.createElement("strong");
      similarityBold.textContent = "Similitud encontrada: ";
      similarityParagraph.appendChild(similarityBold);
      similarityParagraph.append(document.createTextNode(similarity));
      contentInfo.appendChild(similarityParagraph);
  }

  // Append contentInfo only if it contains child elements
  if (contentInfo.hasChildNodes()) {
      messageContentDiv.appendChild(contentInfo);
  }

  messageDiv.appendChild(messageContentDiv);

  return messageDiv;
}
