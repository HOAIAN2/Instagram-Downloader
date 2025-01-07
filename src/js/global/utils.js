// Different scope, have to redeclare: https://developer.chrome.com/docs/extensions/reference/api/scripting?hl=vi#type-ExecutionWorld
function getValueByKey(obj, key) {
    if (typeof obj !== 'object' || obj === null) return null;
    const stack = [obj];
    const visited = new Set();
    while (stack.length) {
        const current = stack.pop();
        if (visited.has(current)) continue;
        visited.add(current);
        try {
            if (current[key] !== undefined) return current[key];
        } catch (error) {
            if (error.name === 'SecurityError') continue;
            console.log(error);
        }
        for (const value of Object.values(current)) {
            if (typeof value === 'object' && value !== null) {
                stack.push(value);
            }
        }
    }
    return null;
};

function getAllValuesByKey(obj, targetKey) {
    if (typeof obj !== 'object' || obj === null) return [];
    const values = [];
    const stack = [obj];
    const visited = new Set();
    while (stack.length) {
        const current = stack.pop();
        if (visited.has(current)) continue;
        visited.add(current);
        for (const [key, value] of Object.entries(current)) {
            if (key === targetKey) {
                values.push(value);
            }
            if (typeof value === 'object' && value !== null) {
                stack.push(value);
            }
        }
    }
    return values;
};
