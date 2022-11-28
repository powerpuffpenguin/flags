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
