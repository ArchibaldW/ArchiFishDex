exports.getParisDateAtMidnight = function() {
    const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" }));
    d.setHours(0, 0, 0, 0);
    return d;
}

exports.getStartOfToday = function() {
    return exports.getParisDateAtMidnight();
}


exports.getStartOfWeek = function() {
    const d = exports.getParisDateAtMidnight();
    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);
    d.setDate(diff);
    return d;
}

exports.getStartOfMonth = function() {
    const d = exports.getParisDateAtMidnight();
    d.setDate(1);
    return d;
}