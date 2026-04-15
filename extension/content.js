(function () {

    const btn = document.createElement("button");

    btn.innerText = "Augment Orders CSV";

    btn.style.position = "fixed";
    btn.style.top = "20px";
    btn.style.right = "20px";
    btn.style.zIndex = "9999";
    btn.style.padding = "12px 20px";
    btn.style.background = "#16a34a";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.borderRadius = "6px";

    btn.onclick = () => {

        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".csv";

        input.onchange = () => {

            const file = input.files[0];

            const reader = new FileReader();

            reader.onload = async () => {

                const csv = reader.result;

                await processCSV(csv);

            };

            reader.readAsText(file);

        };

        input.click();
    };

    document.body.appendChild(btn);

})();