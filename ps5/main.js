import { getBinomialProbability } from './utils.js';
import chroma from 'chroma-js';

const BALL_COLOR = "#2F65A7";     // The color of the balls: [Arboretum Blue](https://brand.umich.edu/design-resources/colors/)

let NUM_BALLS = 10;              // The number of balls to drop 
const GRAPH_HEIGHT = 300;          // The maximum height of the graph (in pixels)
const BALL_RADIUS = 10;            // The radius of the balls (in pixels)
const PEG_RADIUS = 3;              // The radius of the pegs (in pixels)
const X_MOVEMENT = 30;             // The horizontal distance between pegs (in pixels)
const Y_MOVEMENT = 20;             // The vertical distance between pegs (in pixels)
const DELAY_BETWEEN_BALLS = 1000;  // How long to wait between dropping balls (in milliseconds)
const DELAY_BETWEEN_PEGS  = 1000;  // How long it takes for a ball to drop from one peg to the next (in milliseconds)
const DELAY_WHEN_DROP     = 1000;  // How long it takes for the ball to "fall" into the hole (in milliseconds)
let PROBABILITY_RIGHT = 0.5;     // The probability of a ball going right (as opposed to left) 

const PADDING = Math.max(PEG_RADIUS, BALL_RADIUS, X_MOVEMENT/2) + 5; // The padding around the edge of the SVG element (in pixels)

const svgElement      = document.querySelector('svg');         // The parent SVG container
const numLevelsInput  = document.querySelector('#num-levels'); // The input for the number of levels
const dropBallsButton = document.querySelector('#do-drop');    // The button to drop the balls
const speedInput      = document.querySelector('#speed');      // The input for the speed of the animation


const numBallsInput = document.querySelector('#num-balls');  
const probRightInput = document.querySelector('#prob-right');

const pegs = []; // A 2D array of pegs (each peg is a circle element)
const actualBars = []; // An array of the number of balls that actually hit each bar
const expectedBars = []; // An array of the expected number of balls that hit each bar


function easeOutQuad(t) { return t*(2-t); }
function easeInQuad(t) { return t*t; }


function animateCircle(circle, fromX, fromY, toX, toY, duration, easing) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        function step() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easing(progress);
            
            const currentX = fromX + (toX - fromX) * easedProgress;
            const currentY = fromY + (toY - fromY) * easedProgress;
            
            circle.setAttribute('cx', currentX);
            circle.setAttribute('cy', currentY);
            
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                resolve();
            }
        }
        
        requestAnimationFrame(step);
    });
}


function animateOpacity(circle, fromOpacity, toOpacity, duration, easing) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        function step() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easing(progress);
            
            const currentOpacity = fromOpacity + (toOpacity - fromOpacity) * easedProgress;
            circle.setAttribute('opacity', currentOpacity);
            
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                resolve();
            }
        }
        
        requestAnimationFrame(step);
    });
}

// Animation function for rectangle height
function animateHeight(rect, fromHeight, toHeight, duration, easing) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        function step() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easing(progress);
            
            const currentHeight = fromHeight + (toHeight - fromHeight) * easedProgress;
            rect.setAttribute('height', currentHeight);
            
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                resolve();
            }
        }
        
        requestAnimationFrame(step);
    });
}

function drawBoard() {
    Array.from(svgElement.children).forEach(child => child.remove()); // Remove all the children of the SVG element

    const NUM_LEVELS = parseInt(numLevelsInput.value); // How many levels of pegs to have
    NUM_BALLS = parseInt(numBallsInput.value); 
    PROBABILITY_RIGHT = parseFloat(probRightInput.value); 

    const TOTAL_WIDTH  = (NUM_LEVELS-1) * X_MOVEMENT + 2 * PADDING;                // The total width of the SVG element (in pixels)
    const TOTAL_HEIGHT = (NUM_LEVELS-1) * Y_MOVEMENT + 2 * PADDING + GRAPH_HEIGHT; // The total height of the SVG element (in pixels)

    // Some math to estimate the highest probability in a [binomial distribution](https://en.wikipedia.org/wiki/Binomial_distribution)
    const MODE = Math.round((NUM_LEVELS-1) * PROBABILITY_RIGHT); // The mode (most probable outcome) of the binomial distribution
    const maxProb = getBinomialProbability(NUM_LEVELS-1, MODE, PROBABILITY_RIGHT); // The estimated maximum probability
    const BAR_SCALE_FACTOR = 0.5 * GRAPH_HEIGHT / maxProb; // The scale factor for the bars

    svgElement.setAttribute('width', TOTAL_WIDTH);
    svgElement.setAttribute('height', TOTAL_HEIGHT); // Set the width and height of the SVG element

    const hitCounts = []; // A 2D array of the number of balls that hit each peg


    const pegColorScale = chroma.scale(['#FEFEFE', BALL_COLOR]);

    for(let level = 0; level < NUM_LEVELS; level++) {
        const rowHitCounts = []; 
        hitCounts.push(rowHitCounts);

        const rowPegs = []; 
        pegs.push(rowPegs);

        for(let i = NUM_LEVELS - level - 1; i <= NUM_LEVELS + level - 1; i+=2) {
            hitCounts[level][i] = 0; // Initialize the hit count for this peg at 0

            const { x, y } = getGraphicLocation(i, level);
            const circle = createCircle(x, y, PEG_RADIUS, '#FEFEFE', 'none', svgElement);
            if(level === 0) {
                circle.setAttribute('fill', BALL_COLOR); // The top peg is always filled in
            }

            pegs[level][i] = circle; // Store the peg in the 2D array
        }
    }

    // Draw the bars for the expected and actual probabilities
    for(let i = 0; i < 2*NUM_LEVELS-1; i+=2) { // The last row has columns 0, 2, 4, 6, etc. (so we only need to loop through every other column)
        const { x, y } = getGraphicLocation(i, NUM_LEVELS-1);

        const barY = y + PEG_RADIUS + 2; // The y coordinate of the top of the bar (just below the peg)

        const actualBar = createRect(x - X_MOVEMENT/2, barY, X_MOVEMENT, 0, BALL_COLOR, 'none', svgElement); // Create a new rectangle for the number of balls that actually hit
        actualBars.push(actualBar);

        const prob = getBinomialProbability(NUM_LEVELS-1, Math.floor(i/2), PROBABILITY_RIGHT); // The binomial probability of getting hit
        const expectedBar = createRect(x - X_MOVEMENT/2, barY, X_MOVEMENT, BAR_SCALE_FACTOR * prob, 'rgba(0, 0, 0, 0.1)', BALL_COLOR, svgElement); // Create a new rectangle for the expected number of balls that hit
        expectedBars.push(expectedBar);
    }

    async function dropBall() {
        let row = 0; // Start at the top row
        let col = NUM_LEVELS - 1; // Start in the middle column


        const randomDarken = 2 * Math.random() - 1; 
        const randomSaturate = 2 * Math.random() - 1; 
        const ballColor = chroma(BALL_COLOR).darken(randomDarken).saturate(randomSaturate).hex();

        const { x, y } = getGraphicLocation(col, row);
        const circle = createCircle(x, y, BALL_RADIUS, ballColor, ballColor, svgElement); // Create a new circle with random color
        circle.setAttribute('opacity', 0.9); // Make the circle slightly transparent

        // Drop the ball down the board by looping down the rows and randomly choosing left or right
        for(let i = 0; i < NUM_LEVELS-1; i++) {
            row++; // The row is always incremented

            if(Math.random() < PROBABILITY_RIGHT) { // If the random number is less than the probability of going right, go right
                col++; // Go right
            } else {
                col--; // Go left
            }

            const { x: newX, y: newY } = getGraphicLocation(col, row); 
            const fromX = parseFloat(circle.getAttribute('cx'));
            const fromY = parseFloat(circle.getAttribute('cy'));
            
           
            const animationDuration = DELAY_BETWEEN_PEGS / parseFloat(speedInput.value);
            await animateCircle(circle, fromX, fromY, newX, newY, animationDuration, easeOutQuad);

    
            const peg = pegs[row][col];
            hitCounts[row][col]++;
            
           
            const hitRatio = hitCounts[row][col] / NUM_BALLS;
            peg.setAttribute('fill', pegColorScale(hitRatio).hex());
        }

  
        const finalColHitCount = hitCounts[NUM_LEVELS-1][col];
        const barIndex = Math.floor(col/2);
        const newBarHeight = BAR_SCALE_FACTOR * finalColHitCount / NUM_BALLS;
        const currentBarHeight = parseFloat(actualBars[barIndex].getAttribute('height') || 0);
        
      
        const currentX = parseFloat(circle.getAttribute('cx'));
        const currentY = parseFloat(circle.getAttribute('cy'));
        
       
        const finalAnimDuration = DELAY_WHEN_DROP / parseFloat(speedInput.value);
        
   
        await Promise.all([
            // Ball falls down 20px
            animateCircle(circle, currentX, currentY, currentX, currentY + 20, finalAnimDuration, easeOutQuad),
            // Ball fades out
            animateOpacity(circle, 0.9, 0, finalAnimDuration, easeOutQuad),
            // Bar height increases
            animateHeight(actualBars[barIndex], currentBarHeight, newBarHeight, finalAnimDuration, easeInQuad)
        ]);

        circle.remove(); 
    }

    async function dropBalls() {

        for (let level = 0; level < NUM_LEVELS; level++) {
            for (let i = NUM_LEVELS - level - 1; i <= NUM_LEVELS + level - 1; i += 2) {
                hitCounts[level][i] = 0;
                if (level > 0) { // Don't change the top peg color
                    pegs[level][i].setAttribute('fill', '#FEFEFE');
                }
            }
        }
        
        // Reset bar heights
        actualBars.forEach(bar => bar.setAttribute('height', 0));

        // Disable the inputs and button while the balls are dropping
        dropBallsButton.setAttribute('disabled', true);
        numLevelsInput.setAttribute('disabled', true);
        numBallsInput.setAttribute('disabled', true);
        probRightInput.setAttribute('disabled', true);

        const dropBallPromises = []; // An array of promises for each ball that is dropped
        for(let i = 0; i < NUM_BALLS; i++) {
            const ballDropPromise = dropBall(); // Drop a ball
            await pause(Math.random() * DELAY_BETWEEN_BALLS / parseFloat(speedInput.value)); // Wait a random amount of time before dropping the next ball
            dropBallPromises.push(ballDropPromise); // Add the promise to the array
        }

        await Promise.all(dropBallPromises); // Wait for all the balls to be dropped

        // Re-enable the inputs and button after the balls are done dropping
        dropBallsButton.removeAttribute('disabled');
        numLevelsInput.removeAttribute('disabled');
        numBallsInput.removeAttribute('disabled');
        probRightInput.removeAttribute('disabled');
    }

    dropBallsButton.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent form submission
        dropBalls();
    });

    // Return a function that cleans up the board
    function cleanup() {
        expectedBars.forEach(bar => bar.remove()); // Remove the "expected" bars
        expectedBars.splice(0, expectedBars.length); // ...and clear the array

        actualBars.forEach(bar => bar.remove()); // Remove the "actual" bars
        actualBars.splice(0, actualBars.length); // ...and clear the array

        pegs.forEach(row => row.forEach(peg => peg && peg.remove())); // Remove the pegs
        pegs.splice(0, pegs.length); // ...and clear the array

        dropBallsButton.removeEventListener('click', dropBalls); // Remove the event listener (we will re-add it when we redraw the board)
    }

    return cleanup; // Return the cleanup function
}


// Animates the height of a rectangle from its current height to a new height
async function changeHeightTo(rect, toHeight, duration) {
    await pause(duration);
    rect.setAttribute('height', toHeight);
}

// Animates the movement of a circle to a new location
async function moveCircleTo(circle, cx, cy, duration) {
    await pause(duration);
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
};


/**
 * Translates a column and row into a pixel location
 * 
 * @param {number} col The column of the peg (0 is the leftmost peg)
 * @param {number} row The row of the peg (0 is the topmost peg)
 * @returns {Object} An object with x and y properties representing the location of the peg in pixels
 */
function getGraphicLocation(col, row) {
    return {
        x: PADDING + col * (X_MOVEMENT/2),
        y: PADDING + row *  Y_MOVEMENT
    };
}

/**
 * Returns a promise that resolves after the given number of milliseconds
 * 
 * @param {number} ms The number of milliseconds to pause
 * @returns A promise that resolves after the given number of milliseconds
 */
function pause(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a rectangle and appends it to the parent SVG element
 * 
 * @param {number} x The x coordinate of the top left corner of the rectangle
 * @param {number} y The y coordinate of the top left corner of the rectangle
 * @param {number} width The width of the rectangle
 * @param {number} height The height of the rectangle
 * @param {string} fill The fill color of the rectangle
 * @param {string} stroke The stroke color of the rectangle
 * @param {SVGElement} parent The parent SVG element
 * @returns 
 */
function createRect(x, y, width, height, fill, stroke, parent) {
    // Create a new rectangle element using the SVG namespace
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
    rect.setAttribute('fill', fill);
    rect.setAttribute('stroke', stroke);
    parent.append(rect);
    return rect;
}

/**
 * Creates a circle and appends it to the parent SVG element
 * 
 * @param {number} cx The x coordinate of the center of the circle
 * @param {number} cy The y coordinate of the center of the circle
 * @param {number} r The radius of the circle
 * @param {string} fill The fill color of the circle
 * @param {string} stroke The stroke color of the circle
 * @param {SVGElement} parent The parent SVG element
 * @returns A new circle element
 */
function createCircle(cx, cy, r, fill, stroke, parent) {
    // Create a new circle element using the SVG namespace
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', r);
    circle.setAttribute('fill', fill);
    circle.setAttribute('stroke', stroke);
    parent.append(circle);
    return circle;
}

// When we change any of the parameter inputs, redraw the board
numLevelsInput.addEventListener('input', redrawBoard);
numBallsInput.addEventListener('input', redrawBoard);
probRightInput.addEventListener('input', redrawBoard);

let clearBoard = drawBoard(); // Draw the board initially (and store the cleanup function)
/**
 * Redraws the board (by calling the cleanup function and then drawing the board again)
 */
function redrawBoard() {
    clearBoard(); // Clean up the old board
    clearBoard = drawBoard(); // Draw the new board (and store the cleanup function)
}