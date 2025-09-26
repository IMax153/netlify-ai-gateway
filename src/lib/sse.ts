import * as Sse from "@effect/experimental/Sse"
import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import type { ParseError } from "effect/ParseResult"
import * as Schema from "effect/Schema"
import * as Stream from "effect/Stream"

/**
 * A stream representing the final message in a stream of server sent events.
 */
const SseDoneStream = Stream.make(
	Sse.encoder.write({
		_tag: "Event",
		id: undefined,
		event: "message",
		data: "[DONE]",
	}),
)

/**
 * Converts a stream of values of type `A` to a byte stream of encoded server
 * sent events.
 *
 * The encoding pipeline contains the following steps:
 *   1. Values are serialized to JSON using the provided `schema`
 *   2. A server sent event `"message"` is created and serialized to a string
 *   3. A server sent event `"message"` is created with the payload `"[DONE]"`,
 *      serialized to a string, and concatenated to the end of the stream
 *   4. The entire stream is serialized to bytes suitable for wire transfer
 */
export const toServerSentEventStream: {
	<A, I, R2>(
		schema: Schema.Schema<A, I, R2>,
	): <E, R>(self: Stream.Stream<A, E, R>) => Stream.Stream<Uint8Array, E | ParseError, R | R2>
	<A, E, R, I, R2>(
		self: Stream.Stream<A, E, R>,
		schema: Schema.Schema<A, I, R2>,
	): Stream.Stream<Uint8Array, E | ParseError, R | R2>
} = dual(
	2,
	<A, E, R, I, R2>(
		self: Stream.Stream<A, E, R>,
		schema: Schema.Schema<A, I, R2>,
	): Stream.Stream<Uint8Array, E | ParseError, R | R2> => {
		const encode = Schema.encode(Schema.parseJson(schema))
		return self.pipe(
			Stream.mapEffect((value) =>
				Effect.map(encode(value), (data) =>
					Sse.encoder.write({
						_tag: "Event",
						id: undefined,
						event: "message",
						data,
					}),
				),
			),
			Stream.concat(SseDoneStream),
			Stream.encodeText,
		)
	},
)
