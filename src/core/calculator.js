// Calculation Engine
// High-performance number parsing and auto-calculation system

class CalculationEngine {
    constructor() {
        this.operations = {
            '+': (a, b) => a + b,
            '-': (a, b) => a - b,
            '*': (a, b) => a * b,
            '/': (a, b) => b !== 0 ? a / b : NaN,
            '×': (a, b) => a * b,
            '÷': (a, b) => b !== 0 ? a / b : NaN
        };

        // Number parsing regex patterns
        this.numberPatterns = {
            basic: /[-+]?[0-9]*\.?[0-9]+/g,
            currency: /[-+]?\$?[0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?/g,
            percentage: /[-+]?[0-9]*\.?[0-9]+%/g,
            withOperators: /([-+×*÷\/]?)\s*([0-9]*\.?[0-9]+)/g
        };
    }

    // Main calculation method - detects type and calculates
    calculate(text) {
        if (!text || !text.trim()) {
            return null;
        }

        const cleanText = text.trim();

        // Check for timezone conversion keyword
        if (cleanText.toLowerCase() === 'time') {
            return this.convertTimezones();
        }

        // Detect calculation type - prioritize mixed calculations
        if (cleanText.includes('\n')) {
            return this.calculateMixed(cleanText);
        } else if (cleanText.includes(' ') || /[-+×*÷\/]/.test(cleanText)) {
            // Check for spaces OR mathematical operators
            return this.calculateHorizontalSequence(cleanText);
        } else if (this.isNumber(cleanText)) {
            return this.createSingleNumberResult(cleanText);
        }

        return null;
    }

    // Calculate mixed (both horizontal lines and vertical column)
    calculateMixed(text) {
        const lines = text.split('\n');
        const calculations = [];
        let allNumbers = [];

        // First, calculate each horizontal line
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            if (line.includes(' ') || /[-+×*÷\/]/.test(line)) {
                // This line has horizontal calculation
                const horizontalResult = this.calculateHorizontalSequence(line);
                if (horizontalResult && horizontalResult.numbers.length > 1) {
                    calculations.push({
                        type: 'horizontal',
                        line: i,
                        result: horizontalResult,
                        numbers: horizontalResult.numbers
                    });
                    // Add the result to the vertical calculation
                    allNumbers.push(horizontalResult.result);
                } else {
                    // Single number, add to vertical calculation
                    const num = this.parseNumber(line);
                    if (!isNaN(num)) {
                        allNumbers.push(num);
                    }
                }
            } else {
                // Single number, add to vertical calculation
                const num = this.parseNumber(line);
                if (!isNaN(num)) {
                    allNumbers.push(num);
                }
            }
        }

        // Then calculate the vertical total
        let verticalResult = null;
        if (allNumbers.length > 1) {
            const sum = allNumbers.reduce((acc, num) => acc + num, 0);
            verticalResult = {
                type: 'vertical',
                numbers: allNumbers,
                result: sum,
                formatted: this.formatResult(sum)
            };
        }

        // Return mixed calculation result
        if (calculations.length > 0 || (verticalResult && allNumbers.length > 1)) {
            return {
                type: 'mixed',
                horizontal: calculations,
                vertical: verticalResult,
                original: text
            };
        }

        // Fallback to simple vertical calculation if no horizontal calculations found
        return this.calculateVerticalColumn(text);
    }

    // Calculate vertical column (line-separated numbers)
    calculateVerticalColumn(text) {
        const lines = text.split('\n');
        const result = this.parseExpression(lines);

        if (!result || result.numbers.length <= 1) {
            return null;
        }

        return {
            type: 'vertical',
            numbers: result.numbers,
            result: result.result,
            operation: result.operation,
            formatted: this.formatResult(result.result),
            original: text
        };
    }

    // Calculate horizontal sequence (space-separated numbers)
    calculateHorizontalSequence(text) {
        // Simple parentheses rule:
        // - If any (...) group contains more than a plain number, treat entire line as a math expression.
        // - If parentheses wrap a single number (accounting), fall through to existing parsing.
        if (text.includes('(') && text.includes(')')) {
            const paren = /\(([^()]*)\)/g;
            let hasMathGroup = false;
            let m;
            while ((m = paren.exec(text)) !== null) {
                const inner = m[1].trim();
                // Plain number (optional leading - and commas/decimals/currency)
                const isPlainNumber = /^-?\$?[0-9][0-9,]*(?:\.[0-9]+)?$/.test(inner);
                if (!isPlainNumber) { hasMathGroup = true; break; }
            }

            if (hasMathGroup) {
                try {
                    let cleanText = text
                        .replace(/×/g, '*')
                        .replace(/÷/g, '/');

                    // Implicit multiplication (number)( ... ) or (...)number
                    cleanText = cleanText.replace(/(\d)\s*\(/g, '$1*(');
                    cleanText = cleanText.replace(/\)\s*(\d)/g, ')*$1');

                    // Allow only safe characters
                    cleanText = cleanText.replace(/[^0-9+\-*/().\s]/g, '');

                    const result = Function('"use strict"; return (' + cleanText + ')')();
                    if (typeof result === 'number' && !isNaN(result)) {
                        const originalNumbers = text.match(/\d+\.?\d*/g)?.map(n => parseFloat(n)) || [result];
                        return {
                            type: 'horizontal',
                            numbers: originalNumbers,
                            result,
                            operation: 'mathematical',
                            formatted: this.formatResult(result),
                            original: text
                        };
                    }
                } catch (e) {
                    return null;
                }
            }
            // If no math-group parentheses were found, proceed with existing parsing
        }

        // First try to parse as a mathematical expression (no spaces required)
        const expressionResult = this.parseExpression([text]);
        if (expressionResult && expressionResult.numbers.length > 1) {
            return {
                type: 'horizontal',
                numbers: expressionResult.numbers,
                result: expressionResult.result,
                operation: expressionResult.operation,
                formatted: this.formatResult(expressionResult.result),
                original: text
            };
        }

        // Fallback to space-separated parsing
        const parts = text.split(/\s+/);
        const result = this.parseExpression(parts);

        if (!result || result.numbers.length <= 1) {
            return null;
        }

        return {
            type: 'horizontal',
            numbers: result.numbers,
            result: result.result,
            operation: result.operation,
            formatted: this.formatResult(result.result),
            original: text
        };
    }

    // Parse mathematical expression with operators
    parseExpression(parts) {
        // If we have only one part, try to parse it as a mathematical expression
        if (parts.length === 1) {
            const mathResult = this.parseMathExpression(parts[0]);
            if (mathResult) {
                return mathResult;
            }
        }

        // Original logic for space-separated parts
        const elements = [];
        let currentNumber = null;
        let lastOperator = '+'; // Default to addition

        for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed) continue;

            // Check for SAP trailing minus format first (before operator detection)
            if (trimmed.endsWith('-') && trimmed.length > 1) {
                const numberPart = trimmed.slice(0, -1);
                if (/^[0-9.,\s$€£¥₹]+$/.test(numberPart)) {
                    const num = this.parseNumber(trimmed);
                    if (!isNaN(num)) {
                        elements.push({ type: 'number', value: num, operator: lastOperator });
                        lastOperator = '+'; // Reset to default
                    }
                    continue; // Skip operator detection for SAP format
                }
            }

            // Check if this part contains an operator
            const operatorMatch = trimmed.match(/^([-+×*÷\/])(.*)$/) || trimmed.match(/^(.+?)([-+×*÷\/])$/);

            if (operatorMatch) {
                // Part contains an operator
                const [, prefix, suffix] = operatorMatch;

                if (prefix && this.isNumber(prefix)) {
                    // Number before operator (e.g., "5+")
                    const num = this.parseNumber(prefix);
                    if (!isNaN(num)) {
                        elements.push({ type: 'number', value: num, operator: lastOperator });
                        lastOperator = suffix || '+';
                    }
                } else if (suffix && this.isNumber(suffix)) {
                    // Operator before number (e.g., "+5")
                    lastOperator = this.normalizeOperator(prefix);
                    const num = this.parseNumber(suffix);
                    if (!isNaN(num)) {
                        elements.push({ type: 'number', value: num, operator: lastOperator });
                        lastOperator = '+';
                    }
                } else {
                    // Just an operator
                    lastOperator = this.normalizeOperator(trimmed);
                }
            } else if (this.isNumber(trimmed)) {
                // Just a number
                const num = this.parseNumber(trimmed);
                if (!isNaN(num)) {
                    elements.push({ type: 'number', value: num, operator: lastOperator });
                    lastOperator = '+'; // Reset to default
                }
            }
        }

        if (elements.length === 0) {
            return null;
        }

        return this.calculateFromElements(elements);
    }

    // Parse mathematical expression without spaces (e.g., "2+3-1*4")
    parseMathExpression(expression) {
        const trimmed = expression.trim();

        // Check if this looks like a mathematical expression
        if (!/[-+×*÷\/]/.test(trimmed)) {
            return null; // No operators found
        }

        // Split the expression into numbers and operators
        const tokens = this.tokenizeMathExpression(trimmed);
        if (!tokens || tokens.length < 3) {
            return null; // Need at least number-operator-number
        }

        // Convert tokens to elements format
        const elements = [];
        let currentOperator = '+'; // First number is always positive by default

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (token.type === 'number') {
                elements.push({
                    type: 'number',
                    value: token.value,
                    operator: currentOperator
                });
                currentOperator = '+'; // Reset for next
            } else if (token.type === 'operator') {
                currentOperator = this.normalizeOperator(token.value);
            }
        }

        if (elements.length === 0) {
            return null;
        }

        return this.calculateFromElements(elements);
    }

    // Tokenize mathematical expression into numbers and operators
    tokenizeMathExpression(expression) {
        const tokens = [];
        let currentNumber = '';
        let i = 0;

        while (i < expression.length) {
            const char = expression[i];

            if (/[0-9.,]/.test(char)) {
                // Part of a number (including commas and decimals)
                currentNumber += char;
            } else if (/[-+×*÷\/]/.test(char)) {
                // Potential operator found

                // Check if this minus is trailing (SAP format like "900-")
                if (char === '-' && currentNumber && /[0-9]/.test(currentNumber)) {
                    // Look ahead to see if this is trailing minus or operator
                    const nextChar = i + 1 < expression.length ? expression[i + 1] : '';

                    if (!nextChar || /\s/.test(nextChar) || /[+×*÷\/]/.test(nextChar)) {
                        // This appears to be a trailing minus (SAP format)
                        currentNumber += '-'; // Add to current number for parseNumber to handle
                    } else {
                        // Regular operator
                        if (currentNumber) {
                            const num = this.parseNumber(currentNumber);
                            if (!isNaN(num)) {
                                tokens.push({ type: 'number', value: num });
                            }
                            currentNumber = '';
                        }
                        tokens.push({ type: 'operator', value: char });
                    }
                } else {
                    // Regular operator handling
                    if (currentNumber) {
                        const num = this.parseNumber(currentNumber);
                        if (!isNaN(num)) {
                            tokens.push({ type: 'number', value: num });
                        }
                        currentNumber = '';
                    }

                    // Handle negative numbers (e.g., in "5+-3" or at start like "-5+3")
                    if (char === '-' && (tokens.length === 0 || tokens[tokens.length - 1].type === 'operator')) {
                        // This minus is part of a negative number
                        currentNumber = '-';
                    } else {
                        tokens.push({ type: 'operator', value: char });
                    }
                }
            } else if (/\s/.test(char)) {
                // Skip whitespace
                if (currentNumber) {
                    const num = this.parseNumber(currentNumber);
                    if (!isNaN(num)) {
                        tokens.push({ type: 'number', value: num });
                    }
                    currentNumber = '';
                }
            } else {
                // Skip unknown characters
                if (currentNumber) {
                    const num = this.parseNumber(currentNumber);
                    if (!isNaN(num)) {
                        tokens.push({ type: 'number', value: num });
                    }
                    currentNumber = '';
                }
            }
            i++;
        }

        // Handle remaining number
        if (currentNumber) {
            const num = this.parseNumber(currentNumber);
            if (!isNaN(num)) {
                tokens.push({ type: 'number', value: num });
            }
        }

        return tokens;
    }

    // Calculate result from parsed elements
    calculateFromElements(elements) {
        // Calculate the result
        let result = 0;
        let operation = 'addition';
        const numbers = [];

        for (const element of elements) {
            numbers.push(element.value);

            if (element.operator === '+') {
                result += element.value;
            } else if (element.operator === '-') {
                result -= element.value;
                operation = numbers.length === 1 ? 'subtraction' : 'mixed';
            } else if (element.operator === '*' || element.operator === '×') {
                result *= element.value;
                operation = numbers.length === 1 ? 'multiplication' : 'mixed';
            } else if (element.operator === '/' || element.operator === '÷') {
                if (element.value !== 0) {
                    result /= element.value;
                    operation = numbers.length === 1 ? 'division' : 'mixed';
                } else {
                    return { numbers: [], result: NaN, operation: 'error' };
                }
            }
        }

        // Determine operation type for display
        if (elements.length > 1 && elements.every(e => e.operator === '+')) {
            operation = 'addition';
        } else if (elements.length > 1 && elements.every(e => e.operator === '-')) {
            operation = 'subtraction';
        } else if (elements.length > 1) {
            operation = 'mixed';
        }

        return {
            numbers: numbers,
            result: result,
            operation: operation
        };
    }

    // Normalize operator symbols
    normalizeOperator(op) {
        switch (op) {
            case '×': return '*';
            case '÷': return '/';
            case '+': return '+';
            case '-': return '-';
            case '*': return '*';
            case '/': return '/';
            default: return '+';
        }
    }

    // Handle single number input
    createSingleNumberResult(text) {
        const number = this.parseNumber(text);
        if (isNaN(number)) {
            return null;
        }

        return {
            type: 'single',
            numbers: [number],
            result: number,
            operation: 'none',
            formatted: this.formatResult(number),
            original: text
        };
    }

    // Extract numbers from array of text strings
    extractNumbers(textArray) {
        return textArray
            .map(str => str.trim())
            .filter(str => str.length > 0)
            .map(str => this.parseNumber(str))
            .filter(num => !isNaN(num) && isFinite(num));
    }

    // Robust number parsing with multiple format support
    parseNumber(str) {
        if (typeof str !== 'string') {
            return NaN;
        }

        // Remove common formatting characters
        let cleaned = str.trim();

        // Handle SAP-style trailing minus FIRST (e.g., "900-" becomes "-900")
        if (cleaned.endsWith('-') && cleaned.length > 1) {
            const numberPart = cleaned.slice(0, -1);
            // Make sure the part before the minus is actually a number
            if (/^[0-9.,\s$€£¥₹]+$/.test(numberPart)) {
                cleaned = '-' + numberPart;
            }
        }

        // Handle percentage
        if (cleaned.endsWith('%')) {
            cleaned = cleaned.slice(0, -1);
            const num = parseFloat(cleaned);
            return isNaN(num) ? NaN : num / 100;
        }

        // Remove currency symbols, commas, and extra whitespace
        cleaned = cleaned.replace(/[$€£¥₹,\s]/g, '');

        // Handle negative numbers in parentheses (accounting format)
        if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
            cleaned = '-' + cleaned.slice(1, -1);
        }

        // Parse the cleaned number
        const number = parseFloat(cleaned);
        return isNaN(number) ? NaN : number;
    }

    // Check if string represents a valid number
    isNumber(str) {
        return !isNaN(this.parseNumber(str));
    }

    // Detect and describe number format for UX feedback
    detectNumberFormat(str) {
        if (typeof str !== 'string') {
            return null;
        }

        const cleaned = str.trim();

        if (cleaned.endsWith('%')) {
            return { type: 'percentage', description: 'Percentage format' };
        }

        if (cleaned.endsWith('-') && cleaned.length > 1 && /^[0-9.,\s$€£¥₹]+$/.test(cleaned.slice(0, -1))) {
            return { type: 'sap_trailing_minus', description: 'SAP trailing minus format' };
        }

        if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
            return { type: 'accounting_parentheses', description: 'Accounting parentheses format' };
        }

        if (/[$€£¥₹]/.test(cleaned)) {
            return { type: 'currency', description: 'Currency format' };
        }

        if (/^[-+]?[0-9]*\.?[0-9]+$/.test(cleaned.replace(/,/g, ''))) {
            return { type: 'standard', description: 'Standard number format' };
        }

        return null;
    }

    // Format calculation results with proper locale formatting
    formatResult(number, options = {}) {
        if (!isFinite(number)) {
            return 'Error';
        }

        const {
            precision = 'auto',
            locale = 'en-US',
            currency = false,
            percentage = false
        } = options;

        let formatOptions = {
            minimumFractionDigits: 0,
            maximumFractionDigits: precision === 'auto' ? this.getOptimalPrecision(number) : precision
        };

        if (currency) {
            formatOptions.style = 'currency';
            formatOptions.currency = 'USD';
        } else if (percentage) {
            formatOptions.style = 'percent';
            formatOptions.minimumFractionDigits = 2;
            formatOptions.maximumFractionDigits = 2;
        }

        try {
            return new Intl.NumberFormat(locale, formatOptions).format(number);
        } catch (error) {
            // Fallback formatting
            return number.toFixed(this.getOptimalPrecision(number));
        }
    }

    // Determine optimal decimal precision for display
    getOptimalPrecision(number) {
        if (Number.isInteger(number)) {
            return 0;
        }

        const str = number.toString();
        const decimalIndex = str.indexOf('.');

        if (decimalIndex === -1) {
            return 0;
        }

        const decimals = str.length - decimalIndex - 1;
        return Math.min(decimals, 6); // Max 6 decimal places
    }

    // Validate calculation result
    validateResult(calculation) {
        if (!calculation || typeof calculation.result !== 'number') {
            return false;
        }

        return isFinite(calculation.result) &&
            calculation.numbers &&
            calculation.numbers.length > 0;
    }

    // Get calculation summary for display
    getCalculationSummary(calculation) {
        if (!this.validateResult(calculation)) {
            return null;
        }

        const { numbers, result, operation, type } = calculation;

        let summary = `${numbers.length} numbers`;

        switch (operation) {
            case 'addition':
                summary += ` → Sum: ${this.formatResult(result)}`;
                break;
            case 'subtraction':
                summary += ` → Difference: ${this.formatResult(result)}`;
                break;
            case 'multiplication':
                summary += ` → Product: ${this.formatResult(result)}`;
                break;
            case 'division':
                summary += ` → Quotient: ${this.formatResult(result)}`;
                break;
            case 'mixed':
                summary += ` → Result: ${this.formatResult(result)}`;
                break;
            default:
                summary += ` → ${this.formatResult(result)}`;
        }

        if (type === 'vertical') {
            summary += ' (column)';
        } else if (type === 'horizontal') {
            summary += ' (row)';
        }

        return summary;
    }

    // Advanced operations for future features
    calculateAdvanced(expression) {
        // Placeholder for future advanced calculations
        // Could include functions like SUM, AVERAGE, etc.
        return null;
    }

    // Statistics calculations
    getStatistics(numbers) {
        if (!numbers || numbers.length === 0) {
            return null;
        }

        const sum = numbers.reduce((a, b) => a + b, 0);
        const mean = sum / numbers.length;
        const sortedNumbers = [...numbers].sort((a, b) => a - b);
        const median = sortedNumbers.length % 2 === 0
            ? (sortedNumbers[sortedNumbers.length / 2 - 1] + sortedNumbers[sortedNumbers.length / 2]) / 2
            : sortedNumbers[Math.floor(sortedNumbers.length / 2)];

        return {
            count: numbers.length,
            sum: sum,
            mean: mean,
            median: median,
            min: Math.min(...numbers),
            max: Math.max(...numbers)
        };
    }

    // Timezone conversion feature
    convertTimezones() {
        const now = new Date();

        // Define all timezones with their UTC offsets
        const allTimezones = [
            { name: 'PST', label: 'Pacific (PST)', offset: -8 },
            { name: 'MST', label: 'Mountain (MST)', offset: -7 },
            { name: 'CST', label: 'Central (CST)', offset: -6 },
            { name: 'EST', label: 'Eastern (EST)', offset: -5 },
            { name: 'UTC', label: 'UTC', offset: 0 },
            { name: 'IST', label: 'India (IST)', offset: 5.5 }
        ];

        // Detect user's local timezone
        const localOffset = -now.getTimezoneOffset() / 60;
        let localZone = null;

        // Find closest matching timezone
        const closestMatch = allTimezones.reduce((prev, curr) => {
            return Math.abs(curr.offset - localOffset) < Math.abs(prev.offset - localOffset) ? curr : prev;
        });

        localZone = closestMatch;

        // Get other 5 timezones (exclude local)
        const otherZones = allTimezones.filter(tz => tz.name !== localZone.name);

        // Build timezone results array
        const timezones = [];

        // Add local timezone first
        const localTime = this.formatTimeForZone(now, localOffset, localZone.label, true);
        timezones.push(localTime);

        // Add other 5 timezones
        otherZones.forEach(tz => {
            const zoneTime = this.formatTimeForZone(now, tz.offset, tz.label, false);
            timezones.push(zoneTime);
        });

        return {
            type: 'timezone',
            timezones: timezones,
            original: 'Time'
        };
    }

    formatTimeForZone(baseTime, offset, label, isLocal) {
        // Calculate time in target timezone
        // Create a new date at UTC, then add the timezone offset
        const utcTime = Date.UTC(
            baseTime.getUTCFullYear(),
            baseTime.getUTCMonth(),
            baseTime.getUTCDate(),
            baseTime.getUTCHours(),
            baseTime.getUTCMinutes(),
            baseTime.getUTCSeconds()
        );

        // Add offset in milliseconds (offset is in hours)
        const zoneTime = new Date(utcTime + (offset * 3600000));

        const hours24 = zoneTime.getUTCHours();
        const minutes = zoneTime.getUTCMinutes();
        const seconds = zoneTime.getUTCSeconds();

        // Convert to 12-hour format with AM/PM
        const period = hours24 >= 12 ? 'PM' : 'AM';
        const hours12 = hours24 % 12 || 12; // Convert 0 to 12 for midnight

        // Format time as HH:MM:SS AM/PM
        const timeString = `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${period}`;

        // Determine if it's night time (6 PM to 6 AM) - use 24-hour format for comparison
        const isNight = hours24 >= 18 || hours24 < 6;

        return {
            label: isLocal ? `${label} (Local)` : label,
            time: timeString,
            hours: hours24,
            minutes: minutes,
            seconds: seconds,
            isNight: isNight,
            isLocal: isLocal
        };
    }
}

export default CalculationEngine;
