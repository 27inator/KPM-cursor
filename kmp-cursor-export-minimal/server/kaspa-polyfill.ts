// Polyfill for kaspeak-SDK compatibility issues
// This ensures the SDK has all required methods available

// Polyfill for String.prototype.padEnd if not available
if (!String.prototype.padEnd) {
  String.prototype.padEnd = function(targetLength: number, padString: string = ' '): string {
    const str = String(this);
    if (str.length >= targetLength) return str;
    
    const pad = String(padString);
    const padLength = targetLength - str.length;
    
    let result = str;
    for (let i = 0; i < Math.ceil(padLength / pad.length); i++) {
      result += pad;
    }
    
    return result.substring(0, targetLength);
  };
}

// Polyfill for String.prototype.padStart if not available
if (!String.prototype.padStart) {
  String.prototype.padStart = function(targetLength: number, padString: string = ' '): string {
    const str = String(this);
    if (str.length >= targetLength) return str;
    
    const pad = String(padString);
    const padLength = targetLength - str.length;
    
    let result = '';
    for (let i = 0; i < Math.ceil(padLength / pad.length); i++) {
      result += pad;
    }
    
    return result.substring(0, padLength) + str;
  };
}

// Polyfill for other potential missing methods
if (!Array.prototype.flat) {
  Array.prototype.flat = function(depth: number = 1): any[] {
    const flatDeep = (arr: any[], d: number): any[] => {
      return d > 0 ? arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flatDeep(val, d - 1) : val), [])
                   : arr.slice();
    };
    return flatDeep(this, depth);
  };
}

console.log('✅ Kaspa SDK polyfills applied');