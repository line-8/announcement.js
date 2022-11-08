type Catalog = { [topic: string | symbol]: any };

type Topic<C extends Catalog> = Extract<keyof C, string | symbol>;

// prettier-ignore
type Data<C extends Catalog, T extends Topic<C>> =
  0 extends 1 & C[T] ? [data?: any] :
  void extends C[T] ? (C[T] extends void ? [] : [data?: Exclude<C[T], void>]) :
  [data: C[T]];

export type Handler<C extends Catalog, T extends Topic<C>> = (...data: Data<C, T>) => void;

export interface Listener {
  dispose(): boolean;
}

export interface Once<C extends Catalog, T extends Topic<C>> extends Promise<Data<C, T>> {
  cancel(): boolean;
}

interface Tracker<C extends Catalog> {
  topic: Topic<C>;
  cycle: number;
  alive: boolean;
  process(data?: any): void;
  kill?(): void;
}

const Channels: any = function () {};
Channels.prototype = Object.create(null);

export class Announcement<C extends Catalog> {
  private channels: { [T in Topic<C>]?: Tracker<C> | Tracker<C>[] } = new Channels();
  private cycle: number = 0;

  private add(tracker: Tracker<C>) {
    let channel = this.channels[tracker.topic];
    if (!channel) this.channels[tracker.topic] = tracker;
    else if (Array.isArray(channel)) channel.push(tracker);
    else this.channels[tracker.topic] = [channel, tracker];
  }

  private remove(tracker: Tracker<C>) {
    let channel = this.channels[tracker.topic];
    if (!Array.isArray(channel)) delete this.channels[tracker.topic];
    else if (channel.length === 2) this.channels[tracker.topic] = channel[channel[0] === tracker ? 1 : 0];
    else channel.splice(channel.indexOf(tracker), 1);
  }

  private dispose(tracker: Tracker<C>) {
    if (!tracker.alive) return false;
    this.remove(tracker);
    this.kill(tracker);
    return true;
  }

  private kill(tracker: Tracker<C>) {
    tracker.alive = false;
    tracker.kill?.();
  }

  public on<T extends Topic<C>>(topic: T, handler: Handler<C, T>): Listener {
    let tracker: Tracker<C> = {
      topic,
      alive: true,
      cycle: this.cycle,
      process: handler
    };
    this.add(tracker);
    return { dispose: () => this.dispose(tracker) };
  }

  public once<T extends Topic<C>>(topic: T) {
    let resolve: (data?: any) => void, reject: () => void;

    let tracker: Tracker<C> = {
      topic,
      alive: true,
      cycle: this.cycle,
      process: data => {
        this.remove(tracker);
        tracker.alive = false;
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
    this.cycle++;

    if (!Array.isArray(channel)) channel.process(data);
    else {
      let tracker: Tracker<C>;
      for (let i = 0, l = channel.length; i < l && (tracker = channel[i]); i++) {
        if (tracker.alive && tracker.cycle < this.cycle) tracker.process(data);
      }
    }
    return true;
  }

  public count(topic: Topic<C>) {
    let channel = this.channels[topic];
    if (!channel) return 0;
    else if (!Array.isArray(channel)) return 1;
    else return channel.length;
  }

  public clear(topic: Topic<C>) {
    let channel = this.channels[topic];
    if (!channel) return false;
    delete this.channels[topic];

    if (!Array.isArray(channel)) this.kill(channel);
    else for (let tracker of channel) this.kill(tracker);
    return true;
  }
}
