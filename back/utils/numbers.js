exports.parseNumericValue = function(value){
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return null;

    const cleaned = value
      .trim()
      .replace(/\s+/g, '')
      .replace(',', '.');

    const numberValue = parseFloat(cleaned);
    return Number.isFinite(numberValue) ? numberValue : null;
};