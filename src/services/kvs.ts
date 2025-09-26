import { SystemError } from "@effect/platform/Error"
import * as KeyValueStore from "@effect/platform/KeyValueStore"
import type * as Config from "effect/Config"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"

const make = Effect.fn(function* (storeId: string) {
	const { getStore } = yield* Effect.promise(() => import("@netlify/blobs"))
	const store = getStore({ name: storeId, consistency: "strong" })
	return KeyValueStore.makeStringOnly({
		get: (key) =>
			Effect.tryPromise({
				try: () => store.get(key),
				catch: (cause) =>
					new SystemError({
						module: "KeyValueStore",
						method: "get",
						reason: "Unknown",
						pathOrDescriptor: key,
						cause,
					}),
			}).pipe(Effect.map(Option.fromNullable)),
		set: (key, value) =>
			Effect.tryPromise({
				try: () => store.set(key, value),
				catch: (cause) =>
					new SystemError({
						module: "KeyValueStore",
						method: "set",
						reason: "Unknown",
						pathOrDescriptor: key,
						cause,
					}),
			}).pipe(Effect.asVoid),
		remove: (key) =>
			Effect.tryPromise({
				try: () => store.delete(key),
				catch: (cause) =>
					new SystemError({
						module: "KeyValueStore",
						method: "remove",
						reason: "Unknown",
						pathOrDescriptor: key,
						cause,
					}),
			}).pipe(Effect.asVoid),
		clear: Effect.void,
		size: Effect.tryPromise({
			try: () => store.list({ directories: false, paginate: false }),
			catch: (cause) =>
				new SystemError({
					module: "KeyValueStore",
					method: "size",
					reason: "Unknown",
					pathOrDescriptor: "",
					cause,
				}),
		}).pipe(Effect.map((results) => results.blobs.length)),
	})
})

export const NetlifyKVS = (storeId: string) =>
	Layer.effect(KeyValueStore.KeyValueStore, make(storeId))

export const NetlifyOrFileSystemKVS = Effect.fnUntraced(function* (storeId: Config.Config<string>) {
	const store = yield* storeId
	if (process.env.NODE_ENV === "development") {
		return KeyValueStore.layerFileSystem(store)
	}
	return NetlifyKVS(store)
}, Layer.unwrapEffect)
