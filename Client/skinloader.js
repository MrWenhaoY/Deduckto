class SkinLoader {
    constructor(name) {
        const data = SKINS[name];
        if (!data) throw new Error("Cannot load skin: " + name);

        if (data.type === "text") {
            this.parse = data.parse;
        } else if (data.type === "image") {
            this.parse = (card) => {
                let html = "<div class='card-container'>";
                [0, 1, 2].forEach(i => {
                    html += "<img class='card-img' src='Assets/";
                    html += data["cat"+i+"_root"] + data["cat"+i+"_parse"](card[i]) + "' ";
                    html += "alt='" + data["cat"+i+"_names"][card[i]] + "' />"
                })
                html += "</div>";
                return html;
            }
        }
    }
}