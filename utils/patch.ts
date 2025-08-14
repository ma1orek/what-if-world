// /utils/patch.ts
// Simple RFC6902 patch implementation
export function applyScenarioPatch(scenario: any, patch: any[]) {
  const result = JSON.parse(JSON.stringify(scenario)); // polyfill for structuredClone
  
  for (const op of patch) {
    switch (op.op) {
      case "add":
        applyAdd(result, op.path, op.value);
        break;
      case "replace":
        applyReplace(result, op.path, op.value);
        break;
      case "remove":
        applyRemove(result, op.path);
        break;
    }
  }
  
  return result;
}

function applyAdd(obj: any, path: string, value: any) {
  const parts = path.split('/').filter(p => p !== '');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current)) {
      current[part] = {};
    }
    current = current[part];
  }
  
  const lastPart = parts[parts.length - 1];
  if (lastPart === '-' && Array.isArray(current)) {
    current.push(value);
  } else {
    current[lastPart] = value;
  }
}

function applyReplace(obj: any, path: string, value: any) {
  const parts = path.split('/').filter(p => p !== '');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    current = current[parts[i]];
  }
  
  current[parts[parts.length - 1]] = value;
}

function applyRemove(obj: any, path: string) {
  const parts = path.split('/').filter(p => p !== '');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    current = current[parts[i]];
  }
  
  const lastPart = parts[parts.length - 1];
  if (Array.isArray(current)) {
    current.splice(parseInt(lastPart), 1);
  } else {
    delete current[lastPart];
  }
}