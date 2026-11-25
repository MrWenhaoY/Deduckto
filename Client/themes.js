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
        animals: {
        name: "animals",
        type: "image",
        max_size: 7,
        cat0_root: "location/",
        cat0_parse: (i) => i >= 0 ? "location" + i + ".png" : "location_unknown.png",
        cat0_names: ["Mountains", "Library", "Pier", "Park", "City", "Acquarium", "Desert"],
        cat1_root: "animals/",
        cat1_parse: (i) => i >= 0 ? "animal" + i + ".png" : "person_unknown.png",
        cat1_names: ["Pig", "Pigeon", "Bear", "Fox", "Dog", "Cat", "Rabbit"],
        cat2_root: "disguise/",
        cat2_parse: (i) => i >= 0 ? "disguise" + i + ".png" : "blank.png",
        cat2_names: ["Hat", "Wig", "Bandana", "Mask", "Monocle", "Mustache", "Sunglasses"],
        toText(card) {return this.cat1_names[card[1]] + " wearing " + this.cat2_names[card[2]] + " in the " + this.cat0_names[card[0]]}
    },
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
}
