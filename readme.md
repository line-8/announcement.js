# announcement.js 📣

**Modern, high-performance event emitter**

- **🏃 Blazing fast**  
  Micro-optimised to achieve high speeds, even with a large amount of listeners,
  often outperforming the competition.
- **💪 Strongly typed**  
  Easily add type safety when using TypeScript, catching potential errors during
  compilation and making development overall significantly more pleasant.
- **🏖 Incredibly convenient**  
  Provides a modern interface that makes subscription management a breeze —
  Effortlessly remove listeners!
- **🧳 Portable everywhere**  
  ES3 compatible, dependency-free, supports all major module systems and can be
  used in browsers, workers and Node.js.

_...now sugar-free!_

<br/>

[![Line 8](https://img.shields.io/badge/line-8-%23EE5F64)](https://github.com/line-8)
[![npm](https://img.shields.io/npm/v/announcement.js)](https://npmjs.org/package/announcement.js)
[![Libera Manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey)](https://liberamanifesto.com)

---

## Installation

- **Node.js**  
  Install the `announcement.js` package from npm

  ```
  npm i announcement.js
  ```

- **UMD**  
  Load the `announcement` module from a CDN

  ```
  https://cdn.jsdelivr.net/npm/announcement.js/lib/index.min.js
  ```

## Usage

After installation, simply import the module with whatever module system you
are using. Be aware that Announcement provides named exports only.

```javascript
import { EventEmitter } from "announcement.js";
```

Now you are ready to create your own emitters.

```javascript
const emitter = new Announcement();

let listener = emitter.on("📣", console.log);

emitter.emit("📣", "Mind the gap");
// → "Mind the gap"

listener.dispose();

emitter.emit("📣", "Stand clear of the closing doors");
// Nothing happens
```

### TypeScript

The `Announcement` class accepts a single record as a type argument, which is
that maps all available topics to the type of data their events can carry. For
topics whose events do not hold any data, the `void` type can be used.

```typescript
interface Events {
  "🕳️": void;
  "🚏": { name: string };
  "🚇": { line: string } | void;
}

const emitter = new Announcement<Events>();

emitter.emit("🕳️", "Mind the gap");
// ✗: Expected 1 argument, but got 2.

emitter.emit("🚏", "Charing Cross");
// ✗: Argument of type 'string' is not assignable to parameter.

emitter.on("🚇", data => console.log(`This is a ${data.line} train`));
// ✗: Object is possibly 'undefined'.

emitter.on("🚏", data => console.log(`The next station is ${data.name}`));
// ✓
```

## API

### `Announcement`

A class that is responsible for transmitting events.

It has the following instance methods:

#### `on`

**Parameters**:  
&nbsp; topic: `string` | `symbol`  
&nbsp; handler: `Function`

**Returns**: [`Listener`](#listener)

Creates a new listener that waits for events of the specified topic to occur,
intercepts them, and invokes the given handler function.If the event holds
additional data, it will be provided as an argument when the handler function is
called.

#### `once`

**Parameters**:  
&nbsp; topic: `string` | `symbol`

**Returns**: [`Once`](#once)

Creates a one-time listener in the form of a promise, which is resolved as soon
as an event of the specified topic occurs. If the event holds additional data,
it is provided as the resolved value.

#### `emit`

**Parameters**:  
&nbsp; topic: `string` | `symbol`  
&nbsp; data?: `any`

**Returns**: `boolean`

Triggers a new event for the specified topic, optionally with some data,
notifying its subscribers.

The return value indicates whether there were active subscriptions for the
specified topic.

#### `count`

**Parameters**:  
&nbsp; topic: `string` | `symbol`

**Returns**: `boolean`

Returns the number of active subscriptions for the specified topic.

#### `clear`

**Parameters**:  
&nbsp; topic: `string` | `symbol`

**Returns**: `boolean`

Removes all subscriptions for the specified topic.

The return value indicates whether there were active subscriptions for the
specified topic.

### `Listener`

An object that waits for events of a given topic to occur, intercepts them, and
notifies its subscriber by calling a predefined handler function. If the event
holds additional data, it will be provided as an argument when the handler
function is called.

It has the following instance methods:

#### `cancel`

**Parameters**: ✗  
**Returns**: `boolean`

Disposes the listener by canceling the corresponding subscription and removing
the associated resources from the emitter. Subsequent method calls will have no
effect.

Call this method whenever a listener is no longer used in your application in
order to prevent memory leaks. To completely free it from memory, remove all
references to it.

The return value indicates whether the state of the listener was affected by the
method call.

### `Once`

A promise that is resolved as soon as an event related to a specific topic
occurs. If the event holds additional data, it is provided as the resolved
value.

All [instance methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#instance_methods)
of the built-in promise object can be used, with the addition of the following:

#### `cancel`

**Parameters**: ✗  
**Returns**: `boolean`

Cancels the promise by immediately rejecting it and removing the associated
resources from the emitter. Subsequent method calls will have no effect.

The return value indicates whether the state of the promise was affected by the
method call.

## FAQ

### Is Announcement comptaible with Node's event module?

**No**. While the core concept is the same, Announcement provides a
fundamentally different interface that focuses on being concise rather than
implementing Node's cluttered and outdated API surface.

### Does Announcement support multiple data arguments?

**No**. However, you can use [deconstruction](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)
to accomplish the same thing.

```javascript
emitter.on("🚇", ([line, terminal]) => {
  console.log(`This is a ${line} line train to ${terminal}`);
});

emitter.emit("🚇", ["District", "Upminster"]);
```
