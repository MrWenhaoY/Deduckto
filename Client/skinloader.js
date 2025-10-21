class SkinLoader {
    constructor(name) {
        this.data = SKINS[name];
        if (!this.data) throw new Error("Cannot load skin: " + name);

        if (this.data.type === "text") {
            this.parse = this.data.parse;
        } else if (this.data.type === "image") {
            this.parse = (card) => {
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