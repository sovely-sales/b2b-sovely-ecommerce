async function processCSV(csvText) {

    const rows = parseCSV(csvText);

    const headerIndex = rows.findIndex(row =>
        row.some(col => col.replace(/"/g, '').trim() === "Wukusy Order No")
    );

    if (headerIndex === -1) {
        alert("Could not find 'Wukusy Order No' column in CSV.");
        return;
    }

    const header = rows[headerIndex];
    const dataRows = rows.slice(headerIndex + 1);

    const orderIndex = header.findIndex(col =>
        col.replace(/"/g, '').trim() === "Wukusy Order No"
    );

    
    if (!header.includes("Courier")) header.push("Courier");
    if (!header.includes("Tracking")) header.push("Tracking");

    
    const orderNumbers = dataRows
        .map(r => r[orderIndex])
        .filter(Boolean);

    const orderSet = new Set(orderNumbers);

    console.log("Orders to match:", orderSet.size);

    const shipments = await fetchShipments(orderSet);

    console.log("Shipments found:", Object.keys(shipments).length);

    
    dataRows.forEach(row => {

        const orderNo = row[orderIndex];

        const shipment = shipments[orderNo] || {};

        row.push(shipment.courier || "");
        row.push(shipment.tracking || "");

    });

    const finalCSV = buildCSV([header, ...dataRows]);

    downloadCSVText(finalCSV);
}


async function fetchShipments(orderSet) {

    const result = {};

    const pages = [...document.querySelectorAll(".pagination a")]
        .map(a => parseInt(a.textContent))
        .filter(n => !isNaN(n));

    const lastPage = Math.max(...pages, 1);

    console.log("Scanning pages:", lastPage);

    const base = location.origin + "/dropshiper/allOrders?page=";

    const remaining = new Set(orderSet);

    for (let page = 1; page <= lastPage; page++) {

        if (remaining.size === 0) {
            console.log("All shipments found, stopping early.");
            break;
        }

        console.log("Fetching page", page);

        const res = await fetch(base + page, {
            credentials: "include"
        });

        const html = await res.text();

        const doc = new DOMParser()
            .parseFromString(html, "text/html");

        doc.querySelectorAll("table tbody tr").forEach(row => {

            const td = row.querySelectorAll("td");

            const orderId = td[0]?.innerText.trim();

            if (!remaining.has(orderId)) return;

            const shipmentText = td[7]?.innerText.trim() || "";
            const lines = shipmentText.split("\n").map(l => l.trim()).filter(Boolean);

            let courier = "";
            let tracking = "";

            if (lines.length >= 2) {
                // Already on separate lines
                courier = lines[0];
                tracking = lines[1];
            } else if (lines.length === 1) {
                
                // Super aggressive regex:
                // Matches ANY letters/spaces/hyphens up until the VERY FIRST digit.
                // Group 1: Courier (e.g., "DTDC", "BlueDart")
                
                const match = lines[0].match(/^([A-Za-z\s\-]+)(\d.*)$/);
                
                if (match) {
                    courier = match[1].trim();
                    tracking = match[2].trim();
                } else {
                    
                    courier = lines[0];
                }
            }

            result[orderId] = { courier, tracking };

            remaining.delete(orderId);

        });

    }

    return result;
}


function parseCSV(text) {

    const rows = [];
    let row = [];
    let field = "";
    let i = 0;
    let insideQuotes = false;

    while (i < text.length) {

        const char = text[i];

        if (insideQuotes) {

            if (char === '"') {

                // escaped quote
                if (text[i + 1] === '"') {
                    field += '"';
                    i += 2;
                    continue;
                }

                insideQuotes = false;
                i++;
                continue;
            }

            field += char;
            i++;
            continue;
        }

        if (char === '"') {
            insideQuotes = true;
            i++;
            continue;
        }

        if (char === ',') {
            row.push(field);
            field = "";
            i++;
            continue;
        }

        if (char === '\n') {
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
            i++;
            continue;
        }

        if (char === '\r') {
            i++;
            continue;
        }

        field += char;
        i++;
    }

    row.push(field);
    rows.push(row);

    return rows;
}


function buildCSV(rows) {

    return rows.map(row => {

        return row.map(field => {

            if (field === undefined) return "";

            field = field.toString();
            if (!field.startsWith("=")) {
                field = field.replace(/^"+|"+$/g, "");
            }

            if (field.includes(",") || field.includes("\n") || field.includes('"')) {
                field = '"' + field.replace(/"/g, '""') + '"';
            }

            return field;

        }).join(",");

    }).join("\n");
}

function downloadCSVText(csv) {

    const blob = new Blob([csv], { type: "text/csv" });

    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = "wukusy_orders_augmented.csv";

    document.body.appendChild(a);
    a.click();
    a.remove();

    console.log("CSV download complete");
}