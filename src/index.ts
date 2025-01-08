import { initWasm, Resvg } from "@resvg/resvg-wasm";
// @ts-expect-error no types for wasm file
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm"
import { WorkerEntrypoint } from "cloudflare:workers";
import { customAlphabet } from "nanoid";

const idLength = 8
const lengthLimit = 2_000

let initialized = false
export default {
	async fetch(request, env, ctx): Promise<Response> {
		const { pathname } = new URL(request.url)
		const id = pathname.slice(1)
		if (id.length !== idLength) return new Response("ILLEGAL_ID", {
			status: 400
		})

		const svg = await env.svgs.get(id)

		if (svg === null) {
			return new Response(null, {
				status: 404
			})
		}

		if (svg.length > lengthLimit) {
			return new Response("LENGTH_LIMIT_EXCEEDED", {
				status: 400
			})
		}

		try {
			if (!initialized) {
				await initWasm(resvgWasm)
				initialized = true
			}

			// TODO: fix this it smells bad and probably slows down rendering
			const robotoMediumBuffer = new Uint8Array(await (await fetch("https://fonts.gstatic.com/s/roboto/v32/KFOmCnqEu92Fr1Mu4mxK.woff2")).arrayBuffer())

			const resvg = new Resvg(svg, {
				font: {
					fontBuffers: [
						robotoMediumBuffer
					]
				}
			})

			const img = resvg.render()
			return new Response(img.asPng(), {
				headers: {
					"Content-Type": "image/png"
				}
			})
		} catch (e) {
			console.error(e)
			// its probably an issue with the svg?
			return new Response(null, { status: 400 })
		}
	},
} satisfies ExportedHandler<Wenv>;

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', idLength)

export class StoreSvg extends WorkerEntrypoint<Wenv> {
	async getId(svg: string) {
		if (svg.length > lengthLimit) {
			return "LENGTH_LIMIT_EXCEEDED"
		}

		const id = nanoid(idLength)
		await this.env.svgs.put(id, svg, {
			expirationTtl: 60 * 10
		})
		return id
	}
}
