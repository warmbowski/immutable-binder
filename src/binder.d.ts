export interface ObjectMap<T> {
    [key: string]: T | undefined;
}

export type Binder<T, MODE=binderMode.DefaultMode> = binderInternals.InternalBaseBinder<T, MODE> & binderInternals.InternalBinder<T, MODE>;
export type PBinder<T, MODE=binderMode.PreInitializedMode> = Binder<T, MODE>;
export type PFBinder<T, MODE=binderMode.PreInitializedAndIncludeFunctionsMode> = Binder<T, MODE>;
export type FBinder<T, MODE=binderMode.IncludeFunctionsMode> = Binder<T, MODE>;

export declare function createBinder<T>(value: T, update?: binderUtils.UpdateBinder<T, binderMode.DefaultMode>, initialize?: binderUtils.InitializeValueBinder<binderMode.DefaultMode>): Binder<T, binderMode.DefaultMode>;
export declare function createBinderIncludingFunctions<T>(value: T, update?: binderUtils.UpdateBinder<T, binderMode.IncludeFunctionsMode>, initialize?: binderUtils.InitializeValueBinder<binderMode.IncludeFunctionsMode>): Binder<T, binderMode.IncludeFunctionsMode>;
export declare function createPreInitializedBinder<T>(value: T, update?: binderUtils.UpdateBinder<T, binderMode.PreInitializedMode>, initialize?: binderUtils.InitializeValueBinder<binderMode.PreInitializedMode>): Binder<T, binderMode.PreInitializedMode>;
export declare function createPreInitializedBinderIncludingFunctions<T>(value: T, update?: binderUtils.UpdateBinder<T, binderMode.PreInitializedAndIncludeFunctionsMode>, initialize?: binderUtils.InitializeValueBinder<binderMode.PreInitializedAndIncludeFunctionsMode>): Binder<T, binderMode.PreInitializedAndIncludeFunctionsMode>;

export declare function withBinderMode<MODE>(): binderUtils.BinderCreator<MODE>;
export declare function withSameBinderMode<MODE>(otherBinder: Binder<any, MODE>): binderUtils.BinderCreator<MODE>;

export declare function isBinder<T, Q = any, MODE = binderMode.DefaultMode>(maybeBinder: T | Binder<Q, MODE>): maybeBinder is Binder<Q, MODE>;

export declare function deriveBinderFrom<SOURCE, DERIVED, MODE_SOURCE, MODE_TARGET>(
    sourceBinder: Binder<SOURCE, MODE_SOURCE>,
    createDerivedBinder: (sourceBinder: Binder<SOURCE, MODE_SOURCE>) => Binder<DERIVED, MODE_TARGET>,
    setSourceValue: (sourceBinder: Binder<SOURCE, MODE_SOURCE>, newDerivedBinder: Binder<DERIVED, MODE_TARGET>) => Binder<SOURCE, MODE_SOURCE>,
    derivationName: string
): Binder<DERIVED, MODE_TARGET>;

export declare function notBinder<MODE>(source: Binder<boolean, MODE>): Binder<boolean, MODE>;
export declare var inheritedExtras: string[];

/* Compatibility definitions */
export type ArrayBinder<T, MODE=binderMode.DefaultMode> = Binder<T[], MODE>;
export type ObjectBinder<T/* extends object *//*commented for compatibity reason*/, MODE=binderMode.DefaultMode> = Binder<T, MODE>;
export type MapBinder<T, MODE=binderMode.DefaultMode> = Binder<ObjectMap<T>, MODE>;

export declare module binderMode {
    export type DefaultMode = '' & 'Default';
    export type PreInitializedMode = DefaultMode & 'PreInitialized';
    export type IncludeFunctionsMode = DefaultMode & 'IncludeFunctions';
    export type PreInitializedAndIncludeFunctionsMode = PreInitializedMode & IncludeFunctionsMode;
}

/*
 * Utils types, It is not the intention that you have have your own variables explicitly typed with this types
 * This definitions can appear in the public interfaces
 */
declare module binderUtils {
    type UpdateBinder<T, MODE> = (newRootBinder: Binder<T, MODE>, newBinder: Binder<any, MODE>, oldBinder: Binder<any, MODE>) => void;
    type InitializeValueBinder<MODE> = (newValue: any, oldBinder: Binder<any, MODE>) => any;

    interface DerivedBinderFrom {
        sourceBinder: Binder<any, any>
        createDerivedBinder: (sourceBinder: Binder<any, any>) => Binder<any, any>
        setSourceValue: (sourceBinder: Binder<any, any>, newDerivedBinder: Binder<any, any>) => Binder<any, any>
        derivationName: string
    }

    interface BinderCreator<MODE> {
        createBinder<T>(value: T, update?: UpdateBinder<T, MODE>, initialize?: InitializeValueBinder<MODE>): Binder<T, MODE>
    }

    type AbstractBinder<T, MODE=binderMode.DefaultMode> = binderInternals.InternalBaseBinder<T, MODE> & binderInternals.InternalAbstractBinder<T, MODE>;
    type AnyObjectBinder<MODE=binderMode.DefaultMode> = binderInternals.InternalBaseBinder<any, MODE> & binderInternals.InternalAnyObjectBinder<MODE>;
}

/*
 * Internal types, these types are not for depend directly in the code
 */
declare module binderInternals {
    type KeyOfExcludingFuntions<T> = ({ [K in keyof T]-?: T[K] extends Function ? never : K })[keyof T];

    /*
     * Join of the type of the diffent propesties in the object
     */
    type ValuesTypes<T, KEYS extends keyof T> = ({ [K in keyof T]: T[K]})[KEYS];

    /*
     * MandatoryProperties retunrs never and OptionalProperties returns all properties 
     * when strictNullCheck is not enabled  
     */
    type ObjectKeysAux<T, KEYS extends keyof T> = ({ [K in KEYS]: T[K] extends never ? never : K });
    type MandatoryPropertiesAux<T, KEYS extends keyof T> = ({ [K in KEYS]-?: VarianceIn<T[K]> extends VarianceIn<undefined> ? never : K })[KEYS];
    type OptionalPropertiesAux<T, KEYS extends keyof T> = ({ [K in KEYS]-?: VarianceIn<T[K]> extends VarianceIn<undefined> ? K : never })[KEYS];
    type MandatoryProperties<T, KEYS extends keyof T> = MandatoryPropertiesAux<ObjectKeysAux<T, KEYS>, KEYS>;
    type OptionalProperties<T, KEYS extends keyof T> = OptionalPropertiesAux<ObjectKeysAux<T, KEYS>, KEYS>;

    type VarianceInOut<T> = { _variance_in_out(arg: T): T };
    type VarianceIn<T> = { _variance_in(arg: T): void };
    type VarianceOut<T> = { _variance_out(): T };

    type RequiredType<T> = T extends null | undefined ? never : T;

    type TypeWhenAny<T, Twhen, Telse> = VarianceInOut<T> extends VarianceInOut<'__binder_any_type__'> ? Twhen : Telse;
    type TypeWhenArray<T, Twhen, Telse> = VarianceInOut<T> extends VarianceInOut<Array<infer Q>> ? Twhen : Telse;

    class InternalBaseBinder<T, MODE> {
        private _mode : MODE;
        private _value : T;

        // Cast functions
        // This methos must be keeped in this class instead of be placed in InternalAbstractBinder to allow 
        // asign to binderUtils.AnyObjectBinder, Binder<any[]> and Binder<ObjectMap<any>> from the no any version
        isObjectBinder<Q extends T>(): this is TypeWhenAny<T, binderUtils.AnyObjectBinder<MODE>, Binder<TypeWhenAny<T, undefined, Q>, MODE>>;
        isMapBinder<Q extends T>(): this is TypeWhenAny<T, Binder<ObjectMap<any>, MODE>, Binder<Q, MODE>>;
        isArrayBinder<Q extends T>(): this is TypeWhenAny<T, Binder<any[], MODE>, Binder<Q, MODE>>;
    }

    /*
     * Due to the bug
     * https://github.com/Microsoft/TypeScript/issues/21592
     * tha causes 'Excessive stack depth comparing types' error,
     * there are some restrictions:
     * - In the type Binder<SomeType[][]> it is not posible to use use the
     *   indexer syntax to access to the indices in the firt array, it returns an 
     *   abstract binder instead of the proper binder type, you must
     *   use the get method instead.
     * - There is a different type between the object of a concrete type and
     *   the any type.
     * - The concat method in the binder of an array receive ValueBinder instead
     *   Binder
     * - All methods that receives o returns a binder uses a generic argument Q
     *   (and sometimes QR) even when in the code looks that make no sense
     */

    interface InternalAbstractBinder<T, MODE> {
        getValue(): T;
        setValue(value: T, force?: boolean): this;

        toString(): string;
        toLocaleString(locales?: string | string[], options?: any): string;

        // Additional information
        getExtras(): any;
        getParent(): Binder<any, MODE> | null;
        getKey(): string | number | null;
        isValidBinder(): boolean;
        getDerivedFrom(): binderUtils.DerivedBinderFrom | null;

        // advanced updates
        updateExtras(newTemporalExtras?: { [key: string]: any }, newPermanentExtras?: { [key: string]: any }, force?: boolean): this;
        setValueAndUpdateExtras(value: T, newTemporalExtras?: { [key: string]: any }, newPermanentExtras?: { [key: string]: any }, force?: boolean): this;
        updateExtrasInCurrentBinder(newTemporalExtras?: { [key: string]: any }, newPermanentExtras?: { [key: string]: any }): void;

        // Cast functions
        /*keeped for compatibility reasons*/ _<Q extends T>(): Binder<Q, MODE>;

        hasValue<Q extends T>(): this is Binder<binderInternals.RequiredType<Q>, MODE>;

        // Binder type information
        isValueBinder<Q extends T>(): this is Binder<Q, MODE>;
    }

    interface InternalValueBinder<T, MODE> extends InternalAbstractBinder<T, MODE> {
    }

    interface InternalMapBinder<T, MODE> extends InternalAbstractBinder<ObjectMap<T>, MODE> {
        size: number;

        get<Q extends T>(key: string): Binder<Q, MODE> | undefined;
        set<Q extends T>(key: string, value: Q): this;

        clear(): this;
        delete(key: string): this;
        has(key: string): boolean;

        forEach<Q extends T>(callbackfn: (value: Binder<Q, MODE>, key: string, mapBinder: this) => void): void;
    }

    interface InternalAnyMapBinder<MODE> extends InternalAbstractBinder<ObjectMap<any>, MODE> {
        size: number;

        get(key: string): Binder<any, MODE> | undefined;
        set(key: string, value: any): this;

        clear(): this;
        delete(key: string): this;
        has(key: string): boolean;

        forEach(callbackfn: (value: Binder<any, MODE>, key: string, mapBinder: this) => void): void;
    }

    interface InternalArrayBinder<T, MODE> extends InternalAbstractBinder<T[], MODE> {
        length: number;
        //readonly [index: number]: Binder<T, MODE>; // Not suported due the mentioned bug
        readonly [index: number]: TypeWhenArray<T, binderUtils.AbstractBinder<T>, Binder<TypeWhenArray<T, undefined, T>, MODE>>;

        get<Q extends T>(index: number): Binder<Q, MODE>;
        set<Q extends T>(index: number, value: Q): this;

        // Basic array mutator
        splice(start: number, deleteCount?: number): this;
        splice(start: number, deleteCount: number, ...items: T[]): this;

        // Array mutator
        pop(): this;
        push(...items: T[]): this;
        shift(): this;
        unshift(...items: T[]): this;

        // Extra mutator
        insertAt(index: number, value: T): this;
        removeAt(index: number, deleteCount?: number): this;

        // Other methods
        concat<Q extends T, QR extends T>(...items: (binderUtils.AbstractBinder<Q[], MODE> | binderUtils.AbstractBinder<Q, MODE> | binderUtils.AbstractBinder<Q, MODE>[] | ReadonlyArray<binderUtils.AbstractBinder<Q, MODE>>)[]): Binder<QR, MODE>[];
        join(separator?: string): string;
        slice<Q extends T>(start?: number, end?: number): Binder<Q, MODE>[];

        // Search in an Array
        includes(searchElement: T, fromIndex?: number): boolean;
        includes<Q extends T>(searchElement: Binder<Q, MODE>, fromIndex?: number): boolean;
        indexOf(searchElement: T, fromIndex?: number): number;
        indexOf<Q extends T>(searchElement: Binder<Q, MODE>, fromIndex?: number): number;
        lastIndexOf(searchElement: T, fromIndex?: number): number;
        lastIndexOf<Q extends T>(searchElement: Binder<Q, MODE>, fromIndex?: number): number;

        // Iterator
        forEach<Q extends T>(callbackfn: (value: Binder<Q, MODE>, index: number, arrayBinder: this) => void): void;
        every<Q extends T>(callbackfn: (value: Binder<Q, MODE>, index: number, arrayBinder: this) => boolean): boolean;
        some<Q extends T>(callbackfn: (value: Binder<Q, MODE>, index: number, arrayBinder: this) => boolean): boolean;
        map<U, Q extends T>(callbackfn: (value: Binder<Q, MODE>, index: number, arrayBinder: this) => U): U[];
        filter<Q extends T>(callbackfn: (value: Binder<Q, MODE>, index: number, arrayBinder: this) => boolean): Binder<Q, MODE>[];
        find<Q extends T>(predicate: (value: Binder<Q, MODE>, index: number, arrayBinder: this) => boolean): Binder<Q, MODE> | undefined;
        findIndex<Q extends T>(predicate: (value: Binder<Q, MODE>, index: number, arrayBinder: this) => boolean): number;
        reduce<Q extends T>(predicate: (previousValue: Binder<Q, MODE>, currentValue: Binder<Q, MODE>, currentIndex: number, arrayBinder: this) => Binder<Q, MODE>, initialValue?: Binder<Q, MODE>): Binder<Q, MODE>;
        reduce<U, Q extends T>(predicate: (previousValue: U, currentValue: Binder<Q, MODE>, currentIndex: number, arrayBinder: this) => U, initialValue: U): U;
        reduceRight<Q extends T>(predicate: (previousValue: Binder<Q, MODE>, currentValue: Binder<Q, MODE>, currentIndex: number, arrayBinder: this) => Binder<Q, MODE>, initialValue?: Binder<Q, MODE>): Binder<Q, MODE>;
        reduceRight<U, Q extends T>(predicate: (previousValue: U, currentValue: Binder<Q, MODE>, currentIndex: number, arrayBinder: this) => U, initialValue: U): U;
    }

    interface InternalAnyArrayBinder<MODE> extends InternalAbstractBinder<any[], MODE> {
        length: number;
        readonly [index: number]: Binder<any, MODE>;

        get(index: number): Binder<any, MODE>;
        set(index: number, value: any): this;

        // Basic array mutator
        splice(start: number, deleteCount?: number): this;
        splice(start: number, deleteCount: number, ...items: any[]): this;

        // Array mutator
        pop(): this;
        push(...items: any[]): this;
        shift(): this;
        unshift(...items: any[]): this;

        // Extra mutator
        insertAt(index: number, value: any): this;
        removeAt(index: number, deleteCount?: number): this;

        // Other methods
        concat(...items: (binderUtils.AbstractBinder<any[], MODE> | binderUtils.AbstractBinder<any, MODE> | binderUtils.AbstractBinder<any, MODE>[] | ReadonlyArray<binderUtils.AbstractBinder<any, MODE>>)[]): Binder<any, MODE>[];
        join(separator?: string): string;
        slice(start?: number, end?: number): Binder<any, MODE>[];

        // Search in an Array
        includes(searchElement: any, fromIndex?: number): boolean;
        includes(searchElement: Binder<any, MODE>, fromIndex?: number): boolean;
        indexOf(searchElement: any, fromIndex?: number): number;
        indexOf(searchElement: Binder<any, MODE>, fromIndex?: number): number;
        lastIndexOf(searchElement: any, fromIndex?: number): number;
        lastIndexOf(searchElement: Binder<any, MODE>, fromIndex?: number): number;

        // Iterator
        forEach(callbackfn: (value: Binder<any, MODE>, index: number, arrayBinder: this) => void): void;
        every(callbackfn: (value: Binder<any, MODE>, index: number, arrayBinder: this) => boolean): boolean;
        some(callbackfn: (value: Binder<any, MODE>, index: number, arrayBinder: this) => boolean): boolean;
        map<U>(callbackfn: (value: Binder<any, MODE>, index: number, arrayBinder: this) => U): U[];
        filter(callbackfn: (value: Binder<any, MODE>, index: number, arrayBinder: this) => boolean): Binder<any, MODE>[];
        find(predicate: (value: Binder<any, MODE>, index: number, arrayBinder: this) => boolean): Binder<any, MODE> | undefined;
        findIndex(predicate: (value: Binder<any, MODE>, index: number, arrayBinder: this) => boolean): number;
        reduce(predicate: (previousValue: Binder<any, MODE>, currentValue: Binder<any, MODE>, currentIndex: number, arrayBinder: this) => Binder<any, MODE>, initialValue?: Binder<any, MODE>): Binder<any, MODE>;
        reduce<U>(predicate: (previousValue: U, currentValue: Binder<any, MODE>, currentIndex: number, arrayBinder: this) => U, initialValue: U): U;
        reduceRight(predicate: (previousValue: Binder<any, MODE>, currentValue: Binder<any, MODE>, currentIndex: number, arrayBinder: this) => Binder<any, MODE>, initialValue?: Binder<any, MODE>): Binder<any, MODE>;
        reduceRight<U>(predicate: (previousValue: U, currentValue: Binder<any, MODE>, currentIndex: number, arrayBinder: this) => U, initialValue: U): U;
    }

    interface InternalObjectBinder<T, MANDATORYKEYS extends keyof T, KEYS extends keyof T, MODE> extends InternalAbstractBinder<T, MODE> {
        get<KEY extends MANDATORYKEYS, Q extends T[KEY]>(key: KEY): Binder<Q, MODE>;
        get<KEY extends KEYS, Q extends T[KEY]>(key: KEY): Binder<Q, MODE> | undefined;
        set<KEY extends KEYS>(key: KEY, value: T[KEY]): this;

        delete(key: OptionalProperties<T, KEYS>): this;
        has(key: KEYS): boolean;

        // forEach(callbackfn: (value: Binder<T, MODE>, key: KEYS, objectBinder: this) => void): void; // it can't be because it doesn't allows the mode overload
        forEach<Q extends T>(callbackfn: (value: Binder<ValuesTypes<Q, KEYS>, MODE>, key: keyof T, objectBinder: this) => void): void;
    }

    interface InternalAnyObjectBinder<MODE> extends InternalAbstractBinder<any, MODE> {
        get(key: string): Binder<any, MODE> | undefined;
        set(key: string, value: any): this;

        delete(key: any): this;
        has(key: any): boolean;

        // forEach(callbackfn: (value: Binder<T, MODE>, key: KEYS, objectBinder: this) => void): void; // it can't be because it doesn't allows the mode overload
        forEach(callbackfn: (value: Binder<any, MODE>, key: string, objectBinder: this) => void): void;
    }

    /*
     * Binder object with optional keys as optionals
     */
    type InternalObjectBinderOptionalKeys<T, KEYS extends keyof T, MODE> = {
        readonly [K in KEYS]/*-?*/: Binder<T[K], MODE>;
        /*
         * Optional properties are not marked as required because the binder create the property
         * binder if the entry exists in the object
         */
    }

    /*
     * Binder object with optional keys as optionals
     */
    type InternalObjectBinderAllKeys<T, KEYS extends keyof T, MODE> = {
        readonly [K in KEYS]-?: Binder<T[K], MODE>;
        /*
         * Optional properties are marked as required; the value must be preinitialized
         */
    }

    type AllowNullOrUndefined<T> = VarianceIn<String> extends VarianceIn<null> ? 'no' /*strictNullCheckDisabled*/
        : null extends T ? 'yes' : undefined extends T ? 'yes' : 'no';

    type InternalBinder<T, MODE> =
        VarianceInOut<T> extends VarianceInOut<'__binder_any_type__'> ? InternalValueBinder<any, MODE> :
        'yes' extends AllowNullOrUndefined<T> ? InternalValueBinder<T, MODE> :
        VarianceInOut<T> extends VarianceInOut<Function> ? InternalValueBinder<T, MODE> :
        VarianceInOut<T> extends VarianceInOut<true | false> ? InternalValueBinder<boolean, MODE> :
        VarianceInOut<T> extends VarianceInOut<boolean> ? InternalValueBinder<boolean, MODE> :
        VarianceInOut<T> extends VarianceInOut<Boolean> ? InternalValueBinder<Boolean, MODE> :
        VarianceInOut<T> extends VarianceInOut<number> ? InternalValueBinder<number, MODE> :
        VarianceInOut<T> extends VarianceInOut<Number> ? InternalValueBinder<Number, MODE> :
        VarianceInOut<T> extends VarianceInOut<string> ? InternalValueBinder<string, MODE> :
        VarianceInOut<T> extends VarianceInOut<String> ? InternalValueBinder<String, MODE> :
        VarianceInOut<T> extends VarianceInOut<Date> ? InternalValueBinder<Date, MODE> :
        VarianceInOut<T> extends VarianceInOut<Array<infer Q>> ? (
            VarianceInOut<Q> extends VarianceInOut<'__binder_any_type__'> ? InternalAnyArrayBinder<MODE> : InternalArrayBinder<Q, MODE>
        ) :
        VarianceInOut<T> extends VarianceInOut<ObjectMap<infer Q>> ? (
            VarianceInOut<Q> extends VarianceInOut<'__binder_any_type__'> ? InternalAnyMapBinder<MODE> : InternalMapBinder<Q, MODE>
        ) :
        VarianceOut<T> extends VarianceOut<object> ? (
            VarianceInOut<T> extends VarianceInOut<'__binder_any_type__'> ? InternalAnyObjectBinder<MODE> :
            VarianceInOut<{}> extends VarianceInOut<T> ? InternalValueBinder<T, MODE> :
            VarianceInOut<MODE> extends VarianceInOut<'__binder_any_option__'> ?
                /*ObjectBinder of any mode*/ InternalObjectBinder<T, MandatoryProperties<T, KeyOfExcludingFuntions<T>>, KeyOfExcludingFuntions<T>, MODE> & InternalObjectBinderOptionalKeys<T, KeyOfExcludingFuntions<T>, MODE> :
            VarianceOut<MODE> extends VarianceOut<'PreInitialized'> ?
            (VarianceOut<MODE> extends VarianceOut<'IncludeFunctions'> ?
                /*PFObjectBinder*/ InternalObjectBinder<T, keyof T, keyof T, MODE> & InternalObjectBinderAllKeys<T, keyof T, MODE> :
                /*PObjectBinder*/ InternalObjectBinder<T, keyof T, KeyOfExcludingFuntions<T>, MODE> & InternalObjectBinderAllKeys<T, KeyOfExcludingFuntions<T>, MODE>
            ) :
            (VarianceOut<MODE> extends VarianceOut<'IncludeFunctions'> ?
                /*FObjectBinder*/ InternalObjectBinder<T, MandatoryProperties<T, keyof T>, keyof T, MODE> & InternalObjectBinderOptionalKeys<T, keyof T, MODE> :
                /*ObjectBinder*/ InternalObjectBinder<T, MandatoryProperties<T, KeyOfExcludingFuntions<T>>, KeyOfExcludingFuntions<T>, MODE> & InternalObjectBinderOptionalKeys<T, KeyOfExcludingFuntions<T>, MODE>
            )
        ) :
        InternalValueBinder<T, MODE>;
}
