import React, { useEffect, useRef } from "react";

import * as Y from "yjs";
import { QuillBinding } from "y-quill";

import Quill from "quill";
import "quill/dist/quill.core.css";
import QuillCursors from "quill-cursors";

import {
  WebsocketProvider as WebsocketProviderNew,
  handleWebSocketMessage,
  handleInitialConnection,
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

    setTimeout(() => {
      // A Yjs document holds the shared data
      const ydoc = new Y.Doc();
      // Define a shared text type on the document
      const ytext = ydoc.getText(noteId);

      providerNew.current = new WebsocketProviderNew(ydoc, {
        customSend: sendMessage,
      });

      handleInitialConnection(providerNew.current);

      new QuillBinding(ytext, quill, providerNew.current.awareness);

      // You can observe when a user updates their awareness information
      providerNew.current.awareness.on("change", (changes) => {
        // Whenever somebody updates their awareness information,
        // we log all awareness information from all users.
        console.log(
          Array.from(providerNew.current.awareness.getStates().values())
        );
      });

      /**
       * ONLY SET FOR FIRST USER!
       */
      if (setText) {
        quill.setContents([
          { insert: "Hello " },
          { insert: "World!", attributes: { bold: true } },
          { insert: "\n" },
        ]);
      }

      providerNew.current.awareness.setLocalStateField("user", {
        // Define a print name that should be displayed
        name: "Emmanuelle Charpentier",
        // Define a color that should be associated to the user:
        color: "#ffb61e", // should be a hex color
      });
    }, 1000);

    //   const providerOriginal = new WebsocketProviderOriginal(
    //     "ws:/localhost:1234",
    //     "room-1",
    //     ydoc
    //   );
    //  new QuillBinding(ytext, quill, providerOriginal.awareness);
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
