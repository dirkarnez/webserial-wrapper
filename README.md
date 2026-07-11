webserial-wrapper
=================
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Static WebSocket Client</title>
</head>
<body>
    <h1>WebSocket Demo</h1>
    <div id="messages"></div>

    <script>
        // 1. Connect to an external WebSocket server (use ws:// or wss://)
        const socket = new WebSocket('wss://echo.websocket.org');

        // 2. Handle connection open
        socket.onopen = () => {
            console.log('Connected to server');
            socket.send('Hello from a static HTML page!');
        };

        // 3. Receive messages from the server
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const msgDiv = document.getElementById('messages');
            msgDiv.innerHTML += `<p>Server says: ${data}</p>`;

            // Send data to desktop app
            socket.send(JSON.stringify({ event: 'button_clicked' }));
        };

        // 4. Handle errors or closures
        socket.onerror = (error) => console.error('Error:', error);
        socket.onclose = () => console.log('Connection closed');
    </script>
</body>
</html>
```
