class ThemeLoader {
    constructor(name, N) {
        this.data = THEMES[name];
        if (!this.data) throw new Error("Cannot load theme: " + name);

        if (N > this.data.max_size) {
            throw new Error("# of variants (" + N + ") greater than maximum size of theme (" + this.data.max_size + ")");
        }

        const NULLCARD = [-1, -1, -1];

        if (this.data.type === "text") {
            this.parse = (card) => {
                return (card === null) ? this.data.null() : this.data.parse(card);
            }
            this.getText = this.parse;
        } else if (this.data.type === "image") {
            this.parse = (card) => {
                if (card === null) card = NULLCARD;
                let html = "<div class='card noselect expandable'>";
                [0, 1, 2].forEach(i => {
                    html += "<img src='Assets/";
                    html += this.data["cat"+i+"_root"] + this.data["cat"+i+"_parse"](card[i]) + "' ";
                    html += "class='layer" + i + "' alt='" + this.data["cat"+i+"_names"][card[i]] + "' />"
                })
                html += "</div>";
                return html;
            }
            this.getText = (card) => this.data.toText(card); // Due to how the keyword 'this' works, the closure is necessary
        }
    }
    getName(catIndex, val) {
        return this.data["cat"+catIndex+"_names"][val];
    }
}