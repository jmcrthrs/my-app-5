import * as Y from "yjs";
import { Observable } from "lib0/observable";

export class Provider extends Observable {
  /**
   * @param {Y.Doc} ydoc
   */
  constructor(ydoc) {
    super();

    const ws = new WebSocket("ws:/localhost:8080");

    ws.addEventListener("message", (event) => {
      console.log("Message from server ", event);
      Y.applyUpdate(ydoc, new Uint8Array(event.data), this);
    });

    ydoc.on("update", (update, origin) => {
      console.log("update", update, origin);
      // ignore updates applied by this provider
      if (origin !== this) {
        // this update was produced either locally or by another provider.
        this.emit("update", [update]);
        ws.send(update)
      } else {
      }
    });
    // listen to an event that fires when a remote update is received
    this.on("update", (update) => {
      console.log("this.update", update);
      Y.applyUpdate(ydoc, update, this); // the third parameter sets the transaction-origin
    });
  }
}
