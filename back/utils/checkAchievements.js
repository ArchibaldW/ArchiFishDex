const Catch = require('../models/Catch');
const Achievement = require('../models/Achievement');

const starters = [
    ["0007", "0008", "0009"],
    ["0158", "0159", "0160"],
    ["0258", "0259", "0260"],
    ["0393", "0394", "0395"],
    ["0501", "0502", "0503"],
    ["0656", "0657", "0658"],
    ["0728", "0729", "0730"],
    ["0816", "0817", "0818"],
    ["0912", "0913", "0914"]
]
const megas = ["0009m", "0080m", "0130m", "0260m", "0319m", "0382p"];

const checkAchievements = async function(user) {
    const catches = await Catch.find({}).lean();
    const achievementsList = await Achievement.find({}).lean();
    achievementsList.sort((a, b) => a.number - b.number)

    const userUnlockedAchievements = user.achievements.map(a => a.number);

    const catchesMap = new Map(catches.map(c => [c.code, c]));
    const userUniqueCatches = new Set(user.catches.map(c => c.code));

    const userCatches = user.catches.map(uc => {
        const matchingCatch = catchesMap.get(uc.code) || {};
        return {
            ...uc,
            gen: matchingCatch.gen,
            tags: matchingCatch.tags || [],
            types: [matchingCatch.type1, matchingCatch.type2]
        };
    });


    let achievementsOwned = []

    const unlock = (num) => {
        if (userUnlockedAchievements.includes(num)) return;

        const achievement = achievementsList[num - 1]
        if (!achievement) return;

        user.achievements.push({number : achievement.number, date : new Date()});
        user.achievementsPoints = (user.achievementsPoints || 0) + achievement.value;

        achievementsOwned.push(achievement);
        userUnlockedAchievements.push(num);
    };

    // 1 : Catch a pokémon
    if (!userUnlockedAchievements.includes(1)){
        unlock(1)
    }

    // 2 : Catch a shiny
    if (!userUnlockedAchievements.includes(2)){
        if (user.catches.some(c => c.shiny)) {
            unlock(2)
        }
    }

    // 3 : Catch a starter
    if (!userUnlockedAchievements.includes(3)){
        if (userCatches.some(c => c.tags.includes("starter"))) {
            unlock(3)
        }
    }

    // 4 : Catch a shiny starter
    if (!userUnlockedAchievements.includes(4)){
        if (userCatches.some(c => c.tags.includes("starter") && c.shiny)) {
            unlock(4)
        }
    }

    // 5 : Catch a fossil
    if (!userUnlockedAchievements.includes(5)){
        if (userCatches.some(c => c.tags.includes("fossil"))) {
            unlock(5)
        }
    }

    // 6 : Catch a shiny fossil
    if (!userUnlockedAchievements.includes(6)){
        if (userCatches.some(c => c.tags.includes("fossil") && c.shiny)) {
            unlock(6)
        }
    }
    
    // 7 : Catch a legendary
    if (!userUnlockedAchievements.includes(7)){
        if (userCatches.some(c => c.tags.includes("legendary"))) {
            unlock(7)
        }
    }
    
    // 8 : Catch a shiny legendary
    if (!userUnlockedAchievements.includes(8)){
        if (userCatches.some(c => c.tags.includes("legendary") && c.shiny)) {
            unlock(8)
        }
    }

    // 9 : Catch a mega-evolution pokémon
    if (!userUnlockedAchievements.includes(9)){
        if (userCatches.some(c => c.tags.includes("mega"))) {
            unlock(9)
        }
    }

    // 10 : Catch a shiny méga-evolution pokémon
    if (!userUnlockedAchievements.includes(10)){
        if (userCatches.some(c => c.tags.includes("mega") && c.shiny)) {
            unlock(10)
        }
    }
    
    // 11 : Catch a same pokemon twice
    // 12 : Catch a same pokemon five times
    // 13 : Catch a same pokemon ten times
    // 14 : Catch a same pokemon twenty times
    // 15 : Catch a same pokemon fifty times
    if ([11, 12, 13, 14, 15].some(num => !userUnlockedAchievements.includes(num))) {
        const counts = user.catches.reduce((acc, element) => {
            const key = `${element.code}|${element.shiny}`;
            acc.set(key, (acc.get(key) || 0) +1)
            return acc;
        }, new Map());
        const maxCount = Math.max(0, ...counts.values())

        const thresholds = [[11, 2], [12, 5], [13, 10], [14, 20], [15, 50]];
        thresholds.forEach(([num, req]) => {
            if (!userUnlockedAchievements.includes(num)){
                if (maxCount >= req) {
                    unlock(num)
                }
            }
        });
    }

    // 16 : Catch a same shiny pokemon twice
    // 17 : Catch a same shiny pokemon ten times
    if ([16, 17].some(num => !userUnlockedAchievements.includes(num))) {
        const counts = user.catches.filter(element => element.shiny === true).reduce((acc, element) => {
            const key = `${element.code}`;
            acc.set(key, (acc.get(key) || 0) +1)
            return acc;
        }, new Map());
        const maxCount = Math.max(0, ...counts.values())

        if (!userUnlockedAchievements.includes(16)){
            if(maxCount >= 2){
                unlock(16)
            }
        }

        if (!userUnlockedAchievements.includes(17)){
            if(maxCount >= 10){
                unlock(17);
            }
        }

    }

    // 18 : Catch a non water-pokémon
    if (!userUnlockedAchievements.includes(18)){
        if (userCatches.some(c => !c.types.includes("water"))) {
            unlock(18)
        }
    }

    // 19 : Catch a Magikarp
    if (!userUnlockedAchievements.includes(19)){
        if (userCatches.some(c => c.code === "0129")) {
            unlock(19)
        }
    }
    
    // 20 : Catch a shiny Leviator
    if (!userUnlockedAchievements.includes(20)){
        if (userCatches.some(c => c.code === "0130" && c.shiny === true)) {
            unlock(20)
        }
    }
    
    // 21 : Catch a Yuyu
    if (!userUnlockedAchievements.includes(21)){
        if (userCatches.some(c => c.code === "1004")) {
            unlock(21)
        }
    }

    // 22 : Catch 10 pokémons
    // 23 : Catch 25 pokémons
    // 24 : Catch 50 pokémons
    // 25 : Catch 100 pokémons
    // 26 : Catch 250 pokémons
    // 27 : Catch 500 pokémons
    // 28 : Catch 1000 pokémons
    if ([22, 23, 24, 25, 26, 27, 28].some(num => !userUnlockedAchievements.includes(num))) {
        const thresholds = [[22, 10], [23, 25], [24, 50], [25, 100], [26, 250], [27, 500], [28, 1000]];
        thresholds.forEach(([num, req]) => {
            if (!userUnlockedAchievements.includes(num) && user.catches.length >= req){
                unlock(num)
            }
        });
    }


    // 29 : Catch 5 uniques pokémons
    // 30 : Catch 10 uniques pokémons
    // 31 : Catch 20 uniques pokémons
    // 32 : Catch 35 uniques pokémons
    // 33 : Catch 55 uniques pokémons
    // 34 : Catch 80 uniques pokémons
    // 35 : Catch 110 uniques pokémons
    // 36 : Catch 145 uniques pokémons
    // 71 : Catch 190 uniques pokémons
    if ([29, 30, 31, 32, 33, 34, 35, 36, 71].some(num => !userUnlockedAchievements.includes(num))) {
        const thresholds = [[29, 5], [30, 10], [31, 20], [32, 35], [33, 55], [34, 80], [35, 110], [36, 151], [71, 200]];

        const uniqueCount = userUniqueCatches.size;
        thresholds.forEach(([num, req]) => {
            if (!userUnlockedAchievements.includes(num) && uniqueCount >= req){
                unlock(num)
            }
        });
    }

    // 37 : Catch all unique pokémons
    if (!userUnlockedAchievements.includes(37)){
        const uniqueCount = userUniqueCatches.size;
        if (uniqueCount === catches.length) {
            unlock(37)
        }
    }


    // 38 : Catch a trio of starters
    if (!userUnlockedAchievements.includes(38)){
        const isStarterCombo = starters.some(serie => 
            serie.every(code => userUniqueCatches.has(code))
        );

        if (isStarterCombo) {
            unlock(38);
        }
    } 

    // 39 : Catch every starters
    if (!userUnlockedAchievements.includes(39)){
        const isEveryStarters = starters.every(serie => 
            serie.every(code => userUniqueCatches.has(code))
        );

        if (isEveryStarters) {
            unlock(39);
        }
    }


    // 40 : Catch a pokemon with a variation
    // 41 : Catch 10 unique variations of pokemons
    // 72 : Catch 25 unique variations of pokemons
    // 73 : Catch all unique variations of all pokemons
    if ([40, 41, 72, 73].some(num => !userUnlockedAchievements.includes(num))) {
    
        const variantCodes = userCatches.filter(c => c.tags.includes("variant")).map(c => c.code);
        const variantsOwned = [...new Set(variantCodes)];

        if (!userUnlockedAchievements.includes(40) && variantsOwned.length > 0) {
            unlock(40)
        }

        if (!userUnlockedAchievements.includes(41) && variantsOwned.length >= 10) {
            unlock(41)
        }

        if (!userUnlockedAchievements.includes(72) && variantsOwned.length >= 25) {
            unlock(72)
        }

        const totalUniqueVariants = new Set(catches.filter(c => c.tags && c.tags.includes("variant")).map(c => c.code)).size;
        if (!userUnlockedAchievements.includes(73) && variantsOwned.length === totalUniqueVariants) {
            unlock(73)
        }
    }

    // 42 : Catch all nigirigon forms
    if (!userUnlockedAchievements.includes(42)) {
        const codes = ["0978c", "0978a", "0978r"];
        if (codes.every(code => userUniqueCatches.has(code))) {
            unlock(42);
        }
    }

    // 43 : Catch all Shellos family and variants
    if (!userUnlockedAchievements.includes(43)) {
        const codes = ["0422e", "0422o", "0423e", "0423o"];
        if (codes.every(code => userUniqueCatches.has(code))) {
            unlock(43);
        }
    }

    // 44 : Catch all Frillish family variants
    if (!userUnlockedAchievements.includes(44)) {
        const codes = ["0592f", "0592m", "0593f", "0593m"];
        if (codes.every(code => userUniqueCatches.has(code))) {
            unlock(44);
        }
    }

    // 45 : Catch all Cramorant variants
    if (!userUnlockedAchievements.includes(45)) {
        const codes = ["0845", "0845g", "0845h"];
        if (codes.every(code => userUniqueCatches.has(code))) {
            unlock(45);
        }
    }

    // 46 : Catch a Vaporeon
    // 47 : Catch 9 Vaporeon
    if ([46, 47].some(num => !userUnlockedAchievements.includes(num))) {
        const vaporeonCount = user.catches.filter(c => c.code === "0134").length;
        if (!userUnlockedAchievements.includes(46) && vaporeonCount >= 1) {
            unlock(46);
        }
        if (!userUnlockedAchievements.includes(47) && vaporeonCount >= 9) {
            unlock(47);
        }
    }

    const genCodes = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [] };
    catchesMap.forEach((pokemon, code) => {
        if (pokemon.gen && genCodes[pokemon.gen]) {
            genCodes[pokemon.gen].push(code);
        }
    });

    for (let gen = 1; gen <= 9; gen++) {
        const catch1Id = 48 + (gen - 1) * 2;
        const catchAllId = 49 + (gen - 1) * 2;
        
        const userGenCaughtCount = [...userUniqueCatches].filter(code => catchesMap.get(code)?.gen === gen).length;
        
        // 48 : Catch a Pokemon from Kanto
        // 50 : Catch a Pokemon from Johto
        // 52 : Catch a Pokemon from Hoenn
        // 54 : Catch a Pokemon from Sinnoh
        // 56 : Catch a Pokemon from Unys
        // 58 : Catch a Pokemon from Kalos
        // 60 : Catch a Pokemon from Alola
        // 62 : Catch a Pokemon from Galar
        // 64 : Catch a Pokemon from Paldea
        if (!userUnlockedAchievements.includes(catch1Id) && userGenCaughtCount > 0) {
            unlock(catch1Id);
        }
        
        // 49 : Catch all Pokemons from Kanto
        // 51 : Catch all Pokemons from Johto
        // 53 : Catch all Pokemons from Hoenn
        // 55 : Catch all Pokemons from Sinnoh
        // 57 : Catch all Pokemons from Unys
        // 59 : Catch all Pokemons from Kalos
        // 61 : Catch all Pokemons from Alola
        // 63 : Catch all Pokemons from Galar
        // 65 : Catch all Pokemons from Paldea
        if (!userUnlockedAchievements.includes(catchAllId)) {
            if (genCodes[gen].every(code => userUniqueCatches.has(code))) {
                unlock(catchAllId);
            }
        }
    }

    if (!userUnlockedAchievements.includes(66)) {
        let hasAllRegions = true;
        for (let gen = 1; gen <= 9; gen++) {
            if (!userCatches.some(c => c.gen === gen)) {
                hasAllRegions = false;
                break;
            }
        }
        if (hasAllRegions) {
            unlock(66);
        }
    }

    if (!userUnlockedAchievements.includes(67) && userUniqueCatches.has("0493")) {
        unlock(67);
    }

    if (!userUnlockedAchievements.includes(68)) {
        if (userCatches.some(c => c.code === "0399" && c.shiny === true)) {
            unlock(68);
        }
    }

    if (!userUnlockedAchievements.includes(69) && userUniqueCatches.has("0349")) {
        unlock(69);
    }

    if (!userUnlockedAchievements.includes(70) && userUniqueCatches.has("0321")) {
        unlock(70);
    }

    // 74 : Catch a favorite pokemon 
    // 75 : Catch all favorite pokemons
    if ([74, 75].some(num => !userUnlockedAchievements.includes(num))) {
    
        const favoritesCodes = userCatches.filter(c => c.tags.includes("favorite")).map(c => c.code);
        const favoritesOwned = [...new Set(favoritesCodes)];

        if (!userUnlockedAchievements.includes(74) && favoritesCodes.length > 0) {
            unlock(74)
        }

        const totalUniqueFavorites = new Set(catches.filter(c => c.tags && c.tags.includes("favorite")).map(c => c.code)).size;
        if (!userUnlockedAchievements.includes(75) && favoritesOwned.length === totalUniqueFavorites) {
            unlock(75)
        }
    }

    return {achievementsOwned, user}
}

module.exports = checkAchievements;