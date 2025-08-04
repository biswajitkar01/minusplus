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

        // Detect calculation type
        if (cleanText.includes('\n')) {
            return this.calculateVerticalColumn(cleanText);
        } else if (cleanText.includes(' ')) {
            return this.calculateHorizontalSequence(cleanText);
        } else if (this.isNumber(cleanText)) {
            return this.createSingleNumberResult(cleanText);
        }

        return null;
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
        const elements = [];
        let currentNumber = null;
        let lastOperator = '+'; // Default to addition

        for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed) continue;

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
}

export default CalculationEngine;
