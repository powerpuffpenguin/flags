"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mod_1 = require("./mod");
function createRoot(assert, vals) {
    return new mod_1.Command({
        use: "main",
        prepare: (flags) => {
            const n = flags.number({
                name: "number",
                default: 0,
                short: "n",
            });
            const v = flags.bool({
                name: "version",
                default: false,
                short: "v",
            });
            const d = flags.bool({
                name: "date",
                default: true,
                short: "d",
            });
            return () => {
                assert.equal(n.value, vals[0]);
                assert.equal(v.value, vals[1]);
                assert.equal(d.value, vals[2]);
            };
        },
    });
}
QUnit.test('command', (assert) => __awaiter(void 0, void 0, void 0, function* () {
    let vals = [5, true, true];
    new mod_1.Parser(createRoot(assert, vals)).parse(["-vn", "5"]);
    new mod_1.Parser(createRoot(assert, vals)).parse(["-vn=5"]);
    new mod_1.Parser(createRoot(assert, vals)).parse(["-vn5"]);
    vals = [6, false, false];
    new mod_1.Parser(createRoot(assert, vals)).parse(["--number", "6", "-d", "false"]);
    new mod_1.Parser(createRoot(assert, vals)).parse(["--number", "6", "-d=false"]);
}));
//# sourceMappingURL=mod_test.js.map