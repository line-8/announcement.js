type Catalog = { [topic: string | symbol]: any };

type Topic<C extends Catalog> = Extract<keyof C, string | symbol>;

// prettier-ignore
type Data<C extends Catalog, T extends Topic<C>> =
  // `any` → expect zero arguments or one argument of any type
  0 extends 1 & C[T] ? [data?: any] :
  // `void` → expect zero arguments or one optional argument of any type
  void extends C[T] ? (C[T] extends void ? [] : [data?: Exclude<C[T], void>]) :
  // default → expect one argument of the specified type
  [data: C[T]];

export type Handler<C extends Catalog, T extends Topic<C>> = (...data: Data<C, T>) => void;

/**
 * An object that waits for events of a given topic to occur, intercepts them,
 * and notifies its subscriber by calling a predefined handler function. If the
 * event holds additional data, it will be provided as an argument when the
 * handler function is called.
 */
export interface Listener {
  /**
   * Disposes the listener by canceling the corresponding subscription and
   * removing the associated resources from the emitter. Subsequent method
   * calls will have no effect.
   *
   * Call this method whenever a listener is no longer used in your application
   * in order to prevent memory leaks. To completely free it from memory, remove
   * all references to it.
   *
   * The return value indicates whether the state of the listener was affected
   * by the method call.
   */
  dispose(): boolean;
}

/**
 * A promise that is resolved as soon as an event related to a specific topic
 * occurs. If the event holds additional data, it is provided as the resolved
 * value.
 */
export interface Once<C extends Catalog, T extends Topic<C>> extends Promise<Data<C, T>> {
  /**
   * Cancels the promise by immediately rejecting it and removing the associated
   * resources from the emitter. Subsequent method calls will have no effect.
   *
   * The return value indicates whether the state of the promise was affected
   * by the method call.
   */
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

/**
 * A class that is responsible for transmitting events.
 */
export class Announcement<C extends Catalog> {
  private _channels: { [T in Topic<C>]?: Tracker<C> | Tracker<C>[] } = new Channels();
  private _cycle: number = 0;

  private _add(tracker: Tracker<C>) {
    let channel = this._channels[tracker.topic];
    // no existing channel → store tracker as channel
    if (!channel) this._channels[tracker.topic] = tracker;
    // channel is an array of trackers → push tracker into array
    else if (Array.isArray(channel)) channel.push(tracker);
    // channel is a single tracker → upgrade to array
    else this._channels[tracker.topic] = [channel, tracker];
  }

  private _remove(tracker: Tracker<C>) {
    let channel = this._channels[tracker.topic];
    // channel is a single tracker → delete channel
    if (!Array.isArray(channel)) delete this._channels[tracker.topic];
    // channel has two trackers → downgrade from array
    else if (channel.length === 2) this._channels[tracker.topic] = channel[channel[0] === tracker ? 1 : 0];
    // channel has many trackers → splice tracker from array
    else channel.splice(channel.indexOf(tracker), 1);
  }

  private _dispose(tracker: Tracker<C>) {
    if (!tracker.alive) return false;
    this._remove(tracker);
    this._kill(tracker);
    return true;
  }

  private _kill(tracker: Tracker<C>) {
    tracker.alive = false;
    tracker.kill?.();
  }

  /**
   * Creates a new listener that waits for events of the specified topic to
   * occur, intercepts them, and invokes the given handler function.If the event
   * holds additional data, it will be provided as an argument when the handler
   * function is called.
   */
  public on<T extends Topic<C>>(topic: T, handler: Handler<C, T>): Listener {
    let tracker: Tracker<C> = {
      topic,
      alive: true,
      cycle: this._cycle,
      process: handler
    };
    this._add(tracker);
    return { dispose: () => this._dispose(tracker) };
  }

  /**
   * Creates a one-time listener in the form of a promise, which is resolved as
   * soon as an event of the specified topic occurs. If the event holds
   * additional data, it is provided as the resolved value.
   */
  public once<T extends Topic<C>>(topic: T) {
    let resolve: (data?: any) => void, reject: () => void;

    let tracker: Tracker<C> = {
      topic,
      alive: true,
      cycle: this._cycle,
      process: data => {
        this._remove(tracker);
        tracker.alive = false;
        resolve(data);
      },
      kill: () => reject()
    };
    this._add(tracker);

    let promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    }) as Once<C, T>;

    promise.cancel = () => this._dispose(tracker);
    return promise;
  }

  /**
   * Triggers a new event for the specified topic, optionally with some data,
   * notifying its subscribers.
   *
   * The return value indicates whether there were active subscriptions for the
   * specified topic.
   */
  public emit<T extends Topic<C>>(topic: T, ...data: Data<C, T>): boolean;
  /** @internal */
  public emit(topic: Topic<C>, data?: any) {
    let channel = this._channels[topic];
    if (!channel) return false;
    this._cycle++;

    // single tracker → process directly
    if (!Array.isArray(channel)) channel.process(data);
    // multiple trackers → iterate and check
    else {
      for (let i = 0; i < channel.length; i++) {
        let tracker = channel[i];
        // only process trackers that were added before emission
        if (tracker.alive && tracker.cycle < this._cycle) tracker.process(data);
      }
    }
    return true;
  }

  /**
   * Returns the number of active subscriptions for the specified topic.
   */
  public count(topic: Topic<C>) {
    let channel = this._channels[topic];
    if (!channel) return 0;
    else if (!Array.isArray(channel)) return 1;
    else return channel.length;
  }

  /**
   * Removes all subscriptions for the specified topic.
   *
   * The return value indicates whether there were active subscriptions for the
   * specified topic
   */
  public clear(topic: Topic<C>) {
    let channel = this._channels[topic];
    if (!channel) return false;
    delete this._channels[topic];

    if (!Array.isArray(channel)) this._kill(channel);
    else for (let tracker of channel) this._kill(tracker);
    return true;
  }
}
