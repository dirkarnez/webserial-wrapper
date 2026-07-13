export default async function openSerialStream(options?: SerialOptions) {
  // Ask user to pick a port and open it
  const port = await navigator.serial.requestPort();
  await port.open(options ?? { baudRate: 115200 });

  let closed = false;

  // Underlying reader and decoder used to produce string chunks
  const reader = port.readable.getReader();
  const decoder = new TextDecoder();

  const stream = new ReadableStream<string>({
    async start(controller) {
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          // decode chunk (streaming decoder)
          const text = decoder.decode(value, { stream: true });
          if (text.length) controller.enqueue(text);
        }
        // flush any remaining decoded characters
        const rest = decoder.decode();
        if (rest.length) controller.enqueue(rest);
        controller.close();
      } catch (err) {
        controller.error(err as any);
      } finally {
        try {
          // release the reader lock when stream ends
          reader.releaseLock();
        } catch (e) {
          // ignore
        }
      }
    },
    async cancel(reason) {
      try {
        await reader.cancel(reason as any);
      } catch (e) {
        // ignore
      }
      try {
        await port.close();
      } catch (e) {
        // ignore
      }
    }
  });

  // Helper that returns a stream which splits incoming text into lines (no newlines)
  function lines() {
    const splitter = new TransformStream<string, string>({
      start() {
        (this as any)._buf = '';
      },
      transform(chunk: any, controller: TransformStreamDefaultController<string>) {
        (this as any)._buf += chunk;
        const parts = (this as any)._buf.split(/\r?\n/);
        (this as any)._buf = parts.pop() ?? '';
        for (const p of parts) controller.enqueue(p);
      },
      flush(controller: TransformStreamDefaultController<string>) {
        if ((this as any)._buf) controller.enqueue((this as any)._buf);
      }
    } as any);

    return stream.pipeThrough(splitter);
  }

  return {
    // stream yields decoded text chunks (as they arrive). You can pipeThrough or getReader() from it.
    stream,

    // convenience: get a line-split stream
    lines,

    // underlying port if you need direct access (writer, settings, etc.)
    port,

    // close helper: cancels the underlying reader and closes the port
    async close() {
      if (closed) return;
      closed = true;
      try {
        await reader.cancel();
      } catch (e) {
        // ignore
      }
      try {
        await port.close();
      } catch (e) {
        // ignore
      }
    }
  };
}
