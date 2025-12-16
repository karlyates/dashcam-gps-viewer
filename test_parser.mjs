
import { parseDatText } from './js/parser.js';
import fs from 'fs';

try {
    const data = fs.readFileSync('sample.dat', 'utf8');
    const points = parseDatText(data);
    console.log(`Parsed ${points.length} points.`);
    if (points.length > 0) {
        console.log('Sample point:', points[0]);
        if (points[0].lat === 37.774929) {
            console.log('VERIFICATION PASSED');
        } else {
            console.log('VERIFICATION FAILED: Coordinates mismatch');
        }
    } else {
        console.log('VERIFICATION FAILED: No points parsed');
    }
} catch (err) {
    console.error('VERIFICATION ERROR:', err);
}
