import React, { useCallback, useEffect, useRef, useState } from "react";

import { fromBase64, toBase64 } from "lib0/buffer";

import * as Y from "yjs";
import { QuillBinding } from "y-quill";

import Quill from "quill";
import "quill/dist/quill.core.css";
import QuillCursors from "quill-cursors";

import {
  WebsocketProvider as WebsocketProviderNew,
  handleWebSocketMessage,
  handleInitialConnection,
  handleWebSocketClose,
} from "./y-websocket.js";

import { WebsocketProvider as WebsocketProviderOriginal } from "./y-websocket-original.js";

Quill.register("modules/cursors", QuillCursors);

function Editor({ noteId, message, sendMessage }) {
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

    providerNew.current = new WebsocketProviderNew(ydoc, { customSend: sendMessage });

    setTimeout(() => {
      // delay to ensure websocket is connected
      handleInitialConnection(providerNew.current);
    }, 1000);

    const binding = new QuillBinding(
      ytext,
      quill,
      providerNew.current.awareness
    );

    providerNew.current.awareness.setLocalStateField('user', {
      // Define a print name that should be displayed
      name: 'Emmanuelle Charpentier',
      // Define a color that should be associated to the user:
      color: '#ffb61e' // should be a hex color
    })

    //   const providerOriginal = new WebsocketProviderOriginal(
    //     "ws:/localhost:1234",
    //     "room-1",
    //     ydoc
    //   );
    //  new QuillBinding(ytext, quill, providerOriginal.awareness);

    /**
     * ONLY SET FOR FIRST USER!
     */

    quill.setContents([
      { insert: "Hello " },
      { insert: "World!", attributes: { bold: true } },
      { insert: "\n" },
    ]);
  }, [noteId]);

  useEffect(() => {
    if (!message) return;
    handleWebSocketMessage(providerNew.current, { data: message });
  }, [message]);

  return <div id="editor" />;
}

export default Editor;
