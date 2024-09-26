import React, { useEffect, useRef, useState } from "react";

import { fromBase64, toBase64 } from "lib0/buffer";
import Editor from "./Editor.js";
import EditorOriginal from "./EditorOriginal.js";

function App() {
  const [showEditor, setShowEditor] = useState(false);
  const [noteId, setNoteId] = useState("1");
  const [firstUser, setFirstUser] = useState(true);

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
        <>
          {/* <Editor
            setText={firstUser}
            noteId={noteId}
            message={message}
            sendMessage={customSend}
          /> */}
          <EditorOriginal setText={firstUser} noteId={noteId} />
        </>
      )}
    </div>
  );
}

export default App;
