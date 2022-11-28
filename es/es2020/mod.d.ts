export declare class FlagsException extends Error {
    constructor(message: string);
}
/**
 * Command definition options
 */
export interface CommandOptions {
    /**
     * Command name
     * @remarks
     * The name must match the regular expression /^[a-zA-Z][a-zA-Z0-9\-_\.]*$/u, as you can see some special symbols are not allowed this is intentional, Because I think using strange special symbols as command names will give users a very bad experience
     *
     */
    readonly use: string;
    /**
     * Short description of the command
     * @remarks
     * Line breaks are not allowed, because they will be displayed when listing subcommands. If there is a line break, it may disrupt the typesetting of the description information
     */
    readonly short?: string;
    /**
     * Detailed description of the command
     *
     * @remarks
     * Here you can write detailed usage instructions including some usage examples
     */
    readonly long?: string;
    /**
     * Called when the user specifies to execute this command/subcommand
     */
    run?: (args: Array<string>, cmd: Command) => void;
    /**
     * If you want to define flags for a command, you should not specify the 'run' attribute but the 'prepare' attribute
     * @remarks
     * The passed 'flgas' is an example of the {@link Flags} that are associated with this command to specify flags for the command
     *
     * If the callback function specified by prepare returns non-undefined, its return value will override the 'run' attribute, and if it returns undefined, it will not affect the run attribute
     */
    readonly prepare?: (flags: Flags, cmd: Command) => undefined | ((args: Array<string>, cmd: Command) => void);
}
export interface ParserOptions {
    /**
     * Whether to allow undefined flags
     * @defaultValue false
     */
    unknowFlags?: boolean;
    /**
     * Whether to allow undefined subcommands
     *  @defaultValue false
     */
    unknowCommand?: boolean;
}
/**
 * Represents a command or subcommand
 */
export declare class Command {
    readonly opts: CommandOptions;
    private parent_?;
    private children_?;
    private flags_;
    /**
     * parameters not matched
     */
    readonly args: string[];
    constructor(opts: CommandOptions);
    /**
     * Add subcommands to commands
     * @param cmds
     */
    add(...cmds: Array<Command>): void;
    /**
     * Returns the {@link Flags} associated with the command
     */
    flags(): Flags;
    private _parse;
    private _throw;
    private _parseHelp;
    private _parseShortOne;
    private _parseShort2;
    private _parseShort;
    private _parseLong;
    private _print;
    /**
     * Get the description string of command usage
     */
    toString(): string;
    /**
     * Use console.log output usage
     */
    print(): void;
    /**
     * return parent command
     */
    parent(): Command | undefined;
}
/**
 * Flags definition and parse
 */
export declare class Flags implements Iterable<FlagDefine<any>> {
    private cmd;
    private constructor();
    private short_?;
    private long_?;
    private arrs_?;
    private _getArrs;
    /**
     * Define flags
     */
    add(...flags: Array<FlagDefine<any>>): void;
    /**
     * Define a flag of type string
     */
    string(opts: FlagOptionsLike<string>): FlagString;
    /**
     * Define a flag of type Array<string>
     */
    strings(opts: FlagOptionsLike<Array<string>>): FlagStrings;
    /**
     * Define a flag of type number
     */
    number(opts: FlagOptionsLike<number>): FlagNumber;
    /**
     * Define a flag of type Array<number>
     */
    numbers(opts: FlagOptionsLike<Array<number>>): FlagNumbers;
    /**
     * Define a flag of type bigint
     */
    bigint(opts: FlagOptionsLike<bigint>): FlagBigint;
    /**
     * Define a flag of type Array<bigint>
     */
    bigints(opts: FlagOptionsLike<Array<bigint>>): FlagBigints;
    /**
     * Define a flag of type boolean
     */
    bool(opts: FlagOptionsLike<boolean>): FlagBoolean;
    /**
     * Define a flag of type Array<boolean>
     */
    bools(opts: FlagOptionsLike<Array<boolean>>): FlagBooleans;
}
export interface FlagOptionsLike<T> {
    /**
     * flag long name
     * @remarks
     * The name must match the regular expression /^[a-zA-Z][a-zA-Z0-9\-_\.]*$/u, as you can see some special symbols are not allowed this is intentional, Because I think using strange special symbols as flags names will give users a very bad experience
     */
    readonly name: string;
    /**
     * Default value when no flag is specified
     */
    readonly default?: T;
    /**
     * Optional flag short name
     * @remarks
     * The short name must match the regular expression /^[a-zA-Z0-9]$/u, as you can see symbols are not allowed this is intentional, Because I think using symbols as flags short names will give users a very bad experience
     */
    readonly short?: string;
    /**
     * Optional flag usage description
     */
    readonly usage?: string;
    /**
     * An optional list of valid values for the flag
     * @remarks
     * If isValid is set at the same time, isValid will be called for verification when the values do not match, and if the values match, the value will be considered valid and will not call isValid
     */
    readonly values?: Array<T>;
    /**
     * Optional parameter validation function
     * @remarks
     * If values is set at the same time, isValid will be called for verification when the values do not match, and if the values match, the value will be considered valid and will not call isValid
     */
    readonly isValid?: (v: T) => boolean;
}
export interface FlagOptions<T> {
    /**
     * flag long name
     */
    readonly name: string;
    /**
     * Default value when no flag is specified
     */
    readonly default: T;
    /**
     * Optional flag short name
     */
    readonly short?: string;
    /**
     * Optional flag usage description
     */
    readonly usage?: string;
    /**
     * An optional list of valid values for the flag
     * @remarks
     * If isValid is set at the same time, isValid will be called for verification when the values do not match, and if the values match, the value will be considered valid and will not call isValid
     */
    readonly values?: Array<T>;
    /**
     * Optional parameter validation function
     * @remarks
     * If values is set at the same time, isValid will be called for verification when the values do not match, and if the values match, the value will be considered valid and will not call isValid
     */
    readonly isValid?: (v: T) => boolean;
}
export interface FlagDefine<T> {
    readonly name: string;
    readonly default: T;
    readonly short: string;
    readonly usage: string;
    readonly values?: Array<T>;
    isValid: (v: T) => boolean;
    /**
     * set value to default value
     */
    reset(): void;
    /**
     * The value parsed by this flag
     */
    readonly value: T;
    /**
     * Returns a string description of the default value
     */
    defaultString(): string;
    /**
     * Returns a string description of the list of valid values
     */
    valuesString(): string;
    /**
     * Parsed to this flag
     * @param val The parsed command line value
     */
    add(val?: string): boolean;
    /**
     * Returns whether it is a bool flag
     */
    isBool(): boolean;
}
/**
 * A base class provides some common methods for the class flag
 */
export declare class FlagBase<T> implements FlagDefine<T> {
    readonly opts: FlagOptions<T>;
    protected value_: T;
    get value(): T;
    constructor(opts: FlagOptions<T>);
    get short(): string;
    get name(): string;
    get default(): T;
    get usage(): string;
    get values(): Array<T> | undefined;
    isValid(v: T): boolean;
    private _equal;
    reset(): void;
    defaultString(): string;
    valuesString(): string;
    add(_?: string): boolean;
    isBool(): boolean;
}
/**
 * A flag of type string
 */
export declare class FlagString extends FlagBase<string> {
    constructor(opts: FlagOptionsLike<string>);
    /**
     * @override
     */
    add(v?: string): boolean;
}
/**
 * A flag of type Array<string>
 */
export declare class FlagStrings extends FlagBase<Array<string>> {
    constructor(opts: FlagOptionsLike<Array<string>>);
    /**
     * @override
     */
    add(v?: string): boolean;
}
/**
 * A flag of type number
 */
export declare class FlagNumber extends FlagBase<number> {
    constructor(opts: FlagOptionsLike<number>);
    /**
     * @override
     */
    add(v?: string): boolean;
}
/**
 * A flag of type Array<number>
 */
export declare class FlagNumbers extends FlagBase<Array<number>> {
    constructor(opts: FlagOptionsLike<Array<number>>);
    /**
     * @override
     */
    add(v?: string): boolean;
}
/**
 * A flag of type bigint
 */
export declare class FlagBigint extends FlagBase<bigint> {
    constructor(opts: FlagOptionsLike<bigint>);
    /**
     * @override
     */
    add(v?: string): boolean;
}
/**
 * A flag of type Array<bigint>
 */
export declare class FlagBigints extends FlagBase<Array<bigint>> {
    constructor(opts: FlagOptionsLike<Array<bigint>>);
    /**
     * @override
     */
    add(v?: string): boolean;
}
/**
 * A flag of type boolean
 */
export declare class FlagBoolean extends FlagBase<boolean> {
    constructor(opts: FlagOptionsLike<boolean>);
    /**
     * @override
     */
    isBool(): boolean;
    /**
     * @override
     */
    add(v?: string): boolean;
}
/**
 * A flag of type Array<boolean>
 */
export declare class FlagBooleans extends FlagBase<Array<boolean>> {
    constructor(opts: FlagOptionsLike<Array<boolean>>);
    /**
     * @override
     */
    isBool(): boolean;
    /**
     * @override
     */
    add(v?: string): boolean;
}
/**
 * command parser
 */
export declare class Parser {
    readonly root: Command;
    constructor(root: Command);
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
    parse(args: Array<string>, opts?: ParserOptions): void;
}
