import React, { useCallback, useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import * as Y from "yjs";
import { QuillBinding } from "y-quill";
import Quill from "quill";
import "quill/dist/quill.core.css";
import QuillCursors from "quill-cursors";
import {
  WebsocketProvider as WebsocketProviderNew,
  handleWebSocketMessage,
  handleWebSocketOpen,
} from "/Users/jamie/Documents/GitHub/y-websocket/src/y-websocket";
import { WebsocketProvider as WebsocketProviderOriginal } from "/Users/jamie/Documents/GitHub/y-websocket/src/y-websocket-original";

import { fromBase64, toBase64 } from 'lib0/buffer';

Quill.register("modules/cursors", QuillCursors);

function App() {
  const [number, setNumber] = useState(0);
  console.log("render", number);

  useEffect(() => {
    setNumber((num) => num + 1);
  }, []);

  useEffect(() => {
    const editor = document.querySelector("#editor");
    if (editor.hasChildNodes()) {
      return;
    }

    const quill = new Quill(document.querySelector("#editor"), {
      modules: {
        cursors: true,
        toolbar: [
          // adding some basic Quill content features
          [{ header: [1, 2, false] }],
          ["bold", "italic", "underline"],
          ["image", "code-block"],
        ],
        history: {
          // Local undo shouldn't undo changes
          // from remote users
          userOnly: true,
        },
      },
      placeholder: "Start collaborating...",
      theme: "snow", // 'bubble' is also great
    });

    // A Yjs document holds the shared data
    const ydoc = new Y.Doc();
    // Define a shared text type on the document
    const ytext = ydoc.getText("quill");
    console.log(ytext);

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
    const websocketUrl = "ws:/localhost:8080";
    const websocket = new WebSocket(websocketUrl);
    //websocket.binaryType = "arraybuffer";

    // Connection opened
    websocket.addEventListener("open", () => {
      handleWebSocketOpen(providerNew, websocket);
    });

    // Listen for messages
    websocket.addEventListener("message", (event) => {
      //https://github.com/yjs/y-websocket/pull/78
      const data = fromBase64(event.data)
      handleWebSocketMessage(providerNew, {data});
    });

    const customSend = (p) => {
      //websocket.send(p);
      //https://github.com/yjs/y-websocket/pull/78
      websocket.send(toBase64(p));
    };

    const providerNew = new WebsocketProviderNew(
      //"ws:/localhost:1234",
      "ws:/localhost:8081",
      "room-1",
      ydoc,
      { customSend }
    );

    // const providerOriginal = new WebsocketProviderOriginal(
    //   "ws:/localhost:8080",
    //   "room-1",
    //   ydoc
    // );

    // Create an editor-binding which
    // "binds" the quill editor to a Y.Text type.
    const binding = new QuillBinding(ytext, quill, providerNew.awareness);
  }, []);

  return (
    <div className="App">
      <div id="editor" />
    </div>
  );
}

export default App;
