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

  // Helper that returns an async-iterable which yields lines (no newlines)
  function lines(): AsyncIterable<string> {
    const rs = stream;

    return (async function* () {
      const r = rs.getReader();
      let buf = '';
      try {
        while (true) {
          const { value, done } = await r.read();
          if (done) break;
          buf += value;

          let idx: number;
          while ((idx = buf.indexOf('\n')) !== -1) {
            let line = buf.slice(0, idx);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            yield line;
            buf = buf.slice(idx + 1);
          }
        }

        if (buf.length) yield buf;
      } finally {
        try {
          r.releaseLock();
        } catch (e) {
          // ignore
        }
      }
    })();
  }

  return {
    // stream yields decoded text chunks (as they arrive). You can pipeThrough or getReader() from it.
    stream,

    // convenience: get a line-split async-iterable
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
