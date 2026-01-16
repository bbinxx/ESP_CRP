let ledState = "off";
let logs = [];

exports.handler = async (event) => {
    // CORS headers
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
    };

    // Handle preflight
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers, body: "" };
    }

    const path = event.path.replace("/.netlify/functions/api", "");

    // POST /set
    if (path === "/set" && event.httpMethod === "POST") {
        const { state } = JSON.parse(event.body);
        const prevState = ledState;
        ledState = state;

        if (prevState !== ledState) {
            addLog("WEB", `LED changed: ${prevState} → ${ledState}`);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ ok: true, state: ledState })
        };
    }

    // GET /get
    if (path === "/get" && event.httpMethod === "GET") {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ led: ledState })
        };
    }

    // POST /log
    if (path === "/log" && event.httpMethod === "POST") {
        const { msg } = JSON.parse(event.body);
        addLog("ESP", msg);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ ok: true })
        };
    }

    // GET /logs
    if (path === "/logs" && event.httpMethod === "GET") {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(logs.slice(-100))
        };
    }

    return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Not found" })
    };
};

function addLog(source, msg) {
    const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
    const entry = {
        time: timestamp,
        source,
        msg,
        id: Date.now()
    };

    logs.push(entry);
    if (logs.length > 500) logs.shift();

    console.log(`[${timestamp}] ${source}: ${msg}`);
}
