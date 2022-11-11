import { Event, Suite } from "benchmark";
import { Announcement, Listener } from "./index";

interface Test {
  name: string;
  function: (count: number) => VoidFunction;
}

const counts = [1, 2, 5, 10, 100, 1000, 10000, 100000];

const tests: Test[] = [
  {
    name: "emit",
    function: count => {
      let announcement = new Announcement();
      for (let i = 0; i < count; i++) announcement.on("foo", () => {});
      return () => announcement.emit("foo");
    }
  },
  {
    name: "listener",
    function: count => {
      let announcement = new Announcement();
      return () => {
        let listeners: Listener[] = new Array(count);
        for (let i = 0; i < count; i++) listeners[i] = announcement.on("foo", () => {});
        for (let i = 0; i < count; i++) listeners[i].dispose();
      };
    }
  }
];

console.clear();

for (let test of tests) {
  console.log(`\x1b[1m${test.name}\x1b[0m`);

  let suite = new Suite();
  for (let count of counts) suite.add(`${count}`, test.function(count));
  suite.on("cycle", (e: Event) => console.log(e.target.toString()));
  suite.run();

  console.log("\n");
}
