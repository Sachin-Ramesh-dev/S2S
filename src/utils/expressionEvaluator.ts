/**
 * Evaluates n8n-style expressions against incoming input data
 * e.g. {{ $json.user.name }} or {{ $json.id }}
 */
export function evaluateExpression(expression: string, inputData: any, vaultCredentials?: any[]): { result: any; error?: string } {
  if (!expression || typeof expression !== 'string') {
    return { result: expression };
  }

  // Check if expression has {{ ... }} pattern
  const hasExpression = /\{\{([\s\S]+?)\}\}/.test(expression);
  if (!hasExpression) {
    return { result: expression };
  }

  try {
    // Determine $json representation
    let $json: any = {};
    let $items: any[] = [];
    if (inputData) {
      if (Array.isArray(inputData)) {
        $items = inputData;
        $json = inputData.length > 0 ? (inputData[0]?.json || inputData[0]) : {};
      } else if (inputData.json) {
        $json = inputData.json;
        $items = [inputData];
      } else {
        $json = inputData;
        $items = [{ json: inputData }];
      }
    }

    const context = {
      $json,
      $items,
      $item: $json,
      $now: new Date().toISOString(),
      $today: new Date().toISOString().split('T')[0],
      $timestamp: Date.now()
    };

    // If the expression is ENTIRELY inside a single {{ ... }}, we can return the exact typed value (e.g. object, number, array)
    const exactMatch = expression.trim().match(/^\{\{([\s\S]+)\}\}$/);
    if (exactMatch) {
      const code = exactMatch[1].trim();
      const fn = new Function('$json', '$items', '$item', '$now', '$today', '$timestamp', `
        try {
          return (${code});
        } catch (e) {
          throw e;
        }
      `);
      const val = fn(context.$json, context.$items, context.$item, context.$now, context.$today, context.$timestamp);
      return { result: val };
    }

    // String interpolation for embedded expressions like "Hello {{ $json.name }}!"
    const interpolated = expression.replace(/\{\{([\s\S]+?)\}\}/g, (_match, code) => {
      try {
        const fn = new Function('$json', '$items', '$item', '$now', '$today', '$timestamp', `
          return (${code.trim()});
        `);
        const val = fn(context.$json, context.$items, context.$item, context.$now, context.$today, context.$timestamp);
        if (typeof val === 'object') return JSON.stringify(val);
        return val !== undefined ? String(val) : '';
      } catch (e: any) {
        return `[Error: ${e.message}]`;
      }
    });

    return { result: interpolated };
  } catch (err: any) {
    return { result: undefined, error: err.message };
  }
}
