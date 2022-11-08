type Catalog = { [topic: string | symbol]: any };

type Topic<C extends Catalog> = Extract<keyof C, string | symbol>;

// prettier-ignore
type Data<C extends Catalog, T extends Topic<C>> =
  // `any` → expect zero arguments or one argument of any type
  0 extends 1 & C[T] ? [data?: any] :
  // `void` → expect zero arguments or one argument of the specified union type
  void extends C[T] ? (C[T] extends void ? [] : [data?: Exclude<C[T], void>]) :
  // default → expect an argument of the specified type
  [data: C[T]];

export type Handler<C extends Catalog, T extends Topic<C>> = (...data: Data<C, T>) => void;

export interface Listener {
  dispose(): boolean;
}

export interface Once<C extends Catalog, T extends Topic<C>> extends Promise<Data<C, T>> {
  cancel(): boolean;
}

enum Status {
  Idle,
  Active,
  Dead
}

interface Tracker<C extends Catalog> {
  topic: Topic<C>;
  status: Status;
  process(data?: any): void;
  kill?(): void;
}

const Channels: any = function () {};
Channels.prototype = Object.create(null);

export class Announcement<C extends Catalog> {
  private channels: { [T in Topic<C>]?: Set<Tracker<C>> } = new Channels();
  private processing: boolean = false;

  private add(tracker: Tracker<C>) {
    let channel = this.channels[tracker.topic];
    if (!channel) channel = this.channels[tracker.topic] = new Set();
    channel.add(tracker);
  }

  private remove(tracker: Tracker<C>) {
    let channel = this.channels[tracker.topic]!;
    if (channel.size === 1) delete this.channels[tracker.topic];
    else channel.delete(tracker);
  }

  private dispose(tracker: Tracker<C>) {
    if (tracker.status === Status.Dead) return false;
    this.remove(tracker);
    this.kill(tracker);
    return true;
  }

  private kill(tracker: Tracker<C>) {
    tracker.status = Status.Dead;
    tracker.kill?.();
  }

  public on<T extends Topic<C>>(topic: T, handler: Handler<C, T>): Listener {
    let tracker: Tracker<C> = {
      topic,
      status: this.processing ? Status.Idle : Status.Active,
      process: handler
    };

    this.add(tracker);
    return { dispose: () => this.dispose(tracker) };
  }

  public once<T extends Topic<C>>(topic: T) {
    let resolve: (data?: any) => void, reject: () => void;

    let tracker: Tracker<C> = {
      topic,
      status: this.processing ? Status.Idle : Status.Active,
      process: data => {
        this.remove(tracker);
        tracker.status = Status.Dead;
        resolve(data);
      },
      kill: () => reject()
    };
    this.add(tracker);

    let promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    }) as Once<C, T>;

    promise.cancel = () => this.dispose(tracker);
    return promise;
  }

  public emit<T extends Topic<C>>(topic: T, ...data: Data<C, T>): boolean;
  /** @internal */
  public emit(topic: Topic<C>, data?: any) {
    let channel = this.channels[topic];
    if (!channel) return false;
    this.processing = true;

    for (let tracker of channel) {
      if (tracker.status === Status.Active) tracker.process(data);
      else if (tracker.status === Status.Idle) tracker.status = Status.Active;
    }

    this.processing = false;
    return true;
  }

  public count(topic: Topic<C>) {
    return this.channels[topic]?.size || 0;
  }

  public clear(topic: Topic<C>) {
    let channel = this.channels[topic];
    if (!channel) return false;
    delete this.channels[topic];

    for (let tracker of channel) this.kill(tracker);
    return true;
  }
}
