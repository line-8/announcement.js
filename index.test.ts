import { Announcement, Listener } from "./index";

let announcement: Announcement<{ number: number; void: void }>;

beforeEach(() => (announcement = new Announcement()));

test("topic", () => {
  for (let topic of ["constructor", "__proto__", Symbol("foo")]) {
    let handler = jest.fn();
    announcement.on(topic as any, handler);
    expect(announcement.emit(topic as any)).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  }
});

test("emit", () => {
  let final: number[][] = [];

  let emit = () => announcement.emit("number", ++i),
    i = 0;

  let handler1 = (data: number) => final.push([1, data]),
    handler2 = (data: number) => final.push([2, data]),
    handler3 = (data: number) => final.push([3, data]);

  let listenerA = announcement.on("number", data => {
    handler1(data);
    listenerA.dispose();
    listenerX = announcement.on("number", data => {
      handler2(data);
      listenerX.dispose();
      listenerB.dispose();
    });
    if (i === 1) emit();
  });

  let listenerB = announcement.on("number", handler3);

  let listenerX: Listener;

  emit();
  expect(final).toEqual([
    [1, 1],
    [3, 2],
    [2, 2]
  ]);
});

test("listener", () => {
  let i = 0,
    emit = () => {
      console.log(announcement["channels"]["number"]);
      return announcement.emit("number", ++i);
    };

  let handler1 = jest.fn(),
    handler2 = jest.fn(),
    handler3 = jest.fn(),
    handler4 = jest.fn(),
    handler5 = jest.fn(),
    handler6 = jest.fn(),
    handler7 = jest.fn();

  let listenerA = announcement.on("number", data => {
    handler1(data);
    expect(listenerB.dispose()).toBe(i === 1);
    listenerX = announcement.on("number", handler2);
    listenerY = announcement.on("number", data => {
      handler3(data);
      expect(listenerC.dispose()).toBe(i === 2);
      expect(listenerY.dispose()).toBe(i === 2);
      expect(listenerZ.dispose()).toBe(i === 2);
      listenerO = announcement.on("number", data => {
        handler4(data);
        expect(listenerO.dispose()).toBe(i === 3);
      });
    });
    listenerZ = announcement.on("number", handler5);
  });

  let listenerB = announcement.on("number", handler6);

  let listenerC = announcement.on("number", data => {
    handler7(data);
    expect(listenerA.dispose()).toBe(i === 1);
    expect(listenerX.dispose()).toBe(i === 1);
  });

  let listenerX: Listener, listenerY: Listener, listenerZ: Listener, listenerO: Listener;

  expect(handler1).toHaveBeenCalledTimes(0);
  expect(handler2).toHaveBeenCalledTimes(0);
  expect(handler3).toHaveBeenCalledTimes(0);
  expect(handler4).toHaveBeenCalledTimes(0);
  expect(handler5).toHaveBeenCalledTimes(0);
  expect(handler6).toHaveBeenCalledTimes(0);
  expect(handler7).toHaveBeenCalledTimes(0);

  expect(announcement.count("number")).toBe(3);
  expect(emit()).toBe(true);
  expect(handler1).toHaveBeenCalledTimes(1);
  expect(handler2).toHaveBeenCalledTimes(0);
  expect(handler3).toHaveBeenCalledTimes(0);
  expect(handler4).toHaveBeenCalledTimes(0);
  expect(handler5).toHaveBeenCalledTimes(0);
  expect(handler6).toHaveBeenCalledTimes(0);
  expect(handler7).toHaveBeenCalledTimes(1);
  expect(handler1).toHaveBeenLastCalledWith(1);
  expect(handler7).toHaveBeenLastCalledWith(1);

  expect(announcement.count("number")).toBe(3);
  expect(emit()).toBe(true);
  expect(handler1).toHaveBeenCalledTimes(1);
  expect(handler2).toHaveBeenCalledTimes(0);
  expect(handler3).toHaveBeenCalledTimes(1);
  expect(handler4).toHaveBeenCalledTimes(0);
  expect(handler5).toHaveBeenCalledTimes(0);
  expect(handler6).toHaveBeenCalledTimes(0);
  expect(handler7).toHaveBeenCalledTimes(2);
  expect(handler3).toHaveBeenLastCalledWith(2);
  expect(handler7).toHaveBeenLastCalledWith(2);

  expect(announcement.count("number")).toBe(1);
  expect(emit()).toBe(true);
  expect(handler1).toHaveBeenCalledTimes(1);
  expect(handler2).toHaveBeenCalledTimes(0);
  expect(handler3).toHaveBeenCalledTimes(1);
  expect(handler4).toHaveBeenCalledTimes(1);
  expect(handler5).toHaveBeenCalledTimes(0);
  expect(handler6).toHaveBeenCalledTimes(0);
  expect(handler7).toHaveBeenCalledTimes(2);
  expect(handler4).toHaveBeenLastCalledWith(3);

  expect(announcement.count("number")).toBe(0);
  expect(emit()).toBe(false);
  expect(handler1).toHaveBeenCalledTimes(1);
  expect(handler2).toHaveBeenCalledTimes(0);
  expect(handler3).toHaveBeenCalledTimes(1);
  expect(handler4).toHaveBeenCalledTimes(1);
  expect(handler5).toHaveBeenCalledTimes(0);
  expect(handler6).toHaveBeenCalledTimes(0);
  expect(handler7).toHaveBeenCalledTimes(2);
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
  let handler1 = jest.fn(),
    handler2 = jest.fn(),
    handler3 = jest.fn();

  announcement.on("void", () => {
    handler1();
    expect(announcement.clear("void")).toBe(true);
    announcement.on("void", handler2);
  });
  announcement.on("void", handler3);

  expect(announcement.count("void")).toBe(2);
  expect(announcement.emit("void")).toBe(true);
  expect(handler1).toHaveBeenCalledTimes(1);
  expect(handler2).toHaveBeenCalledTimes(0);
  expect(handler3).toHaveBeenCalledTimes(0);

  expect(announcement.count("void")).toBe(1);
  expect(announcement.emit("void")).toBe(true);
  expect(handler1).toHaveBeenCalledTimes(1);
  expect(handler2).toHaveBeenCalledTimes(1);
  expect(handler3).toHaveBeenCalledTimes(0);

  expect(announcement.clear("void")).toBe(true);
  expect(announcement.count("void")).toBe(0);
  expect(announcement.clear("void")).toBe(false);
});
