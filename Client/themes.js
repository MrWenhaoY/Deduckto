const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const GREEK = "αβγδεζηθικλμνξοπρσςτυφχψω";
const COMMONGREEK = "αβεθλμπδτηω";
const digits = "0123456789";

const THEMES = {
    // tuple: {
    //     name: "tuple",
    //     type: "text",
    //     max_size: 10,
    //     parse: (card) => "(" + card + ")",
    //     null: () => "(???)",
    //     cat0_names: digits,
    //     cat1_names: digits,
    //     cat2_names: digits
    // },
    // greek: {
    //     name: "greek",
    //     type: "text",
    //     max_size: 10,
    //     parse: (card) => "[" + ALPHABET[card[0]] + card[1] + COMMONGREEK[card[2]] + "]",
    //     null: () => "[???]",
    //     cat0_names: ALPHABET,
    //     cat1_names: digits,
    //     cat2_names: COMMONGREEK
    // },
    maple: {
        name: "maple",
        type: "image",
        max_size: 7,
        cat0_root: "color/",
        cat0_parse: (i) => i >= 0 ? "color" + i + ".png" : "color_unknown.png",
        cat0_names: ["Red", "Orange", "Yellow", "Green", "Blue", "Purple", "Pink"],
        cat1_root: "person/",
        cat1_parse: (i) => i >= 0 ? "person" + i + ".png" : "person_unknown.png",
        cat1_names: ["Seven", "Arks", "Winter", "Gart", "Eli", "Lain", "Del Fuego"],
        cat2_root: "item/",
        cat2_parse: (i) => i >= 0 ? "item" + i + ".png" : "blank.png",
        cat2_names: ["Water Bottle", "iPad", "Rocket", "Clarinet", "Flask", "Cookie", "Chessboard"],
        toText(card) {return this.cat0_names[card[0]] + " " + this.cat1_names[card[1]] + " with " + this.cat2_names[card[2]]}
    },
    animals: {
        name: "animals",
        type: "image",
        max_size: 7,
        cat0_root: "locations/",
        cat0_parse: (i) => i >= 0 ? "location" + i + ".png" : "location_unknown.png",
        cat0_names: ["Mountains", "Library"],
        cat1_root: "person/",
        cat1_parse: (i) => i >= 0 ? "person" + i + ".png" : "person_unknown.png",
        cat1_names: ["Seven", "Arks", "Winter", "Gart", "Eli", "Lain", "Del Fuego"],
        cat2_root: "item/",
        cat2_parse: (i) => i >= 0 ? "item" + i + ".png" : "blank.png",
        cat2_names: ["Water Bottle", "iPad", "Rocket", "Clarinet", "Flask", "Cookie", "Chessboard"],
        toText(card) {return this.cat0_names[card[0]] + " " + this.cat1_names[card[1]] + " with " + this.cat2_names[card[2]]}
    }
}
