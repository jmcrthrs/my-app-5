if no editors
  set contents manually
else if editors
  note.ydoc should be available
    call the websocket message handler with the note.ydoc content the same as when a websocket message is received

Do we need to lock?
  No


Full YDoc will be available from GET note/{key} 
We can init the doc with this before connecting to the websocket? Or after.


Payload
  notekey
  userid
  data
  type (awareness | sync)

Introduce a new websocket message
  type: 
  notekey
  userid
  data (fullYDoc)
  type (awareness | sync)