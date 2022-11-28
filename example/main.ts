import { Command, Parser } from "./deps.ts";
const root = new Command({
  use: "main.ts",
  short: "Demonstrates how to use the flags library",
  // Set up a preprocessor for defining flags
  prepare(flags) {
    // define a string flag
    const s = flags.string({
      name: "string",
      short: "s",
      default: "-",
      usage: "define a string flag",
    });
    // define a bool flag
    const v = flags.bool({
      name: "version",
      usage: "print app version",
    });
    // define array flag
    const n = flags.numbers({
      name: "number",
      short: "n",
      usage: "define a Array<number> flag",
    });

    // Returns a callback function to handle the code to be executed by the command
    return (args) => {
      // Use closures to get parsed flags values
      if (v.value) {
        console.log("version: v0.0.1");
      }
      console.log("string=", s.value);
      console.log("numbers=", n.value);
      // other args
      console.log("args=", args);
    };
  },
});

new Parser(root).parse(Deno.args);
