// State
const MAX_IMAGES = 5;
const MIN_IMAGES = 2;
let validImages = []; // Current Deck
let submittedData = {}; // Store submitted items: { cardId: { name, desc, files } }

// DOM Elements
const itemNameInput = document.getElementById('itemName');
const itemDescInput = document.getElementById('itemDesc');
const fileInput = document.getElementById('fileInput');
const deckDiv = document.getElementById('imageDeck');
const countDisplay = document.getElementById('countDisplay');
const finalBtn = document.getElementById('finalBtn');
const valMsg = document.getElementById('validationMsg');
const feedContainer = document.getElementById('feedContainer');

// --- DECK LOGIC ---
function renderDeck() {
    deckDiv.innerHTML = '';
    validImages.forEach((file, index) => {
        const slot = document.createElement('div');
        slot.className = 'slot';

        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);

        const btn = document.createElement('div');
        btn.className = 'remove-btn';
        btn.innerHTML = '×';
        btn.onclick = () => removeImage(index);

        slot.appendChild(img);
        slot.appendChild(btn);
        deckDiv.appendChild(slot);
    });

    // Fill empty slots
    for (let i = validImages.length; i < MAX_IMAGES; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot empty';
        deckDiv.appendChild(slot);
    }

    countDisplay.innerText = `${validImages.length} / ${MAX_IMAGES}`;
    checkForm();
}

function removeImage(index) {
    validImages.splice(index, 1);
    renderDeck();
}

function checkForm() {
    const hasName = itemNameInput.value.trim().length > 0;
    const hasDesc = itemDescInput.value.trim().length > 0;
    const imgCount = validImages.length;

    let msg = "";
    let isValid = false;

    if (!hasName) msg = "Item Name is required.";
    else if (!hasDesc) msg = "Description is required.";
    else if (imgCount < MIN_IMAGES) msg = `Need ${MIN_IMAGES - imgCount} more valid image(s).`;
    else {
        msg = "Ready to Submit!";
        isValid = true;
    }

    valMsg.innerText = msg;
    if (isValid) {
        valMsg.className = "validation-msg valid";
        finalBtn.classList.add('active');
    } else {
        valMsg.className = "validation-msg";
        finalBtn.classList.remove('active');
    }
}

// --- UPLOAD LOGIC ---
function triggerUpload() {
    if (!itemNameInput.value.trim()) { showToast("Enter Item Name first!", "error"); return; }
    if (validImages.length >= MAX_IMAGES) { showToast("Deck is full.", "error"); return; }
    fileInput.click();
}

fileInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    showToast(`Validating ${files.length} images...`, "success");

    const formData = new FormData();
    formData.append('itemName', itemNameInput.value);
    formData.append('itemDescription', itemDescInput.value);
    const remaining = MAX_IMAGES - validImages.length;
    files.slice(0, remaining).forEach(f => formData.append('foodImages', f));

    try {
        const res = await fetch('/api/validate', { method: 'POST', body: formData });
        const data = await res.json();

        data.results.forEach((result, index) => {
            if (result.isValid) {
                validImages.push(files[index]);
                showToast("✅ Image Approved", "success");
            } else {
                showToast(`❌ Rejected: ${result.reason}`, "error");
            }
        });
        renderDeck();
        fileInput.value = "";
    } catch (err) {
        showToast("Server Validation Failed", "error");
    }
});

// --- SUBMIT LOGIC ---
async function submitFinal() {
    finalBtn.innerText = "Processing...";

    const formData = new FormData();
    formData.append('itemName', itemNameInput.value);
    formData.append('itemDescription', itemDescInput.value);
    validImages.forEach(f => formData.append('foodImages', f));

    try {
        const res = await fetch('/api/identify', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
            createCard(itemNameInput.value, itemDescInput.value, [...validImages]);

            // Clear Form
            itemNameInput.value = "";
            itemDescInput.value = "";
            validImages = [];
            renderDeck();
            showToast("Item Added Successfully!", "success");
        }
    } catch(e) {
        showToast("Submission Failed", "error");
    } finally {
        finalBtn.innerText = "Submit Item";
    }
}

// --- CARD & FEED LOGIC (Edit/Delete) ---
function createCard(name, desc, files) {
    const cardId = Date.now();
    // Store data in memory for Editing
    submittedData[cardId] = { name, desc, files };

    const coverImage = URL.createObjectURL(files[0]);

    const cardHTML = `
        <div class="food-card" id="card-${cardId}">
            <div class="card-media">
                <img src="${coverImage}">

                <div class="card-overlay">
                    <div class="action-icon icon-edit" onclick="editItem(${cardId})" title="Edit Item">
                        ✎
                    </div>
                    <div class="action-icon icon-delete" onclick="deleteItem(${cardId})" title="Delete Item">
                        🗑
                    </div>
                </div>
            </div>

            <div class="card-body">
                <div class="card-title">${name}</div>
                <div class="card-desc">${desc}</div>
            </div>
        </div>
    `;
    feedContainer.insertAdjacentHTML('afterbegin', cardHTML);
}

function deleteItem(id) {
    if(confirm("Are you sure you want to delete this item?")) {
        const card = document.getElementById(`card-${id}`);
        card.style.transform = "scale(0.9)";
        card.style.opacity = "0";
        setTimeout(() => {
            card.remove();
            delete submittedData[id]; // Cleanup memory
            showToast("Item deleted", "success");
        }, 200);
    }
}

function editItem(id) {
    const data = submittedData[id];
    if(!data) return;

    // 1. Populate Inputs
    itemNameInput.value = data.name;
    itemDescInput.value = data.desc;

    // 2. Restore Images to Deck
    validImages = [...data.files]; // Copy files back to current deck
    renderDeck();

    // 3. Remove from Feed (it's back in draft now)
    document.getElementById(`card-${id}`).remove();
    delete submittedData[id];

    // 4. Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast("Item moved back to draft for editing", "success");
}

function showToast(msg, type) {
    const area = document.getElementById('toastArea');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = msg;
    area.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// Init
renderDeck();