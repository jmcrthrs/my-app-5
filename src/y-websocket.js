/**
 * @module provider/websocket
 */

/* eslint-env browser */

import * as Y from "yjs"; // eslint-disable-line
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import { Observable } from "lib0/observable";

export const messageSync = 0;
export const messageQueryAwareness = 3;
export const messageAwareness = 1;

/**
 *                       encoder,          decoder,          provider,          emitSynced, messageType
 * @type {Array<function(encoding.Encoder, decoding.Decoder, WebsocketProvider, boolean,    number):void>}
 */
const messageHandlers = [];

messageHandlers[messageSync] = (
  encoder,
  decoder,
  provider,
  emitSynced,
  _messageType
) => {
  encoding.writeVarUint(encoder, messageSync);
  const syncMessageType = syncProtocol.readSyncMessage(
    decoder,
    encoder,
    provider.doc,
    provider
  );
  if (
    emitSynced &&
    syncMessageType === syncProtocol.messageYjsSyncStep2 &&
    !provider.synced
  ) {
    provider.synced = true;
  }
};

messageHandlers[messageQueryAwareness] = (
  encoder,
  _decoder,
  provider,
  _emitSynced,
  _messageType
) => {
  encoding.writeVarUint(encoder, messageAwareness);
  encoding.writeVarUint8Array(
    encoder,
    awarenessProtocol.encodeAwarenessUpdate(
      provider.awareness,
      Array.from(provider.awareness.getStates().keys())
    )
  );
};

messageHandlers[messageAwareness] = (
  _encoder,
  decoder,
  provider,
  _emitSynced,
  _messageType
) => {
  awarenessProtocol.applyAwarenessUpdate(
    provider.awareness,
    decoding.readVarUint8Array(decoder),
    provider
  );
};

/**
 * @param {WebsocketProvider} provider
 * @param {Uint8Array} buf
 * @param {boolean} emitSynced
 * @return {encoding.Encoder}
 */
const readMessage = (provider, buf, emitSynced) => {
  const decoder = decoding.createDecoder(buf);
  const encoder = encoding.createEncoder();
  const messageType = decoding.readVarUint(decoder);
  const messageHandler = provider.messageHandlers[messageType];
  if (/** @type {any} */ (messageHandler)) {
    messageHandler(encoder, decoder, provider, emitSynced, messageType);
  } else {
    console.error("Unable to compute message");
  }
  return encoder;
};

export const handleWebSocketClose = (provider, websocket) => {
  if (provider.wsconnected) {
    provider.synced = false;
    // update awareness (all users except local left)
    awarenessProtocol.removeAwarenessStates(
      provider.awareness,
      Array.from(provider.awareness.getStates().keys()).filter(
        (client) => client !== provider.doc.clientID
      ),
      provider
    );
    provider.emit("status", [
      {
        status: "disconnected",
      },
    ]);
  }
};

export const getFullDocSyncStep = (provider) => {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeSyncStep2(encoder, provider.doc);
  return encoding.toUint8Array(encoder);
};

export const handleWebSocketOpen = (provider) => {
  provider.emit("status", [
    {
      status: "connected",
    },
  ]);
  // always send sync step 1 when connected
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeSyncStep1(encoder, provider.doc);
  provider.customSend(encoding.toUint8Array(encoder), messageSync);

  // broadcast local awareness state
  if (provider.awareness.getLocalState() !== null) {
    const encoderAwarenessState = encoding.createEncoder();
    encoding.writeVarUint(encoderAwarenessState, messageAwareness);
    encoding.writeVarUint8Array(
      encoderAwarenessState,
      awarenessProtocol.encodeAwarenessUpdate(provider.awareness, [
        provider.doc.clientID,
      ])
    );

    provider.customSend(
      encoding.toUint8Array(encoderAwarenessState),
      messageAwareness
    );
  }
};

export const handleInitialConnection = handleWebSocketOpen;

export const handleWebSocketMessage = (provider, event) => {
  const encoder = readMessage(provider, new Uint8Array(event.data), true);
  if (encoding.length(encoder) > 1) {
    const decoder = decoding.createDecoder(new Uint8Array(event.data));
    const messageType = decoding.readVarUint(decoder);
    provider.customSend(encoding.toUint8Array(encoder), messageType);
  }
};

/**
 * @param {WebsocketProvider} provider
 * @param {ArrayBuffer} buf
 */
const broadcastMessage = (provider, buf, messageType) => {
  provider.customSend(buf, messageType);
};

/**
 * Websocket Provider for Yjs. Creates a websocket connection to sync the shared document.
 * The document name is attached to the provided url. I.e. the following example
 * creates a websocket connection to http://localhost:1234/my-document-name
 *
 * @example
 *   import * as Y from 'yjs'
 *   import { WebsocketProvider } from 'y-websocket'
 *   const doc = new Y.Doc()
 *   const provider = new WebsocketProvider('http://localhost:1234', 'my-document-name', doc)
 *
 * @extends {Observable<string>}
 */
export class WebsocketProvider extends Observable {
  /**
   * @param {Y.Doc} doc
   * @param {object} opts
   * @param {awarenessProtocol.Awareness} [opts.awareness]
   */
  constructor(
    doc,
    { awareness = new awarenessProtocol.Awareness(doc), customSend } = {}
  ) {
    super();

    this.customSend = customSend;
    this.doc = doc;
    this.awareness = awareness;
    this.messageHandlers = messageHandlers.slice();
    /**
     * @type {boolean}
     */
    this._synced = false;

    /**
     * Listens to Yjs updates and sends them to remote peers (ws and broadcastchannel)
     * @param {Uint8Array} update
     * @param {any} origin
     */
    this._updateHandler = (update, origin) => {
      if (origin !== this) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.writeUpdate(encoder, update);
        broadcastMessage(this, encoding.toUint8Array(encoder), messageSync);
      }
    };
    this.doc.on("update", this._updateHandler);
    /**
     * @param {any} changed
     * @param {any} _origin
     */
    this._awarenessUpdateHandler = ({ added, updated, removed }, _origin) => {
      const changedClients = added.concat(updated).concat(removed);
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
      );
      broadcastMessage(this, encoding.toUint8Array(encoder), messageAwareness);
    };

    awareness.on("update", this._awarenessUpdateHandler);
  }

  /**
   * @type {boolean}
   */
  get synced() {
    return this._synced;
  }

  set synced(state) {
    if (this._synced !== state) {
      this._synced = state;
      this.emit("synced", [state]);
      this.emit("sync", [state]);
    }
  }

  destroy() {
    this.awareness.off("update", this._awarenessUpdateHandler);
    this.doc.off("update", this._updateHandler);
    super.destroy();
  }
}
