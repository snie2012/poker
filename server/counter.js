function* Counter() {
    let count = 0;
    while (true) {
        yield count++;
    }
}

module.exports = Counter;