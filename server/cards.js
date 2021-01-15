// https://en.wikipedia.org/wiki/Playing_cards_in_Unicode

const texts = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const textUnicode = ["2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "D", "E", "1"];
const suits = ["spade", "heart", "diamand", "club"];
const suitsUnicode = ["1F0A", "1F0B", "1F0C", "1F0D"];

let cards = [];
for (let suit_id in suits) {
    for (let text_id in texts) {
        cards.push({
            "suit": suits[suit_id],
            "text": texts[text_id],
            "value": text_id,
            "unicode": suitsUnicode[suit_id] + textUnicode[text_id],
            "is_joker": false,
        })
    }
}
cards.push({
    "suit": "zz",
    "text": "joker",
    "value": texts.length,
    "unicode": "1F0BF",
    "is_joker": true,
});
cards.push({
    "suit": "zz",
    "text": "joker",
    "value": texts.length + 1,
    "unicode": "1F0CF",
    "is_joker": true,
});

module.exports = cards;