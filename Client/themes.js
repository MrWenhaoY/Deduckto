const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const GREEK = "αβγδεζηθικλμνξοπρσςτυφχψω";
const COMMONGREEK = "αβεθλμπδτηω";
const digits = "0123456789";

const THEMES = {
    tuple: {
        name: "tuple",
        type: "text",
        max_size: 10,
        parse: (card) => "(" + card + ")",
        null: () => "(???)",
        cat0_names: digits,
        cat1_names: digits,
        cat2_names: digits
    },
    greek: {
        name: "greek",
        type: "text",
        max_size: 10,
        parse: (card) => "[" + ALPHABET[card[0]] + card[1] + COMMONGREEK[card[2]] + "]",
        null: () => "[???]",
        cat0_names: ALPHABET,
        cat1_names: digits,
        cat2_names: COMMONGREEK
    }
}
