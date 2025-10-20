const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const GREEK = "αβγδεζηθικλμνξοπρσςτυφχψω";
const COMMONGREEK = "αβεθλμπδτηω";

const Skins = {
    tuple: {
        name: "tuple",
        parse: (card) => "(" + card + ")"
    },
    greek: {
        name: "greek",
        parse: (card) => ALPHABET[card[0]] + card[1] + COMMONGREEK[card[2]]
    },
    test: {
        name: "test",
        type: "image",
        parse: (card) => "<div class='card-container'> \
  <img class='card-img' src='Assets/color" + card[0] + ".png' alt='Image 1' /> \
  <img class='card-img' src='Assets/person" + card[1] + ".png' alt='Image 2' /> \
  <img class='card-img' src='Assets/item" + card[2] + ".png' alt='Image 3' /> \
</div>"
            
        // parse: (card) => "<img class='card-img' src='Assets/sample_card.png' alt='" + card + "'/>"
    }
}
