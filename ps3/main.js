let events = [];
let selectedIndex = 0;
let timeoutId = null;

function advanceImage() {
    setSelectedIndex((selectedIndex + 1) % events.length);
}

function resetTimer() {
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
        advanceImage();
        resetTimer(); 
    }, 10000);
}

function setSelectedIndex(index) {
    selectedIndex = index;
    const event = events[index];
    
    document.querySelectorAll('#thumbnails img').forEach(img => {
        img.classList.remove('selected');
    });
    document.getElementById(`thumb-${event.id}`).classList.add('selected');
    
    document.getElementById('selected-image').src = event.image_url;
    const titleElement = document.getElementById('selected-title');
    titleElement.href = event.permalink;
    titleElement.textContent = event.event_title;
    document.getElementById('selected-date').textContent = getReadableTime(event.datetime_start);
    document.getElementById('selected-description').textContent = event.description;
    
    resetTimer();
}

function createThumbnails() {
    const thumbnailsContainer = document.getElementById('thumbnails');
    thumbnailsContainer.innerHTML = ''; 
    
    events.forEach((event, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = event.styled_images.event_thumb;
        thumbnail.id = `thumb-${event.id}`;
        thumbnail.addEventListener('click', () => setSelectedIndex(index));
        if (index === selectedIndex) {
            thumbnail.classList.add('selected');
        }
        thumbnailsContainer.appendChild(thumbnail);
    });
}

function initializeCarousel() {
    getUMEventsWithImages((eventData) => {
        events = eventData;
        createThumbnails();
        setSelectedIndex(0); 
    });
}

document.addEventListener('DOMContentLoaded', initializeCarousel);
