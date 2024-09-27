import React, { useState, useEffect, useRef } from "react";

import * as Y from "yjs";
import { QuillBinding } from "y-quill";

import { fromBase64, toBase64 } from "lib0/buffer";
import Quill from "quill";
import "quill/dist/quill.core.css";
import QuillCursors from "quill-cursors";

import {
  WebsocketProvider as WebsocketProviderNew,
  handleWebSocketMessage,
  handleInitialConnection,
  getFullDocSyncStep,
  messageSync,
} from "./y-websocket.js";

Quill.register("modules/cursors", QuillCursors);

function Editor({ noteId, setText, message, sendMessage }) {
  const providerNew = useRef(null);

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
    const ytext = ydoc.getText(noteId);

    providerNew.current = new WebsocketProviderNew(ydoc, {
      customSend: (p, messageType) => {
        sendMessage(p, messageType);
        if (messageType === messageSync) {
          console.log(getFullDocSyncStep(providerNew.current));
        }
      },
    });

    new QuillBinding(ytext, quill, providerNew.current.awareness);

    const data = fromBase64(
      "AAGQAQIF7vHntQsABAEBMQZIZWxsbyCG7vHntQsFBGJvbGQEdHJ1ZYTu8ee1CwYGV29ybGQhhu7x57ULDARib2xkBG51bGyE7vHntQsNAQoD5IbG5wYAxO7x57ULDO7x57ULDQEgweSGxucGAO7x57ULDQPE5IbG5wYD7vHntQsNCWkgYW0gaGVyZQHkhsbnBgEBAw=="
    );

    handleWebSocketMessage(providerNew.current, { data });

    setTimeout(() => {
      // delay to ensure websocket is connected
      handleInitialConnection(providerNew.current);
    }, 500);


    providerNew.current.awareness.setLocalStateField("user", {
      // Define a print name that should be displayed
      name: "Emmanuelle Charpentier",
      // Define a color that should be associated to the user:
      color: "#ffb61e", // should be a hex color
    });
  }, [noteId, sendMessage]);

  useEffect(() => {
    if (!message) return;
    if (providerNew.current) {
      handleWebSocketMessage(providerNew.current, { data: message });
    }
  }, [message]);

  return <div id="editor" />;
}

export default Editor;
