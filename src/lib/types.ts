import * as Arr from "effect/Array"
import { identity } from "effect/Function"
import * as AST from "effect/SchemaAST"

/**
 * Adopted from [type-fest](https://github.com/sindresorhus/type-fest/tree/main) PartialDeep.
 */
export type DeepPartial<T> = T extends
	| null
	| undefined
	| string
	| number
	| boolean
	| symbol
	| bigint
	// biome-ignore lint/suspicious/noConfusingVoidType: the type is unfortunately required here
	| void
	| Date
	| RegExp
	| ((...arguments_: any[]) => unknown)
	| (new (
			...arguments_: any[]
	  ) => unknown)
	? T
	: T extends Map<infer KeyType, infer ValueType>
		? PartialMap<KeyType, ValueType>
		: T extends Set<infer ItemType>
			? PartialSet<ItemType>
			: T extends ReadonlyMap<infer KeyType, infer ValueType>
				? PartialReadonlyMap<KeyType, ValueType>
				: T extends ReadonlySet<infer ItemType>
					? PartialReadonlySet<ItemType>
					: T extends object
						? T extends ReadonlyArray<infer ItemType> // Test for arrays/tuples, per https://github.com/microsoft/TypeScript/issues/35156
							? ItemType[] extends T // Test for arrays (non-tuples) specifically
								? readonly ItemType[] extends T // Differentiate readonly and mutable arrays
									? ReadonlyArray<DeepPartial<ItemType | undefined>>
									: Array<DeepPartial<ItemType | undefined>>
								: PartialObject<T> // Tuples behave properly
							: PartialObject<T>
						: unknown

type PartialMap<KeyType, ValueType> = {} & Map<DeepPartial<KeyType>, DeepPartial<ValueType>>

type PartialSet<T> = {} & Set<DeepPartial<T>>

type PartialReadonlyMap<KeyType, ValueType> = {} & ReadonlyMap<
	DeepPartial<KeyType>,
	DeepPartial<ValueType>
>

type PartialReadonlySet<T> = {} & ReadonlySet<DeepPartial<T>>

type PartialObject<ObjectType extends object> = {
	[KeyType in keyof ObjectType]?: DeepPartial<ObjectType[KeyType]>
}

export const orUndefined = (ast: AST.AST): AST.AST => AST.Union.make([ast, AST.undefinedKeyword])

const isRenamingPropertySignatureTransformation = (t: AST.PropertySignatureTransformation) =>
	t.decode === identity && t.encode === identity

const getRestASTs = (rest: ReadonlyArray<AST.Type>): ReadonlyArray<AST.AST> =>
	rest.map((annotatedAST) => annotatedAST.type)

export const deepPartial = (ast: AST.AST, options?: { readonly exact: true }): AST.AST => {
	const exact = options?.exact === true
	switch (ast._tag) {
		case "TupleType":
			return new AST.TupleType(
				ast.elements.map((e) => new AST.OptionalType(exact ? e.type : orUndefined(e.type), true)),
				Arr.match(ast.rest, {
					onEmpty: () => ast.rest,
					onNonEmpty: (rest) => [
						new AST.Type(AST.Union.make([...getRestASTs(rest), AST.undefinedKeyword])),
					],
				}),
				ast.isReadonly,
			)
		case "TypeLiteral":
			return new AST.TypeLiteral(
				ast.propertySignatures.map(
					(ps) =>
						new AST.PropertySignature(
							ps.name,
							exact ? ps.type : orUndefined(ps.type),
							true,
							ps.isReadonly,
							ps.annotations,
						),
				),
				ast.indexSignatures.map(
					(is) => new AST.IndexSignature(is.parameter, orUndefined(is.type), is.isReadonly),
				),
			)
		case "Union":
			return AST.Union.make(ast.types.map((member) => deepPartial(member, options)))
		case "Suspend":
			return new AST.Suspend(() => deepPartial(ast.f(), options))
		case "Declaration":
		case "Refinement":
			throw new Error(`Unsupported AST passed to deepPartial: ${ast._tag}`)
		case "Transformation": {
			if (
				AST.isTypeLiteralTransformation(ast.transformation) &&
				ast.transformation.propertySignatureTransformations.every(
					isRenamingPropertySignatureTransformation,
				)
			) {
				return new AST.Transformation(
					deepPartial(ast.from, options),
					deepPartial(ast.to, options),
					ast.transformation,
				)
			}
			throw new Error(`Unsupported schema passed to deepPartial: ${ast._tag}`)
		}
	}
	return ast
}
