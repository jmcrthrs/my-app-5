import React, { useCallback, useEffect, useState } from "react";
import * as Y from "yjs";
import {
  WebsocketProvider as WebsocketProviderNew,
  handleWebSocketMessage,
  handleWebSocketOpen,
  handleWebSocketClose,
} from "./y-websocket.js";
import { WebsocketProvider as WebsocketProviderOriginal } from "./y-websocket-original.js";

import { fromBase64, toBase64 } from "lib0/buffer";
import Editor from "./Editor.js";

function App() {
  //const wsRef = React.useRef(null);
  const [ws, setWs] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [message, setMessage] = useState(null);
  const [noteId, setNoteId] = useState("1");

  useEffect(() => {
    // connect to the public demo server (not in production!)
    /**
     * cd websocket
     * node index.mjs
     *
     * OR
     *
     * nvm use 20
     * HOST=localhost PORT=1234 npx y-websocket
     * "ws:/localhost:1234",
     *
     * https://discuss.yjs.dev/t/how-to-send-yjs-document-through-normal-websocket/2257/4?u=jmcrthrs
     */

    if (ws) return;
    const websocketUrl = "ws:/localhost:8080";
    const websocket = new WebSocket(websocketUrl);
    //wsRef.current = websocket;
    setWs(websocket);
    //websocket.binaryType = "arraybuffer";

    // // Connection opened
    // websocket.addEventListener("close", () => {
    // //  handleWebSocketClose(providerNew, websocket);
    // });

    // Listen for messages
    websocket.addEventListener("message", (event) => {
      //https://github.com/yjs/y-websocket/pull/78
      const json = JSON.parse(event.data);
      const data = fromBase64(json.payload);
      setMessage(data);
    });
  }, []);


  const customSend = (p) => {
    //websocket.send(p);
    //https://github.com/yjs/y-websocket/pull/78
    try {
      ws.send(JSON.stringify({ payload: toBase64(p) }));
      //websocket.send(toBase64(p));
    } catch (e) {
      console.error(e);
    }
  };

  if (!ws) return null;

  return (
    <div className="App">
      <input
        value={noteId}
        onChange={(event) => setNoteId(event.target.value)}
      />
      <button onClick={() => setShowEditor(true)}>Load editor</button>
      {showEditor && (
        <Editor
          noteId={noteId}
          message={message}
          sendMessage={customSend}
        />
      )}
    </div>
  );
}

export default App;
