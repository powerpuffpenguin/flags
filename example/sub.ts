import { Command, Parser } from "./deps.ts";
const root = new Command({
  use: "main.ts",
  short: "Demonstrates how to add sub commands",
  run(_, cmd) {
    cmd.print();
  },
});

root.add(
  new Command({
    use: "add",
    short: "sum of numbers",
    run(args) {
      let num = 0;
      for (let i = 0; i < args.length; i++) {
        const n = parseInt(args[i]);
        if (!isFinite(n)) {
          throw new Error(`args[${i}] is not a int: ${n}`);
        }
        num += n;
      }
      console.log(`num=${num}`);
    },
  }),
  new Command({
    use: "join",
    short: "join strings",
    prepare(flags) {
      const separator = flags.string({
        name: "separator",
        short: "s",
        default: ",",
        usage:
          "A string used to separate one element of the array from the next in the resulting string.",
      });
      return (args) => {
        console.log(args.join(separator.value));
      };
    },
  }),
);
new Parser(root).parse(Deno.args);
