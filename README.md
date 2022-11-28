# flags

Command line argument parser for deno and node.js

**Features:**

- Simple to use but rich in features
- Supports using '-' to define short flags and '--' to define long flags
- Automatically verify flags
- Support subcommands
- All commands have built-in support -h/--help flags output usage instructions

**Index:**

- [Background](#Background)
- [Install](#Install)
- Usage
  - [Command](#Command)
  - [Verify Flags](#Verify-Flags)
  - [Subcommands](#Subcommands)

# Background

I found that deno is very suitable for writing command line programs, but there
is no easy-to-use and feature-rich command line parsing library, so I wrote one
myself, because it is a pure syntax parsing that does not use deno features, so
node.js or other js The operating environment can also be used normally

# Install

If you use deno you can create a deps.ts:

```
export * from "https://raw.githubusercontent.com/powerpuffpenguin/ts-flag/0.0.1/deno/mod.ts";
```

If you have nodejs you can use npm or similar package management tool to
install:

```
npm install @king011/flags
```

# Command

Command represents a command and passes it to Parser for parameter parsing

```
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
```

For **nodejs** users only need to modify import and the parameters passed to
parse

```
import { Command, Parser } from "@king011/flags";

new Parser(root).parse(process.argv.splice(2));
```

> Subsequent examples only need to modify import and parse to execute in the
> nodejs environment, so I won’t repeat them here

# Verify Flags

When defining flags, its data type needs to be clearly specified, and class
Flags will verify whether the parameter can be converted to a valid type when
parsing

In addition, you can explicitly specify a values array to define valid values,
or define a validation function to validate parameters

```
import { Command, Parser } from "./deps.ts";
const root = new Command({
  use: "verify.ts",
  short: "Demonstrates how to verify flags",
  prepare(flags) {
    const port = flags.number({
      name: "port",
      short: "p",
      usage: "listen port",
      default: 80,
      isValid: (v) => {
        return Math.floor(v) == v && v > 0 && v < 65535;
      },
    });
    const scheme = flags.string({
      name: "scheme",
      short: "s",
      default: "http",
      usage: "protocol scheme",
      values: [
        "http",
        "https",
        "rpc",
        "grpc",
      ],
    });
    return () => {
      console.log(`${scheme.value} listen on port ${port.value}`);
    };
  },
});

new Parser(root).parse(Deno.args);
```

# Subcommands

Command has an add function that can add other Commands as its own subcommands

```
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
```
