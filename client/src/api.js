async function json(res) {
    const contentType = res.headers.get('content-type')
    return (!contentType || !contentType.toLowerCase().includes('application/json'))
        ? Promise.resolve({})
        : res.json();
}

async function request(method, url, body) {
    return fetch(url, {
        method,
        body: JSON.stringify(body),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).catch(e => {
        console.log(`Failed to send ${method} ${url}: ${e.message}`)
        return Promise.reject(e)
    }).then(res => {
        if (!res.ok) {
            return json(res)
                .then(e => {
                    const message = e.description || '(no message)'
                    console.log(`Received ${res.status} from ${method} ${url}: ${message}`)
                    return new Error(message)
                })
                .catch(e => {
                    const message = res.statusText || e.message || '(no message)'
                    console.log(`Received ${res.status} from ${method} ${url}: ${message}`)
                    return new Error(message)
                })
                .then(e => Promise.reject(e))
        }

        return json(res).catch((e) => {
            console.log(`Failed to parse response from ${method} ${url}: ${e.message}`)
            return Promise.reject(new Error('Unexpected response'))
        })
    })
}

export function post(path, body) {
    request('POST', path, body)
}