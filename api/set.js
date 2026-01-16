let ledState = "off";
let logs = [];

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method === "POST") {
        const { state } = req.body;
        const prevState = ledState;
        ledState = state;

        if (prevState !== ledState) {
            addLog("WEB", `LED changed: ${prevState} → ${ledState}`);
        }

        return res.json({ ok: true, state: ledState });
    }

    return res.status(405).json({ error: "Method not allowed" });
};

function addLog(source, msg) {
    const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
    logs.push({ time: timestamp, source, msg, id: Date.now() });
    if (logs.length > 500) logs.shift();
    console.log(`[${timestamp}] ${source}: ${msg}`);
}
