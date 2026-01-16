let logs = [];

module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method === "GET") {
        return res.json(logs.slice(-100));
    }

    return res.status(405).json({ error: "Method not allowed" });
};
