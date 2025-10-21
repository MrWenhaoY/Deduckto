class SkinLoader {
    constructor(name, N) {
        this.data = SKINS[name];
        if (!this.data) throw new Error("Cannot load skin: " + name);

        if (N > this.data.max_size) {
            throw new Error("# of variants (" + N + ") greater than maximum size of skin (" + this.data.max_size + ")");
        }

        const NULLCARD = [-1, -1, -1];

        if (this.data.type === "text") {
            this.parse = (card) => {
                return (card === null) ? this.data.null() : this.data.parse(card);
            }
        } else if (this.data.type === "image") {
            this.parse = (card) => {
                if (card === null) card = NULLCARD;
                let html = "<div class='card-container'>";
                [0, 1, 2].forEach(i => {
                    html += "<img class='card-img' src='Assets/";
                    html += this.data["cat"+i+"_root"] + this.data["cat"+i+"_parse"](card[i]) + "' ";
                    html += "alt='" + this.data["cat"+i+"_names"][card[i]] + "' />"
                })
                html += "</div>";
                return html;
            }
        }
    }
    getName(catIndex, val) {
        return this.data["cat"+catIndex+"_names"][val];
    }
}