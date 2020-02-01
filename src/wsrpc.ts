import { EventEmitter } from "~event-emitter";

interface Resolver<T> {
  resolve(arg: T): void;
  reject(err: Error): void;
}

export type ProxiedAPI<T> = {
  readonly [P in keyof T]: T[P] extends (...args: infer TArgs) => infer TReturn
  ? (...args: TArgs) => Promise<TReturn>
  : ProxiedAPI<T[P]>;
};

type ProxiedEvent<T> = {
  on<K extends keyof T>(event: K, listener: (obj: T[K]) => void): void;
  off<K extends keyof T>(event: K, listener?: (obj: T[K]) => void): void;
};

type JSONRPCResponse = {
  jsonrpc: "2.0";
  result: any;
  error: {
    code: number;
    message: string;
    data?: object;
  }
  id?: number;
}

type JSONRPCNotification = {
  notification: string;
  params: any[];
}

export type RPCBase = {
  rpc: {
    on(...args: string[]): void;
    off(...args: string[]): void;
  }
}

export class JSONRPCError extends Error {
  code: number;
  data?: object;
  constructor(err: JSONRPCResponse["error"]) {
    super(err.message);
    this.code = err.code;
    this.data = err.data;
  }
}

export interface WebSocketRPCPortView {
  unbind(): void;
  send(data: ArrayBuffer): void;
}

interface WebSocketRPCBase<T extends object, E extends object> {
  proxy(): Promise<ProxiedAPI<T & {
    rpc: {
      on(...args: (keyof E)[]): void;
      off(...args: (keyof E)[]): void;
    }
  }>>
  blob(key: number): ArrayBuffer;
  sendBlob(data: ArrayBuffer): number;
  close(): void;
  on(ev: "close", fn: (e: Error) => void): void;
  off(ev: "close", fn?: (e: Error) => void): void;
  bindPort(port: number, handler: (data?: ArrayBuffer) => void): WebSocketRPCPortView;
}

const magic = 2147483648;

class WebSocketRPCImpl<T extends object> extends EventEmitter {
  private connection: WebSocket;
  private maxid: number;
  private pending: Map<number, Resolver<object>>;
  private promise: Promise<void>;
  private blobs: Map<number, ArrayBuffer>;
  private portHandler: Map<number, (data?: ArrayBuffer) => void>;
  constructor(address: string) {
    super();
    this.connection = new WebSocket(address);
    this.connection.binaryType = "arraybuffer";
    this.maxid = 0;
    this.pending = new Map();
    this.blobs = new Map();
    this.portHandler = new Map();
    this.promise = new Promise((resolve, reject) => {
      this.connection.onopen = () => {
        this.connection.onmessage = this.handleMessage.bind(this);
        this.connection.onerror = this.handleError.bind(this);
        this.connection.onclose = this.handleClose.bind(this);
        resolve();
      };
      this.connection.onclose = (ev: CloseEvent) => {
        reject(new Error(ev.reason != "" ? ev.reason : "Failed to connect the address"))
      };
    });
  }

  close() {
    this.connection.onclose = null;
    this.connection.close();
  }

  blob(key: number): ArrayBuffer {
    const ret = this.blobs.get(key);
    if (!ret) {
      throw new Error(`Blob ${key} Not found`);
    }
    this.blobs.delete(key);
    return ret;
  }

  sendBlob(data: ArrayBuffer): number {
    const id = Math.floor(Math.random() * magic);
    const xdata = new ArrayBuffer(data.byteLength + 4);
    const view = new DataView(xdata);
    view.setUint32(0, id, false);
    const u8a = new Uint8Array(xdata);
    u8a.set(new Uint8Array(data), 4);
    this.connection.send(xdata);
    return id;
  }

  bindPort(port: number, handler: (data: ArrayBuffer) => void) {
    this.portHandler.set(port, handler);
    return {
      unbind: () => this.portHandler.delete(port),
      send: (data: ArrayBuffer) => {
        const xdata = new ArrayBuffer(data.byteLength + 4);
        const view = new DataView(xdata);
        view.setUint32(0, port + magic, false);
        const u8a = new Uint8Array(xdata);
        u8a.set(new Uint8Array(data), 4);
        this.connection.send(xdata);
      }
    };
  }

  private handleMessage(ev: MessageEvent) {
    if (ev.data instanceof ArrayBuffer) {
      const data = ev.data.slice(4);
      const view = new DataView(ev.data);
      const key = view.getUint32(0, false);
      if (key > magic) {
        this.portHandler.get(key - magic)?.(data);
        return;
      }
      this.blobs.set(key, data);
      return;
    }
    const resp = JSON.parse(ev.data) as (JSONRPCResponse | JSONRPCNotification);
    if ("notification" in resp) {
      this.emit(resp.notification, resp.params);
      return;
    }
    if (resp.jsonrpc !== "2.0") {
      console.error("Malformed json-rpc response: %s", ev.data);
      return;
    }
    if (resp.id != null) {
      const resolver = this.pending.get(resp.id);
      if (!resolver) {
        console.error("Unknown id: %d", resp.id);
        return;
      }
      if (resp.error) {
        resolver.reject(new JSONRPCError(resp.error));
      } else if ("result" in resp) {
        resolver.resolve(resp.result);
      } else {
        console.error("Malformed json-rpc response: %o", resp);
        return;
      }
      this.pending.delete(resp.id);
    }
  }

  private handleError(ev: Event) {
    this.connection.close();
  }

  private handleClose(ev: CloseEvent) {
    const err = new Error(ev.reason);
    this.pending.forEach((resolver) => resolver.reject(err));
    this.pending.clear();
    this.emit("close", err);
  }

  async proxy(): Promise<ProxiedAPI<T & RPCBase>> {
    await this.promise;
    function dproxy(this: WebSocketRPCImpl<T>, obj: any, prefix?: string): any {
      return new Proxy(obj, {
        get: (_: any, key: string) => {
          if (key == "then" || key == "clear" || key == "valueOf" || key == "toSeq") return undefined;
          const realkey = prefix ? prefix + "." + key : key;
          const fn = (...args: any[]) => {
            return new Promise((resolve, reject) => {
              const id = this.maxid++;
              this.pending.set(id, { resolve, reject });
              this.connection.send(JSON.stringify({
                jsonrpc: "2.0",
                method: realkey,
                params: args,
                id,
              }));
            })
          };
          return dproxy.call(this, fn, realkey);
        },
        set() { return false; }
      });
    }
    const ret = dproxy.call(this, {});
    Object.defineProperty(this, "proxy", () => Promise.resolve(ret));
    return ret;
  }
}

export type WebSocketRPC<T extends object, E extends object> = WebSocketRPCBase<T, E> & ProxiedEvent<E>;
export const WebSocketRPC: new <T extends object, E extends object>(address: string) => WebSocketRPC<T, E> = WebSocketRPCImpl as any;