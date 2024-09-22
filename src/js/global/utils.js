// Different scope, have to redeclare: https://developer.chrome.com/docs/extensions/reference/api/scripting?hl=vi#type-ExecutionWorld
const findValueByKey = (obj, key) => {
    if (typeof obj !== 'object' || obj === null) return null;
    const stack = [obj];
    const visited = new Set();
    while (stack.length) {
        const current = stack.pop();
        if (visited.has(current)) continue;
        visited.add(current);
        if (current[key] !== undefined) return current[key];
        for (const value of Object.values(current)) {
            if (typeof value === 'object' && value !== null) {
                stack.push(value);
            }
        }
    }
    return null;
};