export default async function (options: SerialOptions) {
  let port = null;
  let reader = null;

  try {
    // 1. Ask the user to select a device
    port = await navigator.serial.requestPort();
    
    // 2. Open the port with the desired baud rate
    await port.open(!!options ? options : {
      baudRate: 115200
    });
    
    // 3. Write data (e.g., sending an "ON" command)
    // const textEncoder = new TextEncoder();
    // const writer = port.writable.getWriter();
    // await writer.write(textEncoder.encode("ON\n"));
    // writer.releaseLock();

    // 4. Read data from the device
    // const decoder = new TextDecoderStream();
    // port.readable.pipeTo(decoder.writable);
    // const reader = decoder.readable.getReader();

    // // 4. Read data forever until the port closes
    // while (true) {
    //   const { value, done } = await reader.read();
    //   if (done) break; // Exit if done
    //   console.log(value); // Print data to the console
    // }


    reader = port.readable.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break; // Stream has been closed
      }
      console.log("Received: ", decoder.decode(value));
    }

  } catch (e) {
    console.error("Error reading port:", e);
  } finally {
    // 4. Safe cleanup execution
    if (reader) {
      try {
        await reader.cancel();
        reader.releaseLock();
      } catch (e) {
        console.error("Error releasing reader lock:", e);
      }
    }
    if (port) {
      try {
        await port.close();
        console.log("Serial port successfully closed.");
      } catch (e) {
        console.error("Error closing port:", e);
      }
    }
  }
}
