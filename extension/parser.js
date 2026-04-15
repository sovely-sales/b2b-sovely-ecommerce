async function fetchShipments(orderNumbers) {

    const result = {};

    const pages = [...document.querySelectorAll(".pagination a")]
        .map(a => parseInt(a.textContent))
        .filter(n => !isNaN(n));

    const lastPage = Math.max(...pages);

    const base = location.origin + "/dropshiper/allOrders?page=";

    for (let page = 1; page <= lastPage; page++) {

        const res = await fetch(base + page, { credentials: "include" });
        const html = await res.text();

        const doc = new DOMParser().parseFromString(html, "text/html");

        doc.querySelectorAll("table tbody tr").forEach(row => {

            const td = row.querySelectorAll("td");
            const orderId = td[0]?.innerText.trim();

            if (!orderNumbers.includes(orderId)) return;

            const shipmentText = td[7]?.innerText.trim() || "";
            const lines = shipmentText.split("\n").map(l => l.trim()).filter(Boolean);

            let courier = "";
            let tracking = "";

            if (lines.length >= 2) {
                courier = lines[0];
                tracking = lines[1];
            } else if (lines.length === 1) {
                const match = lines[0].match(/^([A-Za-z\s]+?)\s+(\S+)$/);
                if (match) {
                    courier = match[1].trim();
                    tracking = match[2].trim();
                } else {
                    courier = lines[0];
                }
            }

            result[orderId] = { courier, tracking };

        });

    }

    return result;
}