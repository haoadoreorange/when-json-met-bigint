# when-json-met-bigint

[![Build Status](https://app.travis-ci.com/haoadoresorange/when-json-met-bigint.svg?branch=main)](https://app.travis-ci.com/haoadoresorange/when-json-met-bigint)

[![NPM](https://nodei.co/npm/when-json-met-bigint.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/when-json-met-bigint/)

This is a fork of [json-bigint](https://github.com/sidorares/json-bigint), rewritten in TypeScript, no longer use `bignumber.js`, and being actively maintained.

==========

`JSON.parse/stringify` with `BigInt` support. Based on Douglas Crockford [JSON.js](https://github.com/douglascrockford/JSON-js) and [json-bigint](https://github.com/sidorares/json-bigint).

While most JSON parsers assume numeric values have same precision restrictions as IEEE 754 double, JSON specification _does not_ say anything about number precision. Any floating point number in decimal (optionally scientific) notation is valid JSON value. 

It's a good idea to serialize values which might fall out of IEEE 754 integer precision as strings in your JSON api, but `{ "value" : 9223372036854775807}`, for example, is still a valid RFC4627 JSON string, and in most JS runtimes the result of `JSON.parse` is this object: `{ value: 9223372036854776000 }`

==========

example:

```js
var JSONB = require('when-json-met-bigint');

var json = '{ "value" : 9223372036854775807, "v2": 123 }';
console.log('Input:', json);
console.log('');

console.log('node.js built-in JSON:');
var r = JSON.parse(json);
console.log('JSON.parse(input).value : ', r.value.toString());
console.log('JSON.stringify(JSON.parse(input)):', JSON.stringify(r));

console.log('\n\nbig number JSON:');
var r1 = JSONB.parse(json);
console.log('JSONB.parse(input).value : ', r1.value.toString());
console.log('JSONB.stringify(JSONB.parse(input)):', JSONB.stringify(r1));
```

Output:

```
Input: { "value" : 9223372036854775807, "v2": 123 }

node.js built-in JSON:
JSON.parse(input).value :  9223372036854776000
JSON.stringify(JSON.parse(input)): {"value":9223372036854776000,"v2":123}


big number JSON:
JSONB.parse(input).value :  9223372036854775807
JSONB.stringify(JSONB.parse(input)): {"value":9223372036854775807,"v2":123}
```

### JSONB.parse(text[, reviver[, schema]])

`JSONB.parse` support a 3rd option, which is a schema-like object. This is an ad-hoc solution for the limitation `o !== JSONB.parse(JSONB.stringify(o))`

This limitation exists because JS treats `BigInt` and `Number` as 2 separate types which cannot be cooerced. The parser choses an appropriate type based on the size of the number in JSON string. This introduces 2 problems:
- As stated above, `JSONB.parse(JSONB.stringify(123n))` returns `123` because the number is small enough
- The type of one field is not consistent, for example one API can return a response in which a field can sometimes be `BigInt` and other times be `Number`

There's the option to parse all `Number` as `BigInt` but IMHO this isn't much desirable. Libraries solved (2) by iterating the parsed result and enforce the type as you can see [here](https://github.com/theia-ide/tsp-typescript-client/pull/37). That PR has an interesting approach which this solution is inspired from.

In order to overcome the limitation, we need an API for users to decide per case & per field whether it should be `BigInt` or `Number`. This API is exposed through a schema-like object. Its type is defined as following;

```typescript
type NumberOrBigInt = `number` | `bigint`;
type Schema = NumberOrBigInt | ((n: number | bigint) => NumberOrBigInt) | { [key: string]: Schema } | Schema[] | null;
```

To put it simple, the schema-like argument is an object with fields and sub-fields being the fields and sub-fields of the expected parsed object, following the same structure, for which users want to specify whether to force it as `BigInt` or `Number`.

Those fields can take 3 different values, a string 'number' or 'bigint' meaning it will be parsed as `Number` or `BigInt`, respectively. The 3rd possible value is a callback function `(n: number | bigint) => 'number' | 'bigint'`, with `n` being either `number` or `bigint` as being parsed by default depending on the size. Users for example can use this callback to `throw Error` in case the type is not what they're expecting.

For `Array` in the schema-like object, a single item array is treated as `T[]`, that is the item will be the schema for all items in the parsed array. An array with multiple items in the schema-like object will be used as tuple type, that is each of the item with be the schema for the corresponding index item in the parsed array. If `parsed_array.length > schema_array.length`, the parsed array's items which has no corresponding index in the schema array will be parsed as having no schema.

If a value different from those defined above passed in or returned from the callback, it is as if there is no schema.

example:

```typescript
JSONB.parse(`{"a": {"b": 123} }`, null, { a: { b: `bigint` } }) // returns {a: {b: 123n} }
JSONB.parse(`{"a": {"b": 123} }`, null, {a: {b: (n) => { if (typeof n === `number`) throw new Error(`Expect bigint but found ${n}`); return `bigint` } }})
JSONB.parse(`{"a": [1, 2, 3] }`, null, {a: [`bigint`]}) // returns {a: [1n, 2n, 3n] }
JSONB.parse(`{"a": [1, 2, 3] }`, null, {a: [`bigint`, `bigint`]}) // returns {a: [1n, 2n, 3] }
JSONB.parse(`{"a": [1, 2, 3] }`, null, {a: [`bigint`, null]}) // returns {a: [1n, 2, 3] }
JSONB.parse(`{"a": [1, 2, 3] }`, null, {a: [null, null, `bigint`]}) // returns {a: [1, 2, 3n] }
```

### JSONB.stringify(value[, replacer[, space]])

Full support out-of-the-box, stringifies `BigInt` as pure numbers (no quotes, no `n`)

### Options

By default, `when-json-met-bigint` try its best to be "default JSON API compliant", all custom behaviours are opt-in through options. 

==========

    - options.strict, boolean, default false

Specifies the parsing should be "strict" towards reporting duplicate-keys in the parsed string.
The default follows what is allowed in standard json and resembles the behavior of JSON.parse, but overwrites any previous values with the last one assigned to the duplicate-key.

Setting `options.strict = true` will fail-fast on such duplicate-key occurances and thus warn you upfront of possible lost information.

example:

```js
var JSONB = require('when-json-met-bigint');
var JSONBstrict = require('when-json-met-bigint')({ strict: true });

var dupkeys = '{ "dupkey": "value 1", "dupkey": "value 2"}';
console.log('\n\nDuplicate Key test with both lenient and strict JSON parsing');
console.log('Input:', dupkeys);
var works = JSONB.parse(dupkeys);
console.log('JSON.parse(dupkeys).dupkey: %s', works.dupkey);
var fails = 'will stay like this';
try {
  fails = JSONBstrict.parse(dupkeys);
  console.log('ERROR!! Should never get here');
} catch (e) {
  console.log(
    'Succesfully catched expected exception on duplicate keys: %j',
    e
  );
}
```

Output

```
Duplicate Key test with big number JSON
Input: { "dupkey": "value 1", "dupkey": "value 2"}
JSON.parse(dupkeys).dupkey: value 2
Succesfully catched expected exception on duplicate keys: {"name":"SyntaxError","message":"Duplicate key \"dupkey\"","at":33,"text":"{ \"dupkey\": \"value 1\", \"dupkey\": \"value 2\"}"}

```
==========

    - options.parseBigIntAsString, boolean, default false

Specifies if `BigInt` should be stored in the object as a `string`, rather than the default `BigInt`.

Note that this is a dangerous behavior as it breaks the default functionality of being able to convert back-and-forth without data type changes (as this will convert all BigInts to be-and-stay strings).

example:

```js
var JSONB = require('when-json-met-bigint');
var JSONBstring = require('when-json-met-bigint')({ parseBigIntAsString: true });
var key = '{ "key": 1234567890123456789 }';
console.log('\n\nStoring the BigInt as a string, instead of a BigInt');
console.log('Input:', key);
var withInt = JSONB.parse(key);
var withString = JSONBstring.parse(key);
console.log(
  'Default type: %s, With option type: %s',
  typeof withInt.key,
  typeof withString.key
);
```

Output

```
Storing the BigInt as a string, instead of a BigInt
Input: { "key": 1234567890123456789 }
Default type: object, With option type: string

```
==========

    - options.alwaysParseAsBigInt, boolean, default false

Specifies if all numbers should be stored as BigInt.

Note that this is a dangerous behavior as it breaks the default functionality of being able to convert back-and-forth without data type changes (as this will convert all Number to be-and-stay BigInt)

example:

```js
var JSONB = require('when-json-met-bigint');
var JSONBalways = require('when-json-met-bigint')({ alwaysParseAsBigInt: true });
var key = '{ "key": 123 }'; // there is no need for BigInt by default, but we're forcing it
console.log(`\n\nStoring the Number as a BigInt, instead of a Number`);
console.log('Input:', key);
var normal = JSONB.parse(key);
var always = JSONBalways.parse(key);
console.log(
  'Default type: %s, With option type: %s',
  typeof normal.key,
  typeof always.key
);
```

Output

```
Storing the Number as a BigInt, instead of a Number
Input: { "key": 123 }
Default type: number, With option type: bigint

```
==========

    - options.protoAction, boolean, default: "preserve". Possible values: "error", "ignore", "preserve"
    - options.constructorAction, boolean, default: "preserve". Possible values: "error", "ignore", "preserve"

Controls how `__proto__` and `constructor` properties are treated. If set to "error" they are not allowed and
parse() call will throw an error. If set to "ignore" the prroperty and its value is skipped from parsing and object building.

If set to "preserve" the `__proto__` property is set. However, this **DOES NOT** set the prototype because the base object would be created using `Object.create(null)` and `Object.setPrototypeOf` is called upon later, for this particular case only to prevent prototype poisoning. One still should be extra careful and make sure any other library consuming generated data is not vulnerable to prototype poisoning attacks.

example:

```js
var JSONBalways = require('when-json-met-bigint')({ protoAction: 'ignore' });
const user = JSONB.parse('{ "__proto__": { "admin": true }, "id": 12345 }');
// => result is { id: 12345 }
```

### TODO:

- Align error message with default `JSON`
- Update benchmark
- Add turbo mode

### Links:

- [RFC4627: The application/json Media Type for JavaScript Object Notation (JSON)](http://www.ietf.org/rfc/rfc4627.txt)
- [Re: \[Json\] Limitations on number size?](http://www.ietf.org/mail-archive/web/json/current/msg00297.html)
- [Is there any proper way to parse JSON with large numbers? (long, bigint, int64)](http://stackoverflow.com/questions/18755125/node-js-is-there-any-proper-way-to-parse-json-with-large-numbers-long-bigint)
- [What is JavaScript's Max Int? What's the highest Integer value a Number can go to without losing precision?](http://stackoverflow.com/questions/307179/what-is-javascripts-max-int-whats-the-highest-integer-value-a-number-can-go-t)
- [Large numbers erroneously rounded in Javascript](http://stackoverflow.com/questions/1379934/large-numbers-erroneously-rounded-in-javascript)

### Limitations

- Roundtrip operations

`s === JSONB.stringify(JSONB.parse(s))` but

`o !== JSONB.parse(JSONB.stringify(o))` *solved with schema argument*

when `o` has a value with something like `123n`.

`JSONB` stringify `123n` as `123`, which becomes `number` (aka `123` not `123n`) by default when being reparsed.

If the schema is not provided, then there is currently no other consistent way to deal with this issue.

### Benchmark

`JSONB.stringify` vs `JSON.stringify` + regex to produce big number in JSON string

***
 100 iterations average exec time stringify o1 (small array contains BigInt): JSON = 0.9074120484187915 x JSONB 
***

***
 100 iterations average exec time stringify o2 (big array no BigInt): JSON = 1.268180788421609 x JSONB 
***

***
 100 iterations average exec time stringify o3 (big array contains BigInt): JSON = 0.958589841158739 x JSONB 
***