const IMG_WIDTH = 2560;
const IMG_HEIGHT = 1440;
const TIMER_GUESS = '#timer-guess';
const TIMER_SOLUTION = '#timer-solution';
const TIMEOUT_GUESS = 20000;
const TIMEOUT_SOLUTION = 7000;
const IMG_CONTAINER = $('image-display');
const IMG_OVERLAY = $('image-overlay');
const SOLUTION_PADDING = 50;
const SOLUTION_BORDER_SIZE = 7;
const ROOT_ELEM = $(':root')[0];
const COLOR_FG = getComputedStyle(ROOT_ELEM).getPropertyValue('--color-accent');
let images = [];


function set_progress(pbar, value)
{
    value = value < 0 ? 0 : value > 1 ? 1 : value;

    $(pbar).css('--progress', `${value * 100}%`)
}

function wait_progress(pbar, timeout, callback)
{
    set_progress(pbar, 0);

    const start = Date.now()
    const timer = setInterval(function()
    {
        const elapsed = Date.now() - start;

        set_progress(pbar, elapsed / timeout);

        if (elapsed >= timeout)
        {
            clearInterval(timer);
            callback();
        }
    }, 50);
}

function wait_for(condition, callback)
{
    if (condition())
        callback();
    else
    {
        const timer = setInterval(function()
        {
            if (condition())
            {
                clearInterval(timer);
                callback();
            }
        }, 100);
    }
}

function display_image(index)
{
    IMG_CONTAINER.addClass('guessing');
    IMG_CONTAINER.css('background-image', `url('${images[index].path}')`);
    IMG_OVERLAY.css('display', 'none');
    IMG_CONTAINER.fadeIn(300, function() {
        IMG_CONTAINER.css('display', 'block');
        wait_progress(TIMER_GUESS, TIMEOUT_GUESS, function() {
            IMG_CONTAINER.removeClass('guessing');
            IMG_CONTAINER.addClass('solution');
            IMG_OVERLAY.fadeIn(300, function() {
                IMG_OVERLAY.css('display', 'block');
                wait_progress(TIMER_SOLUTION, TIMEOUT_SOLUTION, function() {
                    IMG_CONTAINER.fadeOut(300, function() {
                        set_progress(TIMER_GUESS, 0);
                        set_progress(TIMER_SOLUTION, 0);
                        IMG_CONTAINER.removeClass('solution');
                        IMG_CONTAINER.css('display', 'none');
                    });
                    IMG_OVERLAY.fadeOut(300, function() {
                        IMG_OVERLAY.css('display', 'none');
                    });
                });
            });
        });

        const canvas = document.createElement('canvas');

        canvas.width = IMG_WIDTH;
        canvas.height = IMG_HEIGHT;

        const ctx = canvas.getContext('2d');
        const bbox = images[index].bbox;

        ctx.beginPath();
        ctx.lineWidth = 0;
        ctx.strokeStyle = 'transparent';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.rect(0, 0, IMG_WIDTH, bbox.y - SOLUTION_PADDING);
        ctx.rect(0, bbox.y + bbox.h + SOLUTION_PADDING, IMG_WIDTH, IMG_HEIGHT);
        ctx.rect(0, bbox.y - SOLUTION_PADDING, bbox.x - SOLUTION_PADDING, bbox.h + 2 * SOLUTION_PADDING);
        ctx.rect(bbox.x + bbox.w + SOLUTION_PADDING, bbox.y - SOLUTION_PADDING, IMG_WIDTH, bbox.h + 2 * SOLUTION_PADDING);
        ctx.fill();
        ctx.closePath();
        ctx.beginPath();
        ctx.lineWidth = SOLUTION_BORDER_SIZE;
        ctx.fillStyle = 'transparent';
        ctx.strokeStyle = COLOR_FG;
        ctx.rect(
            bbox.x - SOLUTION_PADDING,
            bbox.y - SOLUTION_PADDING,
            bbox.w + SOLUTION_PADDING * 2,
            bbox.h + SOLUTION_PADDING * 2
        );
        ctx.stroke();

        IMG_OVERLAY.css('background-image', `url('${canvas.toDataURL()}')`);

        canvas.remove();
    });
}



for (const img_index of image_indices)
{
    const name = String(img_index).padStart(9, '0');
    const img_name = `./dataset/${name}.png`;
    const txt_name = `./dataset/${name}.txt`;

    $.ajax({
        url: txt_name,
        success: function(text)
        {
            const cells = text.split(', ');
            const x = parseFloat(cells[1]) * IMG_WIDTH;
            const y = parseFloat(cells[2]) * IMG_HEIGHT;
            const w = parseFloat(cells[3]) * IMG_WIDTH;
            const h = parseFloat(cells[4]) * IMG_HEIGHT;

            images.push({
                path: img_name,
                bbox: {
                    x: x - w * .5,
                    y: y - h * .5,
                    w: w,
                    h: h
                }
            });
        }
    });
}

wait_for(function()
{
    return images.length == image_indices.length;
}, function()
{
    $('image-container').removeClass('loading');

    images = images.sort((a, b) => 0.5 - Math.random());
    let curr_index = 0;

    display_image(curr_index);
    setInterval(function()
    {
        display_image(curr_index = (curr_index + 1) % images.length);
    }, TIMEOUT_GUESS + TIMEOUT_SOLUTION + 1000);
});
