import React, { useEffect, useRef } from "react";

import * as Y from "yjs";
import { QuillBinding } from "y-quill";

import Quill from "quill";
import "quill/dist/quill.core.css";
import QuillCursors from "quill-cursors";

import { WebsocketProvider as WebsocketProviderOriginal } from "./y-websocket-original.js";

Quill.register("modules/cursors", QuillCursors);

function EditorOriginal({ noteId, setText }) {
  useEffect(() => {
    const editor = document.querySelector("#editorOriginal");
    if (editor.hasChildNodes()) {
      return;
    }

    const quill = new Quill(document.querySelector("#editorOriginal"), {
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

    const providerOriginal = new WebsocketProviderOriginal(
      "ws:/localhost:8080",
      "room-1",
      ydoc
    );

    new QuillBinding(ytext, quill, providerOriginal.awareness);

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

    providerOriginal.awareness.setLocalStateField("user", {
      // Define a print name that should be displayed
      name: "Emmanuelle Charpentier",
      // Define a color that should be associated to the user:
      color: "#ffb61e", // should be a hex color
    });
  }, [noteId]);

  return <div id="editorOriginal" />;
}

export default EditorOriginal;
