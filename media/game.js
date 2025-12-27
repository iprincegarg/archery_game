const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const arrowsEl = document.getElementById('arrows');
const resetBtn = document.getElementById('resetBtn');

let score = 0;
let arrowsLeft = 10;
let gameActive = true;

// Game objects
const bow = {
    x: 100,
    y: canvas.height / 2,
    color: '#8B4513'
};

let arrow = {
    x: bow.x,
    y: bow.y,
    vx: 0,
    vy: 0,
    active: false,
    width: 40,
    height: 3,
    stuck: false,
    stuckOffsetX: 0,
    stuckOffsetY: 0
};

const target = {
    x: 700,
    y: 250,
    radius: 30,
    speed: 2,
    direction: 1
};

// Input state
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let pullX = 0;
let pullY = 0;

// Event Listeners
canvas.addEventListener('mousedown', (e) => {
    if (!gameActive || arrow.active || arrow.stuck || arrowsLeft <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Enable dragging from anywhere
    isDragging = true;
    dragStartX = mouseX;
    dragStartY = mouseY;
});

window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate pull relative to drag start
        pullX = Math.min(Math.max(mouseX - dragStartX, -100), 0); // Limit pull back
        pullY = Math.min(Math.max(mouseY - dragStartY, -50), 50);
    }
});

window.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        // Only shoot if there was some pull
        if (pullX < -5) {
            shootArrow();
        } else {
            // Cancel shot if pull is too weak, just reset
            pullX = 0;
            pullY = 0;
            draw(); // Redraw static state
        }
    }
});

resetBtn.addEventListener('click', resetGame);

// Keyboard Restart
window.addEventListener('keydown', (e) => {
    if (!gameActive && (e.code === 'Space' || e.code === 'Enter')) {
        resetGame();
    }
});

function shootArrow() {
    arrow.active = true;
    arrow.stuck = false;
    arrow.x = bow.x + pullX;
    arrow.y = bow.y + pullY;

    // Calculate velocity based on pull
    const power = Math.hypot(pullX, pullY) * 0.25;
    const angle = Math.atan2(pullY, pullX);

    // Invert angle because we pull BACK to shoot FORWARD
    arrow.vx = Math.cos(angle + Math.PI) * power * 2;
    arrow.vy = Math.sin(angle + Math.PI) * power * 2;

    // Gravity effect setup could be added here if we want parabolic arc

    arrowsLeft--;
    updateUI();

    // Reset pull
    pullX = 0;
    pullY = 0;
}

function update() {
    if (!gameActive) return;

    // Move target
    target.y += target.speed * target.direction;
    if (target.y > canvas.height - 50 || target.y < 50) {
        target.direction *= -1;
    }

    if (arrow.stuck) {
        // Move arrow with target
        arrow.x = target.x + arrow.stuckOffsetX;
        arrow.y = target.y + arrow.stuckOffsetY;
        return;
    }

    // Move arrow
    if (arrow.active) {
        arrow.x += arrow.vx;
        arrow.y += arrow.vy;

        arrow.vy += 0.1; // Gravity

        // Check collision with target
        const dist = Math.hypot(arrow.x - target.x, arrow.y - target.y);
        if (dist < target.radius) {
            // Hit!
            const pts = Math.floor((target.radius - dist) + 10);
            score += pts;

            // Stick arrow
            arrow.active = false;
            arrow.stuck = true;
            arrow.stuckOffsetX = arrow.x - target.x;
            arrow.stuckOffsetY = arrow.y - target.y;

            updateUI();

            // Wait 1 second then reset
            setTimeout(() => {
                // Only reset if it's still the same stuck arrow (game didn't reset meanwhile)
                if (arrow.stuck) {
                    resetArrow();
                }
            }, 1000);
        }

        // Check bounds
        if (arrow.x > canvas.width || arrow.y > canvas.height) {
            resetArrow();
        }
    }

    if (arrowsLeft === 0 && !arrow.active && !arrow.stuck) {
        gameActive = false;
        // Logic handled in draw for UI overlay
    }
}

function resetArrow() {
    arrow.active = false;
    arrow.stuck = false;
    arrow.x = bow.x;
    arrow.y = bow.y;
    arrow.vx = 0;
    arrow.vy = 0;
    updateUI();
}

function resetGame() {
    score = 0;
    arrowsLeft = 10;
    gameActive = true;
    resetArrow();
    updateUI();
}

function updateUI() {
    scoreEl.textContent = score;
    arrowsEl.textContent = arrowsLeft;
}

function draw() {
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Recurve Bow Settings (Reversed/Rotated 180)
    const bowTipX = bow.x - 10;
    const bowTipY_Top = bow.y - 50;
    const bowTipY_Bot = bow.y + 50;

    // Draw String
    ctx.beginPath();
    ctx.moveTo(bowTipX, bowTipY_Top);
    if (isDragging) {
        ctx.lineTo(bow.x + pullX, bow.y + pullY);
        ctx.lineTo(bowTipX, bowTipY_Bot);
    } else {
        ctx.lineTo(bowTipX, bowTipY_Bot);
    }
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.lineCap = 'butt';
    ctx.stroke();

    // Draw Bow Limbs
    ctx.beginPath();
    // Top Limb
    ctx.moveTo(bow.x, bow.y - 10); // Top of grip
    ctx.bezierCurveTo(bow.x + 20, bow.y - 25, bow.x + 5, bow.y - 45, bowTipX, bowTipY_Top);

    // Bottom Limb
    ctx.moveTo(bow.x, bow.y + 10); // Bottom of grip
    ctx.bezierCurveTo(bow.x + 20, bow.y + 25, bow.x + 5, bow.y + 45, bowTipX, bowTipY_Bot);

    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.strokeStyle = bow.color;
    ctx.stroke();

    // Draw Grip (Handle)
    ctx.beginPath();
    ctx.moveTo(bow.x, bow.y - 10);
    ctx.lineTo(bow.x, bow.y + 10);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#5D4037'; // Darker brown
    ctx.lineCap = 'butt';
    ctx.stroke();

    // Draw Target
    ctx.beginPath();
    ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(target.x, target.y, target.radius * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(target.x, target.y, target.radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();

    // Draw Arrow
    let drawArrowX = arrow.active || arrow.stuck ? arrow.x : (bow.x + pullX);
    let drawArrowY = arrow.active || arrow.stuck ? arrow.y : (bow.y + pullY);

    // Calculate angle for rotation
    let rot = 0;
    if (arrow.active) {
        rot = Math.atan2(arrow.vy, arrow.vx);
    } else if (arrow.stuck) {
        // Keep angle when stuck ? 
        // For simplicity, horizontal since we don't track impact angle perfectly currently
        // and velocity is reset. To make it look real, we should store impact angle or velocity before sticking.
        // Let's approximate based on velocity just before hit, but we don't have it here easily.
        // Or just keep it pointing roughly right since inputs are from left.
        rot = 0;

        // Better: store rotation in arrow object.
    } else {
        // Pulling back
        if (isDragging) {
            rot = Math.atan2(pullY, pullX) + Math.PI;
        } else {
            rot = 0;
        }
    }

    ctx.save();
    ctx.translate(drawArrowX, drawArrowY);
    ctx.rotate(rot);

    // Arrow Dimensions
    const arrowLen = 50;
    const shaftWidth = 3;
    const headLen = 10;
    const featherLen = 12;
    const featherHeight = 6;

    // Draw Shaft (Wood texture color)
    ctx.beginPath();
    ctx.moveTo(-arrowLen / 2, 0);
    ctx.lineTo(arrowLen / 2, 0);
    ctx.lineWidth = shaftWidth;
    ctx.strokeStyle = '#8B4513'; // SaddleBrown
    ctx.stroke();

    // Draw Arrow Head (Steel color)
    ctx.beginPath();
    ctx.moveTo(arrowLen / 2, 0);
    ctx.lineTo(arrowLen / 2 - headLen, -headLen / 2);
    ctx.lineTo(arrowLen / 2 - headLen, headLen / 2);
    ctx.closePath();
    ctx.fillStyle = '#708090'; // SlateGray
    ctx.fill();
    ctx.strokeStyle = '#2F4F4F';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw Fletching (Feathers - Red/White pattern usually, lets go with Red)
    // Top feather
    ctx.beginPath();
    ctx.moveTo(-arrowLen / 2, 0);
    ctx.lineTo(-arrowLen / 2 + 2, -featherHeight);
    ctx.lineTo(-arrowLen / 2 + featherLen, -featherHeight);
    ctx.lineTo(-arrowLen / 2 + featherLen - 2, 0);
    ctx.fillStyle = '#CD5C5C'; // IndianRed
    ctx.fill();

    // Bottom feather
    ctx.beginPath();
    ctx.moveTo(-arrowLen / 2, 0);
    ctx.lineTo(-arrowLen / 2 + 2, featherHeight);
    ctx.lineTo(-arrowLen / 2 + featherLen, featherHeight);
    ctx.lineTo(-arrowLen / 2 + featherLen - 2, 0);
    ctx.fillStyle = '#CD5C5C';
    ctx.fill();

    ctx.restore();

    // Draw Score on Canvas
    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`Score: ${score}`, 20, 50);
    ctx.fillText(`Arrows: ${arrowsLeft}`, 20, 80);

    // Game Over Overlay
    if (!gameActive) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);

        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);

        ctx.font = '18px Arial';
        ctx.fillText('Press SPACE or ENTER to Restart', canvas.width / 2, canvas.height / 2 + 70);

        ctx.textAlign = 'left';
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
