import { customAlphabet } from "nanoid";

const idLength = 8
const lengthLimit = 2_000

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', idLength)


const post = async (svg: string, env: Wenv) => {
	if (svg.length > lengthLimit) {
		return new Response("LENGTH_LIMIT_EXCEEDED", {
			status: 400
		})
	}

	const id = nanoid(idLength)
	await env.svgs.put(id, svg, {
		expirationTtl: 60 * 10
	})

	return new Response(id)
}


const get = (id: string, env: Wenv) => {

	return new Response()
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		if (request.method === "POST") {
			
			return post(await request.text(), env)
		}
		const { pathname } = new URL(request.url)
		const id = pathname.slice(1)
		return get(id);
	},
} satisfies ExportedHandler<Wenv>;
