
/* send data to the server */
let address = "192.168.1.3"
export async function send(payload,method,resource){
	if(payload == null && method === "POST") return;
	let req = 0;
	if(method === "POST"){
		console.log(`POST REQUEST with body: ${payload}`)
		req = new Request(`https://${address}/${resource}`,{
			headers:{ 
				"Content-Type": "application/json",
			},
			method: method,
			body: payload
		});
	}

	if(method === "GET"){
		req = new Request(`https://${address}/${resource}`,{
			method: method,
		});
	}

	try{
		let response = await fetch(req);
		if(!response.ok){
			return {		
				message: "error",
				desc:"request failed, please contat your admin"
			};
		}

		let data = await response.json();
		if(Object.hasOwn(data,"message")){
			return {
				message: data.message
			};	
		}else{
			return {
				message: data
			};	

		}
	} catch(err){
		return {
			success: false,
			message: `error: ${err.message}`,
			data: null
		};
	}
}

export default send;
