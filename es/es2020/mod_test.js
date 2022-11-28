import { Parser, Command } from './mod';
function createRoot(assert, vals) {
    return new Command({
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
QUnit.test('command', async (assert) => {
    let vals = [5, true, true];
    new Parser(createRoot(assert, vals)).parse(["-vn", "5"]);
    new Parser(createRoot(assert, vals)).parse(["-vn=5"]);
    new Parser(createRoot(assert, vals)).parse(["-vn5"]);
    vals = [6, false, false];
    new Parser(createRoot(assert, vals)).parse(["--number", "6", "-d", "false"]);
    new Parser(createRoot(assert, vals)).parse(["--number", "6", "-d=false"]);
});
//# sourceMappingURL=mod_test.js.map