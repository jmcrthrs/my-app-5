import React, { useEffect, useRef, useState } from "react";

import { fromBase64, toBase64 } from "lib0/buffer";
import Editor from "./Editor.js";

function App() {
  const ws = useRef(null);
  //const [ws, setWs] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [message, setMessage] = useState(null);
  const [noteId, setNoteId] = useState("1");
  const [firstUser, setFirstUser] = useState(true);

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

    if (ws.current) return;
    const websocketUrl = "ws:/localhost:8080";
    const websocket = new WebSocket(websocketUrl);
    ws.current = websocket;
    //setWs(websocket);

    // Listen for messages
    websocket.addEventListener("message", (event) => {
      //https://github.com/yjs/y-websocket/pull/78
      const json = JSON.parse(event.data);
      const data = fromBase64(json.payload);
      setMessage(data);
    });
  }, [ws]);

  const customSend = (p) => {
    //https://github.com/yjs/y-websocket/pull/78
    try {
      ws.current.send(JSON.stringify({ payload: toBase64(p) }));
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

      <input
        type="checkbox"
        checked={firstUser}
        onChange={() => setFirstUser(!firstUser)}
      />
      <button onClick={() => setShowEditor(true)}>Load editor</button>
      {showEditor && (
        <Editor
          setText={firstUser}
          noteId={noteId}
          message={message}
          sendMessage={customSend}
        />
      )}
    </div>
  );
}

export default App;
