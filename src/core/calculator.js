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

        // Check for specific time with timezone (e.g., "10:30 PM MST" or "10:30 PM MST + 2")
        const specificTimeMatch = cleanText.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)\s+(PST|MST|CST|EST|UTC|IST)\s*([-+]\s*\d+)?$/i);
        if (specificTimeMatch) {
            const hours = parseInt(specificTimeMatch[1]);
            const minutes = parseInt(specificTimeMatch[2]);
            const period = specificTimeMatch[3].toUpperCase();
            const timezone = specificTimeMatch[4].toUpperCase();
            const offsetHours = specificTimeMatch[5] ? parseFloat(specificTimeMatch[5].replace(/\s/g, '')) : 0;
            return this.convertSpecificTime(hours, minutes, period, timezone, offsetHours);
        }

        // Check for timezone conversion keyword with optional offset
        const timeMatch = cleanText.toLowerCase().match(/^time\s*([-+]\s*\d+)?$/);
        if (timeMatch) {
            const offsetHours = timeMatch[1] ? parseFloat(timeMatch[1].replace(/\s/g, '')) : 0;
            return this.convertTimezones(offsetHours);
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

    // Convert specific time from one timezone to all others
    convertSpecificTime(hours, minutes, period, sourceTimezone, hourOffset = 0) {
        // Define timezone IANA identifiers (handles DST automatically)
        const timezoneMap = {
            'PST': 'America/Los_Angeles',
            'MST': 'America/Denver',
            'CST': 'America/Chicago',
            'EST': 'America/New_York',
            'UTC': 'UTC',
            'IST': 'Asia/Kolkata'
        };

        const timezoneLabels = {
            'PST': 'Pacific (PST)',
            'MST': 'Mountain (MST)',
            'CST': 'Central (CST)',
            'EST': 'Eastern (EST)',
            'UTC': 'UTC',
            'IST': 'India (IST)'
        };

        // Convert 12-hour to 24-hour format
        let hours24 = hours;
        if (period === 'PM' && hours !== 12) {
            hours24 = hours + 12;
        } else if (period === 'AM' && hours === 12) {
            hours24 = 0;
        }

        // Get current date for accurate timezone offset calculation (handles DST)
        const today = new Date();

        // Create a date string in the source timezone
        // We'll use Intl API to properly handle timezone conversions
        const sourceIANA = timezoneMap[sourceTimezone];

        // Create a date object with the specified time
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const timeStr = `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

        // Parse the time as if it's in the source timezone
        // Create date in local time first
        const localDate = new Date(`${dateStr}T${timeStr}`);

        // Get the offset of the source timezone at this date/time
        const sourceFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: sourceIANA,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZoneName: 'short'
        });

        // Get UTC offset for source timezone
        const utcFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'UTC',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        // Create a date that represents the input time in the source timezone
        // We need to find what UTC time corresponds to the given local time in source timezone
        const testDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), hours24, minutes, 0));

        // Format this date in source timezone
        const sourceFormatted = sourceFormatter.format(testDate);
        const utcFormatted = utcFormatter.format(testDate);

        // Parse both to get the offset
        const sourceParts = sourceFormatted.match(/(\d+)\/(\d+)\/(\d+),?\s+(\d+):(\d+):(\d+)/);
        const utcParts = utcFormatted.match(/(\d+)\/(\d+)\/(\d+),?\s+(\d+):(\d+):(\d+)/);

        if (!sourceParts || !utcParts) {
            // Fallback to simple offset calculation
            const sourceOffset = this.getTimezoneOffsetHours(sourceIANA);
            const baseUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), hours24 - sourceOffset, minutes, 0);
            const adjustedUTC = baseUTC + (hourOffset * 3600000);

            return this.buildTimezoneResults(new Date(adjustedUTC), sourceTimezone, timezoneMap, timezoneLabels, hours, minutes, period, hourOffset);
        }

        // Calculate the difference to get proper UTC time
        const sourceTime = new Date(sourceParts[3], sourceParts[1] - 1, sourceParts[2], sourceParts[4], sourceParts[5], sourceParts[6]);
        const utcTime = new Date(utcParts[3], utcParts[1] - 1, utcParts[2], utcParts[4], utcParts[5], utcParts[6]);

        const offsetMs = sourceTime - utcTime;

        // Now create the actual UTC time for the input
        const inputUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), hours24, minutes, 0) - offsetMs;

        // Apply hour offset if provided
        const adjustedUTC = inputUTC + (hourOffset * 3600000);

        return this.buildTimezoneResults(new Date(adjustedUTC), sourceTimezone, timezoneMap, timezoneLabels, hours, minutes, period, hourOffset);
    }

    // Helper to get timezone offset in hours
    getTimezoneOffsetHours(ianaTimezone) {
        const now = new Date();
        const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
        const tzDate = new Date(now.toLocaleString('en-US', { timeZone: ianaTimezone }));
        return (tzDate - utcDate) / (1000 * 60 * 60);
    }

    // Build timezone results array
    buildTimezoneResults(utcDate, sourceTimezone, timezoneMap, timezoneLabels, originalHours, originalMinutes, originalPeriod, hourOffset) {
        const timezones = [];
        const allTimezones = Object.keys(timezoneMap);

        // For source timezone, show the ORIGINAL input time
        timezones.push({
            label: `${timezoneLabels[sourceTimezone]}`,
            time: `${String(originalHours).padStart(2, '0')}:${String(originalMinutes).padStart(2, '0')} ${originalPeriod}`,
            hours: originalPeriod === 'PM' && originalHours !== 12 ? originalHours + 12 : (originalPeriod === 'AM' && originalHours === 12 ? 0 : originalHours),
            minutes: originalMinutes,
            isNight: false, // Will be calculated based on 24h format
            isLocal: false
        });

        // Convert to all other timezones
        allTimezones.forEach(tz => {
            if (tz !== sourceTimezone) {
                const zoneTime = this.formatTimeForTimezone(utcDate, timezoneMap[tz], timezoneLabels[tz], false);
                timezones.push(zoneTime);
            }
        });

        return {
            type: 'timezone',
            timezones: timezones,
            original: `${originalHours}:${String(originalMinutes).padStart(2, '0')} ${originalPeriod} ${sourceTimezone}`,
            hourOffset: hourOffset,
            isSpecificTime: true,
            sourceTimezone: sourceTimezone
        };
    }

    // Timezone conversion feature
    convertTimezones(hourOffset = 0) {
        const now = new Date();

        // Apply hour offset if provided (for "time + 2" or "time - 3")
        const adjustedTime = new Date(now.getTime() + (hourOffset * 3600000));

        // Define all timezones with IANA identifiers (handles DST automatically)
        const allTimezones = [
            { name: 'PST', label: 'Pacific (PST)', iana: 'America/Los_Angeles' },
            { name: 'MST', label: 'Mountain (MST)', iana: 'America/Denver' },
            { name: 'CST', label: 'Central (CST)', iana: 'America/Chicago' },
            { name: 'EST', label: 'Eastern (EST)', iana: 'America/New_York' },
            { name: 'UTC', label: 'UTC', iana: 'UTC' },
            { name: 'IST', label: 'India (IST)', iana: 'Asia/Kolkata' }
        ];

        // Detect user's local timezone using Intl
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Find if user's timezone matches one of our supported timezones
        let localZone = null;
        for (const tz of allTimezones) {
            if (userTimezone === tz.iana || userTimezone.includes(tz.name)) {
                localZone = tz;
                break;
            }
        }

        // If no exact match, find closest by offset
        if (!localZone) {
            const localOffset = -now.getTimezoneOffset() / 60;
            // Get current offset for each timezone (accounting for DST)
            const formatter = new Intl.DateTimeFormat('en-US', {
                hour: 'numeric',
                timeZoneName: 'short'
            });

            localZone = allTimezones.reduce((prev, curr) => {
                const currDate = new Date(now.toLocaleString('en-US', { timeZone: curr.iana }));
                const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
                const currOffset = (currDate - utcDate) / 3600000;

                const prevDate = new Date(now.toLocaleString('en-US', { timeZone: prev.iana }));
                const prevOffset = (prevDate - utcDate) / 3600000;

                return Math.abs(currOffset - localOffset) < Math.abs(prevOffset - localOffset) ? curr : prev;
            });
        }

        // Get other 5 timezones (exclude local)
        const otherZones = allTimezones.filter(tz => tz.name !== localZone.name);

        // Build timezone results array
        const timezones = [];

        // Add local timezone first
        const localTime = this.formatTimeForTimezone(adjustedTime, localZone.iana, localZone.label, true);
        timezones.push(localTime);

        // Add other 5 timezones
        otherZones.forEach(tz => {
            const zoneTime = this.formatTimeForTimezone(adjustedTime, tz.iana, tz.label, false);
            timezones.push(zoneTime);
        });

        return {
            type: 'timezone',
            timezones: timezones,
            original: 'Time',
            hourOffset: hourOffset // Store the offset for display
        };
    }

    formatTimeForTimezone(date, ianaTimezone, label, isLocal) {
        // Use Intl.DateTimeFormat for proper timezone conversion (handles DST)
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: ianaTimezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        const timeString = formatter.format(date);

        // Get 24-hour format for night/day detection
        const formatter24 = new Intl.DateTimeFormat('en-US', {
            timeZone: ianaTimezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        const time24 = formatter24.format(date);
        const hours24 = parseInt(time24.split(':')[0]);
        const minutes = parseInt(time24.split(':')[1]);

        // Determine if it's night time (6 PM to 6 AM)
        const isNight = hours24 >= 18 || hours24 < 6;

        return {
            label: isLocal ? `${label} (Local)` : label,
            time: timeString,
            hours: hours24,
            minutes: minutes,
            isNight: isNight,
            isLocal: isLocal
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

        // Convert to 12-hour format with AM/PM
        const period = hours24 >= 12 ? 'PM' : 'AM';
        const hours12 = hours24 % 12 || 12; // Convert 0 to 12 for midnight

        // Format time as HH:MM AM/PM (without seconds)
        const timeString = `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;

        // Determine if it's night time (6 PM to 6 AM) - use 24-hour format for comparison
        const isNight = hours24 >= 18 || hours24 < 6;

        return {
            label: isLocal ? `${label} (Local)` : label,
            time: timeString,
            hours: hours24,
            minutes: minutes,
            isNight: isNight,
            isLocal: isLocal
        };
    }
}

export default CalculationEngine;
