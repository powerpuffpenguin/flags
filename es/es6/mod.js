export class FlagsException extends Error {
    constructor(message) {
        super(message);
    }
}
const minpad = 8;
const matchUse = new RegExp(/^[a-zA-Z][a-zA-Z0-9\-_\.]*$/u);
const matchFlagShort = new RegExp(/^[a-zA-Z0-9]$/u);
function isShortFlag(v) {
    if (v.length != 1) {
        return false;
    }
    const c = v.codePointAt(0);
    return c !== undefined && c < 128 && c > 0;
}
function compareString(l, r) {
    if (l == r) {
        return 0;
    }
    return l < r ? -1 : 1;
}
/**
 * Represents a command or subcommand
 */
export class Command {
    constructor(opts) {
        this.opts = opts;
        /**
         * parameters not matched
         */
        this.args = new Array();
        if (!matchUse.test(opts.use)) {
            throw new FlagsException(`use invalid: ${opts.use}`);
        }
        const short = opts.short;
        if (short !== undefined && short.indexOf("\n") != -1) {
            throw new FlagsException(`short invalid: ${short}`);
        }
        this.flags_ = Flags.make(this);
    }
    /**
     * Add subcommands to commands
     * @param cmds
     */
    add(...cmds) {
        if (cmds.length == 0) {
            return;
        }
        let children = this.children_;
        if (!children) {
            children = new Map();
            this.children_ = children;
        }
        for (const cmd of cmds) {
            if (cmd.parent_) {
                throw new FlagsException(`command "${cmd.opts.use}" already added to "${cmd.parent_.flags().use}"`);
            }
            const opts = cmd.opts;
            if (opts.prepare) {
                const run = opts.prepare(cmd.flags(), cmd);
                if (run) {
                    opts.run = run;
                }
            }
            const key = opts.use;
            if (children.has(key)) {
                throw new FlagsException(`command "${key}" already exists`);
            }
            else {
                cmd.parent_ = this;
                cmd.flags();
                children.set(key, cmd);
            }
        }
    }
    /**
     * Returns the {@link Flags} associated with the command
     */
    flags() {
        return this.flags_;
    }
    /**
     * @internal
     */
    parse(args, opts) {
        if (opts === undefined) {
            opts = {};
        }
        this._parse(args, 0, args.length, opts);
    }
    _parse(args, start, end, opts) {
        // 重置解析狀態，以免多次解析緩存了上次的解析結果
        this.args.splice(0);
        const flags = this.flags();
        flags.reset();
        if (end - start < 1) {
            const run = this.opts.run;
            if (run) {
                run(this.args, this);
            }
            return;
        }
        // 解析子命令和參數
        const children = this.children_;
        for (let i = start; i < end; i++) {
            const arg = args[i];
            if (arg == "-" || arg == "--") {
                if (opts.unknowFlags) {
                    continue;
                }
                throw new FlagsException(`unknown flag in ${flags.use}: ${arg}`);
            }
            if (arg.startsWith("-")) { // 解析參數
                // 解析內置特定參數
                if (arg == "-h") {
                    this._print();
                    return;
                }
                // 解析用戶定義參數
                const val = i + 1 < end ? args[i + 1] : undefined;
                if (arg.startsWith("--")) {
                    // 解析長參數
                    if (arg == "--help") {
                        const h = this._parseHelp(flags, "--help", val);
                        if (h == -1) {
                            this._print();
                            return;
                        }
                        i += h;
                        continue;
                    }
                    i += this._parseLong(flags, arg.substring(2), val, opts);
                }
                else {
                    // 解析短參數
                    if (arg == "-h") {
                        const h = this._parseHelp(flags, "-h", val);
                        if (h == -1) {
                            this._print();
                            return;
                        }
                        i += h;
                        continue;
                    }
                    const h = this._parseShort(flags, arg.substring(1), val, opts);
                    if (h == -1) { //help
                        this._print();
                        return;
                    }
                    i += h;
                }
            }
            else if (children) { // 解析子命令
                const sub = children.get(arg);
                if (sub) {
                    sub._parse(args, i + 1, end, opts);
                    return;
                }
                else {
                    if (opts.unknowCommand) {
                        return;
                    }
                    throw new FlagsException(`unknow commnad <${arg}>`);
                }
            }
            else { // 沒有子命令才允許傳入 args
                this.args.push(arg);
            }
        }
        const run = this.opts.run;
        if (run) {
            run(this.args, this);
        }
    }
    _throw(flags, flag, arg, val) {
        if (val === undefined && !flag.isBool()) {
            throw new FlagsException(`flag in ${flags.use} needs an argument: ${arg}`);
        }
        if (val === undefined) {
            val = "";
        }
        else {
            val = ` ${val}`;
        }
        throw new FlagsException(`invalid flag value in ${flags.use}: ${arg}${val}`);
    }
    _parseHelp(flags, arg, val) {
        if (val === undefined || val === "true") {
            return -1;
        }
        else if (val === "false") {
            return 1;
        }
        if (val === undefined) {
            throw new FlagsException(`flag in ${flags.use} needs an argument: ${arg}`);
        }
        if (val === undefined) {
            val = "";
        }
        else {
            val = ` ${val}`;
        }
        throw new FlagsException(`invalid flag value in ${flags.use}: ${arg}${val}`);
    }
    _parseShortOne(flags, arg, val, opts) {
        if (arg == "h") {
            return this._parseHelp(flags, `-${arg}`, val);
        }
        const flag = flags.find(arg, true);
        if (!flag) {
            if (opts.unknowFlags) {
                return 1;
            }
            throw new FlagsException(`unknown flag in ${flags.use}: -${arg}`);
        }
        if (flag.isBool()) {
            if (val !== "false" && val !== "true") {
                val = undefined;
            }
        }
        if (flag.add(val)) {
            return val === undefined ? 0 : 1;
        }
        this._throw(flags, flag, `-${arg}`, val);
    }
    _parseShort2(flags, arg, val, opts) {
        if (arg == "h") {
            const v = this._parseHelp(flags, "-h", val);
            return v == -1 ? v : 0;
        }
        const flag = flags.find(arg, true);
        if (!flag) {
            if (opts.unknowFlags) {
                return 0;
            }
            throw new FlagsException(`unknown flag in ${flags.use}: -${arg}`);
        }
        if (flag.add(val)) {
            return 0;
        }
        this._throw(flags, flag, `-${arg}`, val);
    }
    _parseShort(flags, arg, nextVal, opts) {
        switch (arg.length) {
            case 0:
                if (opts.unknowFlags) {
                    return 0;
                }
                throw new FlagsException(`unknown flag in ${flags.use}: -${arg}`);
            case 1:
                return this._parseShortOne(flags, arg, nextVal, opts);
        }
        if (arg[1] == "=") {
            return this._parseShort2(flags, arg[0], arg.substring(2), opts);
        }
        const name = arg[0];
        const flag = flags.find(name, true);
        if (!flag) {
            if (opts.unknowFlags) {
                return 0;
            }
            throw new FlagsException(`unknown flag in ${flags.use}: -${name}`);
        }
        else if (!flag.isBool()) {
            return this._parseShort2(flags, arg[0], arg.substring(1), opts);
        }
        if (flag.add(undefined)) {
            return this._parseShort(flags, arg.substring(1), nextVal, opts);
        }
        throw new FlagsException(`invalid flag value in ${flags.use}: ${name}`);
    }
    _parseLong(flags, arg, val, opts) {
        const found = arg.indexOf("=");
        let name;
        let next = false;
        if (found == -1) {
            name = arg;
            next = true;
        }
        else {
            name = arg.substring(0, found);
            val = arg.substring(found + 1);
        }
        const flag = flags.find(name);
        if (!flag) {
            if (opts.unknowFlags) {
                return next ? 1 : 0;
            }
            throw new FlagsException(`unknown flag in ${flags.use}: --${name}`);
        }
        if (next && flag.isBool()) {
            if (val !== "false" && val !== "true") {
                next = false;
                val = undefined;
            }
        }
        if (flag.add(val)) {
            return next ? 1 : 0;
        }
        this._throw(flags, flag, `--${name}`, val);
    }
    _print() {
        console.log(this.toString());
    }
    /**
     * Get the description string of command usage
     */
    toString() {
        var _a, _b, _c;
        const opts = this.opts;
        const use = this.flags().use;
        const strs = new Array();
        const long = (_a = opts.long) !== null && _a !== void 0 ? _a : "";
        const short = (_b = opts.short) !== null && _b !== void 0 ? _b : "";
        if (long == "") {
            if (short != "") {
                strs.push(short);
            }
        }
        else {
            strs.push(long);
        }
        if (strs.length == 0) {
            strs.push("Usage:");
        }
        else {
            strs.push("\nUsage:");
        }
        strs.push(`  ${use} [flags]`);
        const children = this.children_;
        if (children) {
            strs.push(`  ${use} [command]

Available Commands:`);
            const arrs = new Array();
            let pad = 0;
            for (const v of children.values()) {
                const len = (_c = v.opts.use.length) !== null && _c !== void 0 ? _c : 0;
                if (len > pad) {
                    pad = len;
                }
                arrs.push(v);
            }
            pad += 3;
            if (pad < minpad) {
                pad = minpad;
            }
            arrs.sort((l, r) => compareString(l.opts.use, r.opts.use));
            for (const child of arrs) {
                const opts = child.opts;
                strs.push(`  ${opts.use.padEnd(pad)}${opts.short}`);
            }
        }
        const flags = this.flags();
        let sp = 1;
        let lp = 4;
        for (const f of flags) {
            if (sp < f.short.length) {
                sp = f.short.length;
            }
            if (lp < f.name.length) {
                lp = f.name.length;
            }
        }
        if (lp < minpad) {
            lp = minpad;
        }
        strs.push(`\nFlags:
  -${"h".padEnd(sp)}, --${"help".padEnd(lp)}   help for ${opts.use}`);
        for (const f of flags) {
            let s = "";
            let str = f.defaultString();
            if (str != "") {
                s += " " + str;
            }
            str = f.valuesString();
            if (str != "") {
                s += " " + str;
            }
            if (f.short == "") {
                strs.push(`   ${"".padEnd(sp)}  --${f.name.toString().padEnd(lp)}   ${f.usage}${s}`);
            }
            else {
                strs.push(`  -${f.short.toString().padEnd(sp)}, --${f.name.toString().padEnd(lp)}   ${f.usage}${s}`);
            }
        }
        if (children) {
            strs.push(`\nUse "${use} [command] --help" for more information about a command.`);
        }
        return strs.join("\n");
    }
    /**
     * Use console.log output usage
     */
    print() {
        console.log(this.toString());
    }
    /**
     * return parent command
     */
    parent() {
        return this.parent_;
    }
}
/**
 * Flags definition and parse
 */
export class Flags {
    /**
    * @internal
    */
    static make(cmd) {
        return new Flags(cmd);
    }
    constructor(cmd) {
        this.cmd = cmd;
    }
    /**
     * @internal
     */
    get use() {
        const cmd = this.cmd;
        let parent = cmd.parent();
        let use = cmd.opts.use;
        while (parent) {
            use = `${parent.opts.use} ${use}`;
            parent = parent.parent();
        }
        return use;
    }
    /**
     * @internal
     */
    find(name, short = false) {
        var _a, _b;
        return short ? (_a = this.short_) === null || _a === void 0 ? void 0 : _a.get(name) : (_b = this.long_) === null || _b === void 0 ? void 0 : _b.get(name);
    }
    _getArrs() {
        const keys = this.long_;
        if (!keys) {
            return;
        }
        let arrs = this.arrs_;
        if (!arrs || arrs.length != keys.size) {
            arrs = [];
            for (const f of keys.values()) {
                arrs.push(f);
            }
            arrs.sort((l, r) => compareString(l.name, r.name));
        }
        return arrs;
    }
    /**
     * @internal
     */
    iterator() {
        const arrs = this._getArrs();
        let i = 0;
        return {
            next() {
                if (arrs && i < arrs.length) {
                    return { value: arrs[i++] };
                }
                return { done: true };
            },
        };
    }
    /**
     * @internal
     */
    [Symbol.iterator]() {
        return this.iterator();
    }
    /**
     * @internal
     */
    reset() {
        var _a;
        (_a = this.long_) === null || _a === void 0 ? void 0 : _a.forEach((f) => {
            f.reset();
        });
    }
    /**
     * Define flags
     */
    add(...flags) {
        if (flags.length == 0) {
            return;
        }
        let kl = this.long_;
        if (!kl) {
            kl = new Map();
            this.long_ = kl;
        }
        let ks = this.short_;
        if (!ks) {
            ks = new Map();
            this.short_ = ks;
        }
        for (const f of flags) {
            const name = f.name;
            if (kl.has(name)) {
                throw new FlagsException(`${this.use} flag redefined: ${name}`);
            }
            const short = f.short;
            if (short !== "") {
                const found = ks.get(short);
                if (found) {
                    throw new FlagsException(`unable to redefine '${short}' shorthand in "${this.use}" flagset: it's already used for "${found.name}" flag`);
                }
                if (!isShortFlag(short)) {
                    throw new FlagsException(`"${short}" shorthand in "${this.use} is more than one ASCII character`);
                }
                ks.set(short, f);
            }
            kl.set(name, f);
        }
    }
    /**
     * Define a flag of type string
     */
    string(opts) {
        const f = new FlagString(opts);
        this.add(f);
        return f;
    }
    /**
     * Define a flag of type Array<string>
     */
    strings(opts) {
        const f = new FlagStrings(opts);
        this.add(f);
        return f;
    }
    /**
     * Define a flag of type number
     */
    number(opts) {
        const f = new FlagNumber(opts);
        this.add(f);
        return f;
    }
    /**
     * Define a flag of type Array<number>
     */
    numbers(opts) {
        const f = new FlagNumbers(opts);
        this.add(f);
        return f;
    }
    /**
     * Define a flag of type bigint
     */
    bigint(opts) {
        const f = new FlagBigint(opts);
        this.add(f);
        return f;
    }
    /**
     * Define a flag of type Array<bigint>
     */
    bigints(opts) {
        const f = new FlagBigints(opts);
        this.add(f);
        return f;
    }
    /**
     * Define a flag of type boolean
     */
    bool(opts) {
        const f = new FlagBoolean(opts);
        this.add(f);
        return f;
    }
    /**
     * Define a flag of type Array<boolean>
     */
    bools(opts) {
        const f = new FlagBooleans(opts);
        this.add(f);
        return f;
    }
}
/**
 * A base class provides some common methods for the class flag
 */
export class FlagBase {
    get value() {
        return this.value_;
    }
    constructor(opts) {
        this.opts = opts;
        if (opts.short !== undefined &&
            opts.short !== "" &&
            !matchFlagShort.test(opts.short)) {
            throw new FlagsException(`"${opts.short}" shorthand should match "^[a-zA-Z0-9]$"`);
        }
        if (!matchUse.test(opts.name)) {
            throw new FlagsException(`"${opts.name}" flag should match "^[a-zA-Z][a-zA-Z0-9\\-_\\.]*$"`);
        }
        if (opts.usage !== undefined && opts.usage.indexOf("\n") != -1) {
            throw new FlagsException(`flag usage invalid: ${opts.usage}`);
        }
        if (Array.isArray(opts.default)) {
            const a = Array.from(opts.default);
            this.value_ = a;
        }
        else {
            this.value_ = opts.default;
        }
    }
    get short() {
        var _a;
        return (_a = this.opts.short) !== null && _a !== void 0 ? _a : "";
    }
    get name() {
        return this.opts.name;
    }
    get default() {
        return this.opts.default;
    }
    get usage() {
        var _a;
        return (_a = this.opts.usage) !== null && _a !== void 0 ? _a : "";
    }
    get values() {
        return this.opts.values;
    }
    isValid(v) {
        if (typeof v === "number") {
            if (!isFinite(v)) {
                return false;
            }
        }
        if (Array.isArray(v)) {
            for (const i of v) {
                if (!isFinite(i)) {
                    return false;
                }
            }
        }
        const opts = this.opts;
        const values = opts.values;
        if (values && values.length != 0) {
            for (const val of values) {
                if (this._equal(v, val)) {
                    return true;
                }
            }
            const f = opts.isValid;
            if (f) {
                return f(v);
            }
            return false;
        }
        const f = opts.isValid;
        if (f) {
            return f(v);
        }
        return true;
    }
    _equal(l, r) {
        if (Array.isArray(l) && Array.isArray(r)) {
            if (l.length != r.length) {
                return false;
            }
            for (let i = 0; i < l.length; i++) {
                if (l[i] !== r[i]) {
                    return false;
                }
            }
        }
        return l === r;
    }
    reset() {
        const def = this.opts.default;
        if (Array.isArray(def)) {
            const arrs = this.value_;
            if (Array.isArray(arrs)) {
                arrs.splice(0);
                arrs.push(...def);
                return;
            }
        }
        this.value_ = this.opts.default;
    }
    defaultString() {
        const val = this.opts.default;
        if (Array.isArray(val)) {
            if (val.length != 0) {
                return `(default ${JSON.stringify(val)})`;
            }
        }
        else if (typeof val === "string") {
            if (val != "") {
                return (`(default ${JSON.stringify(val)})`);
            }
        }
        else if (typeof val === "boolean") {
            if (val) {
                return (`(default ${val})`);
            }
        }
        else if (typeof val === "number") {
            if (val != 0) {
                return (`(default ${val})`);
            }
        }
        else if (typeof val === "bigint") {
            if (val != BigInt(0)) {
                return (`(default ${val})`);
            }
        }
        return "";
    }
    valuesString() {
        const vals = this.opts.values;
        if (vals && vals.length != 0) {
            return `(values ${JSON.stringify(vals)})`;
        }
        return "";
    }
    add(_) {
        return false;
    }
    isBool() {
        return false;
    }
}
function formatFlagOptions(opts, def) {
    if (opts.default !== undefined) {
        return opts;
    }
    return {
        name: opts.name,
        default: def,
        short: opts.short,
        usage: opts.usage,
        values: opts.values,
        isValid: opts.isValid,
    };
}
/**
 * A flag of type string
 */
export class FlagString extends FlagBase {
    constructor(opts) {
        super(formatFlagOptions(opts, ""));
    }
    /**
     * @override
     */
    add(v) {
        if (v === undefined || !this.isValid(v)) {
            return false;
        }
        this.value_ = v;
        return true;
    }
}
/**
 * A flag of type Array<string>
 */
export class FlagStrings extends FlagBase {
    constructor(opts) {
        super(formatFlagOptions(opts, []));
    }
    /**
     * @override
     */
    add(v) {
        if (v === undefined || !this.isValid([v])) {
            return false;
        }
        this.value_.push(v);
        return true;
    }
}
/**
 * A flag of type number
 */
export class FlagNumber extends FlagBase {
    constructor(opts) {
        super(formatFlagOptions(opts, 0));
    }
    /**
     * @override
     */
    add(v) {
        if (v === undefined) {
            return false;
        }
        const i = parseInt(v);
        if (!this.isValid(i)) {
            return false;
        }
        this.value_ = i;
        return true;
    }
}
/**
 * A flag of type Array<number>
 */
export class FlagNumbers extends FlagBase {
    constructor(opts) {
        super(formatFlagOptions(opts, []));
    }
    /**
     * @override
     */
    add(v) {
        if (v === undefined) {
            return false;
        }
        const i = parseInt(v);
        if (!this.isValid([i])) {
            return false;
        }
        this.value_.push(i);
        return true;
    }
}
/**
 * A flag of type bigint
 */
export class FlagBigint extends FlagBase {
    constructor(opts) {
        super(formatFlagOptions(opts, BigInt(0)));
    }
    /**
     * @override
     */
    add(v) {
        if (v === undefined) {
            return false;
        }
        try {
            const i = BigInt(v);
            if (!this.isValid(i)) {
                return false;
            }
            this.value_ = i;
            return true;
        }
        catch (_) {
            return false;
        }
    }
}
/**
 * A flag of type Array<bigint>
 */
export class FlagBigints extends FlagBase {
    constructor(opts) {
        super(formatFlagOptions(opts, []));
    }
    /**
     * @override
     */
    add(v) {
        if (v === undefined) {
            return false;
        }
        try {
            const i = BigInt(v);
            if (!this.isValid([i])) {
                return false;
            }
            this.value_.push(i);
            return true;
        }
        catch (_) {
            return false;
        }
    }
}
function parseBool(v) {
    if (v === undefined) {
        return true;
    }
    else if (v === "true") {
        return true;
    }
    else if (v === "false") {
        return false;
    }
    return undefined;
}
/**
 * A flag of type boolean
 */
export class FlagBoolean extends FlagBase {
    constructor(opts) {
        super(formatFlagOptions(opts, false));
    }
    /**
     * @override
     */
    isBool() {
        return true;
    }
    /**
     * @override
     */
    add(v) {
        const val = parseBool(v);
        if (val === undefined || !this.isValid(val)) {
            return false;
        }
        this.value_ = val;
        return true;
    }
}
/**
 * A flag of type Array<boolean>
 */
export class FlagBooleans extends FlagBase {
    constructor(opts) {
        super(formatFlagOptions(opts, []));
    }
    /**
     * @override
     */
    isBool() {
        return true;
    }
    /**
     * @override
     */
    add(v) {
        const val = parseBool(v);
        if (val === undefined || !this.isValid([val])) {
            return false;
        }
        this.value_.push(val);
        return true;
    }
}
/**
 * command parser
 */
export class Parser {
    constructor(root) {
        this.root = root;
        const opts = root.opts;
        const prepare = opts.prepare;
        if (prepare) {
            const run = prepare(root.flags(), root);
            if (run) {
                opts.run = run;
            }
        }
    }
    /**
     * Parses command line arguments and invokes a handler callback for a matching command or its subcommands
     * @param args command line parameters
     * @param opts some optional behavior definitions
     *
     * @throws {@link FlagsException}
     *
     * @example deno
     * ```
     * new Parser(root).parse(Deno.args)
     * ```
     *
     * @example nodejs
     * ```
     * new Parser(root).parse(process.argv.splice(2))
     * ```
     */
    parse(args, opts) {
        this.root.parse(args, opts);
    }
}
//# sourceMappingURL=mod.js.map