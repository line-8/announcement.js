import { Announcement, Listener } from "./index";

let announcement: Announcement<{ number: number; void: void }>;

beforeEach(() => (announcement = new Announcement()));

test("emit", () => {
  for (let topic of ["constructor", "__proto__", Symbol("foo")]) {
    let handler = jest.fn();
    announcement.on(topic as any, handler);
    expect(announcement.emit(topic as any)).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  }
});

test("listener", () => {
  let i = 0,
    emit = () => announcement.emit("number", ++i);

  let handler1 = jest.fn(),
    handler2 = jest.fn(),
    handler3 = jest.fn(),
    handler4 = jest.fn(),
    handler5 = jest.fn();

  let listenerA = announcement.on("number", data => {
    handler1(data);
    expect(listenerB.dispose()).toBe(i === 1);
    listenerX = announcement.on("number", handler2);
    listenerY = announcement.on("number", data => {
      handler3(data);
      expect(listenerC.dispose()).toBe(i === 2);
      expect(listenerY.dispose()).toBe(i === 2);
    });
  });

  let listenerB = announcement.on("number", handler4);

  let listenerC = announcement.on("number", data => {
    handler5(data);
    expect(listenerA.dispose()).toBe(i === 1);
    expect(listenerX.dispose()).toBe(i === 1);
  });

  let listenerX: Listener, listenerY: Listener;

  expect(handler1).toHaveBeenCalledTimes(0);
  expect(handler2).toHaveBeenCalledTimes(0);
  expect(handler3).toHaveBeenCalledTimes(0);
  expect(handler4).toHaveBeenCalledTimes(0);
  expect(handler5).toHaveBeenCalledTimes(0);

  expect(announcement.count("number")).toBe(3);
  expect(emit()).toBe(true);
  expect(handler1).toHaveBeenCalledTimes(1);
  expect(handler2).toHaveBeenCalledTimes(0);
  expect(handler3).toHaveBeenCalledTimes(0);
  expect(handler4).toHaveBeenCalledTimes(0);
  expect(handler5).toHaveBeenCalledTimes(1);
  expect(handler1).toHaveBeenLastCalledWith(1);
  expect(handler5).toHaveBeenLastCalledWith(1);

  expect(announcement.count("number")).toBe(2);
  expect(emit()).toBe(true);
  expect(handler1).toHaveBeenCalledTimes(1);
  expect(handler2).toHaveBeenCalledTimes(0);
  expect(handler3).toHaveBeenCalledTimes(1);
  expect(handler4).toHaveBeenCalledTimes(0);
  expect(handler5).toHaveBeenCalledTimes(2);
  expect(handler3).toHaveBeenLastCalledWith(2);
  expect(handler5).toHaveBeenLastCalledWith(2);

  expect(announcement.count("number")).toBe(0);
  expect(emit()).toBe(false);
  expect(handler1).toHaveBeenCalledTimes(1);
  expect(handler2).toHaveBeenCalledTimes(0);
  expect(handler3).toHaveBeenCalledTimes(1);
  expect(handler4).toHaveBeenCalledTimes(0);
  expect(handler5).toHaveBeenCalledTimes(2);
});

test("once", async () => {
  let promise1 = announcement.once("number"),
    promise2 = announcement.once("number");

  expect(announcement.count("number")).toBe(2);
  expect(promise1.cancel()).toBe(true);

  expect(announcement.count("number")).toBe(1);
  expect(announcement.emit("number", 1)).toBe(true);
  expect(promise1.cancel()).toBe(false);

  await expect(promise1).rejects.toBe(undefined);
  await expect(promise2).resolves.toBe(1);

  expect(announcement.count("number")).toBe(0);
  expect(announcement.emit("number", 2)).toBe(false);
  expect(promise2.cancel()).toBe(false);

  await expect(promise1).rejects.toBe(undefined);
  await expect(promise2).resolves.toBe(1);
});

test("clear", async () => {
  // let handler1 = jest.fn(),
  //   handler2 = jest.fn(),
  //   handler3 = jest.fn();
  // let listener3: Listener;
  // let listener1 = announcement.on("void", () => {
  //   handler1();
  //   expect(announcement.clear("void")).toBe(true);
  //   listener3 = announcement.on("void", handler3);
  // });
  // let listener2 = announcement.on("void", handler2);
  // let promise = announcement.once("void");
  // expect(announcement.count("void")).toBe(3);
  // expect(announcement.emit("void")).toBe(true);
  // expect(handler1).toHaveBeenCalledTimes(1);
  // expect(handler2).toHaveBeenCalledTimes(0);
  // expect(handler3).toHaveBeenCalledTimes(0);
  // expect(listener1.dispose()).toBe(false);
  // expect(listener2.dispose()).toBe(false);
  // await expect(promise).rejects.toBe(undefined);
  // console.log(announcement["channels"]);
  // expect(announcement.count("void")).toBe(1);
  // expect(announcement.emit("void")).toBe(true);
  // expect(handler1).toHaveBeenCalledTimes(1);
  // expect(handler2).toHaveBeenCalledTimes(0);
  // expect(handler3).toHaveBeenCalledTimes(1);
  // expect(listener3!.dispose()).toBe(true);
  // await expect(promise).rejects.toBe(undefined);
  // expect(announcement.clear("void")).toBe(false);
});
