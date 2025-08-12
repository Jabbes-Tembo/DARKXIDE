// js/app.js

//
// ** 1. PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE **
//
const firebaseConfig = {
  apiKey: "AIzaSyCmAgIYPnGUfdR-cgobR0s-djuy3vYBCS8",
  authDomain: "darkxide-1eb8c.firebaseapp.com",
  projectId: "darkxide-1eb8c",
  storageBucket: "darkxide-1eb8c.appspot.com",
  messagingSenderId: "1020766963405",
  appId: "1:1020766963405:web:c9caf2be218167a4350b84",
  measurementId: "G-8K0RL159KF"
};

//
// ** 2. PASTE YOUR CLOUDINARY DETAILS HERE **
//
const CLOUDINARY_CLOUD_NAME = "dzns7o83d";
const CLOUDINARY_UPLOAD_PRESET = "Merch and music";

// --- INITIALIZE SERVICES ---
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- GLOBAL STATE & CACHE ---
let globalMusicCache = [];
let globalMerchCache = [];
let currentTrackListener = null;
let latestOrderTimestamp = null; // For notification badge

// --- RESPONSIVE NAVIGATION ---
function toggleNav() {
    const navLinks = document.getElementById("nav-links");
    navLinks.classList.toggle("responsive");
}

// --- ADMIN PAGE TAB FUNCTION ---
function openTab(evt, tabName) {
    const tabcontent = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    const tablinks = document.getElementsByClassName("tab-button");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";

    // Logic to "mark as read" for order notifications
    if (tabName === 'orders' && latestOrderTimestamp) {
        localStorage.setItem('lastViewedOrderTimestamp', latestOrderTimestamp.toMillis());
        const badge = document.getElementById('new-order-badge');
        if (badge) {
            badge.style.display = 'none';
        }
    }
}

// --- SHOPPING CART LOGIC ---
function getCart() {
    return JSON.parse(localStorage.getItem('darkxideCart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('darkxideCart', JSON.stringify(cart));
    updateCartCount();
    displayCartItems();
}

function updateCartCount() {
    const cart = getCart();
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    }
}

function addToCart(item, selectedSize, selectedColor) {
    const cart = getCart();
    const variationId = `${item.id}${selectedSize ? `-${selectedSize}` : ''}${selectedColor ? `-${selectedColor}` : ''}`;
    const existingItem = cart.find(cartItem => cartItem.variationId === variationId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        const newItem = {
            ...item,
            variationId: variationId,
            size: selectedSize,
            color: selectedColor,
            quantity: 1
        };
        cart.push(newItem);
    }
    saveCart(cart);
}

function removeFromCart(variationId) {
    let cart = getCart();
    cart = cart.filter(item => item.variationId !== variationId);
    saveCart(cart);
}

function displayCartItems() {
    const cart = getCart();
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total');
    if (!container || !totalEl) return;
    if (cart.length === 0) {
        container.innerHTML = '<p>Your cart is empty.</p>';
        totalEl.textContent = '0.00';
        return;
    }
    let html = '';
    let total = 0;
    cart.forEach(item => {
        const price = typeof item.price === 'number' ? item.price : 0;
        const itemTotal = price * item.quantity;
        total += itemTotal;
        const variationDetails = [];
        if (item.size) variationDetails.push(`Size: ${item.size}`);
        if (item.color) variationDetails.push(`Color: ${item.color}`);
        html += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    ${variationDetails.length > 0 ? `<p class="cart-item-variations">${variationDetails.join(', ')}</p>` : ''}
                    <p>Price: ZMK ${price.toFixed(2)} x ${item.quantity}</p>
                </div>
                <button class="cart-item-remove" data-id="${item.variationId}">&times;</button>
            </div>
        `;
    });
    container.innerHTML = html;
    totalEl.textContent = total.toFixed(2);
}

// --- MODAL AND OTHER CORE LOGIC ---
function initializeModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        const closeBtn = modal.querySelector(".close-btn");
        if (closeBtn) {
            closeBtn.onclick = () => modal.style.display = "none";
        }
    });
    const cartIcon = document.getElementById("cart-icon");
    if (cartIcon) {
        cartIcon.onclick = (e) => {
            e.preventDefault();
            displayCartItems(); // This function already exists and will fill the cart items
            const cartPopup = document.getElementById("cart-checkout-popup"); // Target the new popup
            if (cartPopup) cartPopup.style.display = "flex";
        };
    }
    const emailModalBtn = document.getElementById("email-modal-btn");
    const emailModal = document.getElementById("emailModal");
    if (emailModalBtn && emailModal) {
        emailModalBtn.onclick = () => emailModal.style.display = "flex";
    }
    const donateModalBtn = document.getElementById("donate-modal-btn");
    const donateModal = document.getElementById("donateModal");
    if (donateModalBtn && donateModal) {
        donateModalBtn.onclick = () => donateModal.style.display = "flex";
    }
    window.onclick = function (event) {
        modals.forEach(modal => {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        });
    }
}
function openGalleryModal(item) { const modal = document.getElementById('galleryModal'); if (!modal) return; const titleEl = document.getElementById('gallery-modal-title'); const mainImageContainer = document.getElementById('gallery-carousel-main-image-container'); const thumbnailsContainer = document.getElementById('gallery-carousel-thumbnails-container'); const allImages = item.imageUrls || [item.secure_url]; let currentImageIndex = 0; titleEl.textContent = item.title; function showImage(index) { mainImageContainer.innerHTML = `<img src="${allImages[index]}" alt="Gallery image ${index + 1}">`; document.querySelectorAll('#gallery-carousel-thumbnails-container .carousel-thumbnail').forEach((thumb, thumbIndex) => { thumb.classList.toggle('active', thumbIndex === index); }); currentImageIndex = index; } thumbnailsContainer.innerHTML = allImages.map((imgUrl, index) => `<img src="${imgUrl}" class="carousel-thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">`).join(''); thumbnailsContainer.onclick = (e) => { if (e.target.classList.contains('carousel-thumbnail')) { showImage(parseInt(e.target.dataset.index, 10)); } }; modal.querySelector('.carousel-prev').onclick = () => { showImage((currentImageIndex - 1 + allImages.length) % allImages.length); }; modal.querySelector('.carousel-next').onclick = () => { showImage((currentImageIndex + 1) % allImages.length); }; showImage(0); modal.style.display = 'flex'; }
function formatTime(seconds) { if (isNaN(seconds)) return '0:00'; const minutes = Math.floor(seconds / 60); const secs = Math.floor(seconds % 60); return `${minutes}:${secs < 10 ? '0' : ''}${secs}`; }
let persistentPlaylist = []; let currentTrackIndex = -1; let isPlaying = false; let repeatState = 0; let isShuffle = false; const persistentPlayer = document.getElementById('persistent-audio-player'); const floatingPlayer = document.getElementById('floating-record-player'); const recordArt = document.getElementById('record-art'); function savePlayerState() { if (persistentPlayer && persistentPlaylist.length > 0 && currentTrackIndex > -1) { localStorage.setItem('darkxidePlayerState', JSON.stringify({ playlist: persistentPlaylist, currentTrackIndex: currentTrackIndex, currentTime: persistentPlayer.currentTime, isPlaying: !persistentPlayer.paused && persistentPlayer.duration > 0, repeatState: repeatState, isShuffle: isShuffle })); } }

// js/app.js

// --- REFINED: Media Session API Integration ---
function updateMediaSession(track) {
    if ('mediaSession' in navigator) {
        if (!track) {
            navigator.mediaSession.metadata = null;
            navigator.mediaSession.playbackState = 'none';
            navigator.mediaSession.setActionHandler('play', null);
            navigator.mediaSession.setActionHandler('pause', null);
            navigator.mediaSession.setActionHandler('previoustrack', null);
            navigator.mediaSession.setActionHandler('nexttrack', null);
            return;
        }

        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.artist,
            album: 'DarkXide Music',
            artwork: [ // Using multiple sizes is more robust for different devices
                { src: track.thumbnail_url, sizes: '96x96', type: 'image/png' },
                { src: track.thumbnail_url, sizes: '128x128', type: 'image/png' },
                { src: track.thumbnail_url, sizes: '192x192', type: 'image/png' },
                { src: track.thumbnail_url, sizes: '256x256', type: 'image/png' },
                { src: track.thumbnail_url, sizes: '384x384', type: 'image/png' },
                { src: track.thumbnail_url, sizes: '512x512', type: 'image/png' },
            ]
        });

        navigator.mediaSession.setActionHandler('play', playPersistentAudio);
        navigator.mediaSession.setActionHandler('pause', pausePersistentAudio);
        navigator.mediaSession.setActionHandler('previoustrack', playPrevPersistent);
        navigator.mediaSession.setActionHandler('nexttrack', playNextPersistent);
    }
}

async function loadPlayerState() { const state = JSON.parse(localStorage.getItem('darkxidePlayerState')); if (!state || !persistentPlayer) return; persistentPlaylist = state.playlist || []; currentTrackIndex = state.currentTrackIndex || 0; repeatState = state.repeatState || 0; isShuffle = state.isShuffle || false; const track = persistentPlaylist[currentTrackIndex]; if (track && track.secure_url) { persistentPlayer.src = track.secure_url; const restoreStateHandler = () => { persistentPlayer.currentTime = state.currentTime || 0; if (state.isPlaying) { playPersistentAudio(); } else { updateAllUI(); } persistentPlayer.removeEventListener('loadedmetadata', restoreStateHandler); }; persistentPlayer.addEventListener('loadedmetadata', restoreStateHandler); setupTrackListener(track.id); } else { updateAllUI(); } }
function updateAllUI() { updateFloatingPlayerUI(); updateMusicCardsUI(); if (document.body.id === 'player-page') { const syncPagePlayerUI = window.syncPagePlayerUI; if (typeof syncPagePlayerUI === 'function') { syncPagePlayerUI(); } } }
function updateFloatingPlayerUI() { if (document.body.id === 'player-page') { if (floatingPlayer) floatingPlayer.classList.remove('visible'); return; } if (currentTrackIndex === -1 || !persistentPlaylist[currentTrackIndex]) { if (floatingPlayer) floatingPlayer.classList.remove('visible'); return; } const track = persistentPlaylist[currentTrackIndex]; if (recordArt) recordArt.src = track.thumbnail_url || 'https://via.placeholder.com/80'; if (floatingPlayer) floatingPlayer.classList.add('visible'); if (recordArt) recordArt.style.animationPlayState = isPlaying ? 'running' : 'paused'; }
function updateMusicCardsUI() { document.querySelectorAll('.music-card').forEach(card => { const trackId = card.dataset.id; const currentTrack = persistentPlaylist[currentTrackIndex]; if (currentTrack && trackId === currentTrack.id) { card.classList.toggle('is-playing', isPlaying); } else { card.classList.remove('is-playing'); } }); }
function setupTrackListener(trackId) { if (currentTrackListener) { currentTrackListener(); } if (trackId) { currentTrackListener = db.collection('music').doc(trackId).onSnapshot(doc => { if (doc.exists) { const updatedData = doc.data(); const indexInPlaylist = persistentPlaylist.findIndex(t => t.id === trackId); if (indexInPlaylist > -1) { persistentPlaylist[indexInPlaylist] = { ...persistentPlaylist[indexInPlaylist], ...updatedData }; if (indexInPlaylist === currentTrackIndex) { updateAllUI(); } } } }, err => { console.error("Error with real-time listener:", err); }); } }

function loadTrackInPersistentPlayer(index, autoplay = true) {
    if (index < 0 || index >= persistentPlaylist.length) {
        isPlaying = false;
        updateAllUI();
        updateMediaSession(null); // UPDATED: Clear media session
        return;
    }
    currentTrackIndex = index;
    const track = persistentPlaylist[index];
    if (!track || !track.secure_url || !persistentPlayer) return;
    
    updateMediaSession(track); // UPDATED: Set media session metadata

    persistentPlayer.currentTime = 0;
    persistentPlayer.src = track.secure_url;
    persistentPlayer.oncanplay = () => {
        if (autoplay) {
            playPersistentAudio();
        }
        updateAllUI();
    };
    persistentPlayer.onerror = () => console.error("Error loading track:", persistentPlayer.error);
    setupTrackListener(track.id);
}

function playPersistentAudio() {
    if (!persistentPlayer) return;
    if (!persistentPlayer.src || persistentPlayer.src === window.location.href) {
        if (persistentPlaylist.length > 0) {
            loadTrackInPersistentPlayer(currentTrackIndex > -1 ? currentTrackIndex : 0, true);
        }
        return;
    }
    const playPromise = persistentPlayer.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            isPlaying = true;
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'; // UPDATED
            updateAllUI();
        }).catch(error => {
            isPlaying = false;
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'; // UPDATED
            updateAllUI();
        });
    }
}

function pausePersistentAudio() {
    if (persistentPlayer) persistentPlayer.pause();
    isPlaying = false;
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'; // UPDATED
    updateAllUI();
}

function playNextPersistent() { if (persistentPlaylist.length === 0) return; let nextIndex = (currentTrackIndex + 1) % persistentPlaylist.length; loadTrackInPersistentPlayer(nextIndex); }
function playPrevPersistent() { if (persistentPlaylist.length === 0) return; let prevIndex = (currentTrackIndex - 1 + persistentPlaylist.length) % persistentPlaylist.length; loadTrackInPersistentPlayer(prevIndex); }

function handleTrackEnded() {
    if (!persistentPlayer) return;
    if (repeatState === 2) {
        persistentPlayer.currentTime = 0;
        playPersistentAudio();
        return;
    }
    const nextIndex = (currentTrackIndex + 1);
    if (nextIndex < persistentPlaylist.length) {
        loadTrackInPersistentPlayer(nextIndex);
    } else {
        if (repeatState === 1) {
            loadTrackInPersistentPlayer(0);
        } else {
            isPlaying = false;
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'; // UPDATED
            if (persistentPlayer) persistentPlayer.currentTime = 0;
            updateAllUI();
        }
    }
}

function initializePersistentPlayerControls() { if (floatingPlayer) { floatingPlayer.addEventListener('click', () => { if (currentTrackIndex > -1) { window.location.href = 'player.html'; } }); } if (persistentPlayer) { persistentPlayer.addEventListener('ended', handleTrackEnded); persistentPlayer.addEventListener('play', () => { isPlaying = true; updateAllUI(); }); persistentPlayer.addEventListener('pause', () => { isPlaying = false; updateAllUI(); }); persistentPlayer.addEventListener('timeupdate', () => { if (document.body.id === 'player-page' && typeof window.syncPagePlayerUI === 'function') { window.syncPagePlayerUI(); } }); } window.addEventListener('beforeunload', savePlayerState); }
async function fetchAllMusic() { if (globalMusicCache.length > 0) return globalMusicCache; try { const snapshot = await db.collection('music').orderBy('createdAt', 'desc').get(); globalMusicCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); return globalMusicCache; } catch (error) { console.error("Error fetching music:", error); return []; } }
async function fetchAllMerch() { if (globalMerchCache.length > 0) return globalMerchCache; try { const snapshot = await db.collection('merchandise').orderBy('createdAt', 'desc').get(); globalMerchCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); return globalMerchCache; } catch (error) { console.error("Error fetching merch:", error); return []; } }
function shufflePlaylist(playlist, firstTrackId) { let array = [...playlist]; let firstTrackIndex = -1; if (firstTrackId) { firstTrackIndex = array.findIndex(track => track.id === firstTrackId); } const firstTrack = firstTrackIndex !== -1 ? array.splice(firstTrackIndex, 1)[0] : null; for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[array[i], array[j]] = [array[j], array[i]]; } if (firstTrack) { array.unshift(firstTrack); } return array; }
async function handleCardPlayButtonClick(trackId) { const currentTrack = persistentPlaylist[currentTrackIndex]; if (isPlaying && currentTrack && currentTrack.id === trackId) { pausePersistentAudio(); return; } if (currentTrack && currentTrack.id === trackId && !isPlaying) { playPersistentAudio(); return; } const allMusic = await fetchAllMusic(); if (isShuffle) { persistentPlaylist = shufflePlaylist(allMusic, trackId); } else { persistentPlaylist = allMusic; } const trackIndex = persistentPlaylist.findIndex(track => track.id === trackId); if (trackIndex !== -1) { loadTrackInPersistentPlayer(trackIndex, true); } }
async function handleCardNavigation(trackId) { await handleCardPlayButtonClick(trackId); window.location.href = 'player.html'; }
function initializePlayerPage() { const playPauseBtn = document.getElementById('play-pause-btn'); const nextBtn = document.getElementById('next-btn'); const prevBtn = document.getElementById('prev-btn'); const progressBarContainer = document.getElementById('progress-bar-container'); const shuffleBtn = document.getElementById('shuffle-btn'); const repeatBtn = document.getElementById('repeat-btn'); function renderPlaylist() { const container = document.getElementById('playlist-items'); if (!container) return; if (persistentPlaylist.length === 0) { container.innerHTML = '<p style="color: #fff; opacity: 0.7;">No playlist loaded.</p>'; return; } let html = ''; persistentPlaylist.forEach((track, index) => { const isCurrentlyPlaying = index === currentTrackIndex; html += `<div class="playlist-item ${isCurrentlyPlaying ? 'is-playing' : ''}" data-index="${index}"><img src="${track.thumbnail_url || 'https://via.placeholder.com/50'}" alt="${track.title}"><div class="playlist-item-info"><strong>${track.title}</strong><span>${track.artist}</span></div>${isCurrentlyPlaying ? '<i class="fas fa-volume-up play-indicator"></i>' : ''}</div>`; }); container.innerHTML = html; document.querySelectorAll('.playlist-item').forEach(item => { item.addEventListener('click', (e) => { const indexToPlay = parseInt(e.currentTarget.dataset.index, 10); loadTrackInPersistentPlayer(indexToPlay, true); }); }); } function renderTrackInfo() { const container = document.getElementById('track-info-content'); if (!container || currentTrackIndex === -1 || !persistentPlaylist[currentTrackIndex]) { if (container) container.innerHTML = '<p style="color: #fff; opacity: 0.7;">No track info available.</p>'; return; }; const track = persistentPlaylist[currentTrackIndex]; container.innerHTML = `<div><strong>RELEASED</strong><span>${track.releaseDate || 'N/A'}</span></div><div><strong>PRODUCER</strong><span>${track.producer || 'N/A'}</span></div><div><strong>COMPOSERS</strong><span>${track.composers || 'N/A'}</span></div>`; } window.syncPagePlayerUI = function () { if (!persistentPlayer) return; if (currentTrackIndex > -1 && persistentPlaylist[currentTrackIndex]) { const track = persistentPlaylist[currentTrackIndex]; document.getElementById('player-album-art').src = track.thumbnail_url || 'https://via.placeholder.com/300'; document.getElementById('player-title').textContent = track.title; document.getElementById('player-artist').textContent = track.artist; const duration = persistentPlayer.duration; const currentTime = persistentPlayer.currentTime; if (!isNaN(duration)) { document.getElementById('total-duration').textContent = formatTime(duration); document.getElementById('progress-bar').style.width = `${(currentTime / duration) * 100}%`; } document.getElementById('current-time').textContent = formatTime(currentTime); playPauseBtn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';[playPauseBtn, nextBtn, prevBtn, shuffleBtn, repeatBtn].forEach(btn => btn.disabled = false); } else { document.getElementById('player-title').textContent = "No Music Loaded"; document.getElementById('player-artist').textContent = "Select a track from the music page";[playPauseBtn, nextBtn, prevBtn, shuffleBtn, repeatBtn].forEach(btn => btn.disabled = true); } shuffleBtn.classList.toggle('active', isShuffle); repeatBtn.classList.remove('active', 'repeat-one'); if (repeatState === 1) repeatBtn.classList.add('active'); if (repeatState === 2) repeatBtn.classList.add('active', 'repeat-one'); renderPlaylist(); renderTrackInfo(); }; playPauseBtn.onclick = () => { if (isPlaying) pausePersistentAudio(); else playPersistentAudio(); }; nextBtn.onclick = playNextPersistent; prevBtn.onclick = playPrevPersistent; shuffleBtn.onclick = () => { isShuffle = !isShuffle; if (isShuffle && globalMusicCache.length > 0) { const currentTrackId = persistentPlaylist[currentTrackIndex]?.id; persistentPlaylist = shufflePlaylist(globalMusicCache, currentTrackId); const newIndex = persistentPlaylist.findIndex(t => t.id === currentTrackId); currentTrackIndex = newIndex > -1 ? newIndex : 0; } else { const currentTrackId = persistentPlaylist[currentTrackIndex]?.id; persistentPlaylist = globalMusicCache; const newIndex = persistentPlaylist.findIndex(t => t.id === currentTrackId); currentTrackIndex = newIndex > -1 ? newIndex : 0; } updateAllUI(); }; repeatBtn.onclick = () => { repeatState = (repeatState + 1) % 3; updateAllUI(); }; function handleTimeUpdate(e) { if (!persistentPlayer || isNaN(persistentPlayer.duration)) return; const rect = progressBarContainer.getBoundingClientRect(); const touch = e.touches ? e.touches[0] : e; let positionX = touch.clientX - rect.left; const barWidth = progressBarContainer.clientWidth; positionX = Math.max(0, Math.min(barWidth, positionX)); const percent = positionX / barWidth; persistentPlayer.currentTime = percent * persistentPlayer.duration; updateAllUI(); } progressBarContainer.addEventListener('click', handleTimeUpdate); progressBarContainer.addEventListener('touchstart', (e) => { e.preventDefault(); handleTimeUpdate(e); }); progressBarContainer.addEventListener('touchmove', (e) => { e.preventDefault(); handleTimeUpdate(e); }); window.syncPagePlayerUI(); }

// --- GLOBAL CLICK HANDLER ---
document.addEventListener('click', async function(e) {
    const addToCartBtn = e.target.closest('.add-to-cart-btn');
    if (addToCartBtn && !addToCartBtn.closest('form')) {
        const card = addToCartBtn.closest('.merch-card-new-style');
        const item = { id: card.dataset.id, name: card.dataset.name, price: parseFloat(card.dataset.price), image: card.dataset.image };
        const sizeSelector = card.querySelector('.size-selector');
        const colorSelector = card.querySelector('.color-selector');
        if (sizeSelector && !sizeSelector.value) { alert('Please select a size.'); return; }
        if (colorSelector && !colorSelector.value) { alert('Please select a color.'); return; }
        const selectedSize = sizeSelector ? sizeSelector.value : null;
        const selectedColor = colorSelector ? colorSelector.value : null;
        addToCart(item, selectedSize, selectedColor);
        return;
    }
    const playBtn = e.target.closest('.card-play-button');
    if (playBtn) { e.stopPropagation(); const trackId = playBtn.dataset.id; await handleCardPlayButtonClick(trackId); return; }
    const musicCard = e.target.closest('.music-card');
    if (musicCard && !e.target.closest('.card-play-button')) { const trackId = musicCard.dataset.id; await handleCardNavigation(trackId); return; }
    const galleryCard = e.target.closest('.gallery-card');
    if (galleryCard) { const itemData = JSON.parse(galleryCard.dataset.item); openGalleryModal(itemData); return; }
    const merchCardImage = e.target.closest('.merch-image-wrapper-new');
    if (merchCardImage) { const card = merchCardImage.closest('.merch-card-new-style'); const itemId = card.dataset.id; const itemData = globalMerchCache.find(item => item.id === itemId); if (itemData) { openProductGalleryModal(itemData); } return; }
    if (e.target.matches('.cart-item-remove')) { removeFromCart(e.target.dataset.id); }
    else if (e.target.matches('.edit-btn')) { const id = e.target.dataset.id; const collection = e.target.dataset.collection; const itemData = JSON.parse(e.target.dataset.item); handleEdit(id, collection, itemData); }
    else if (e.target.matches('.edit-gallery-delete-btn')) { const itemElement = e.target.closest('.edit-gallery-item'); itemElement.style.display = 'none'; itemElement.dataset.deleted = 'true'; }
});

// --- ROUTING & PAGE LOADERS ---
window.addEventListener('DOMContentLoaded', async () => {
    updateCartCount();
    initializeModals();
    initializePersistentPlayerControls();
    
    if (typeof initializeCheckout === 'function') {
        initializeCheckout(db);
    }

    await fetchAllMusic();
    await fetchAllMerch();
    if (persistentPlayer) {
        await loadPlayerState();
    }

    const path = window.location.pathname;

    if (document.body.id === 'homepage') {
        loadHomepageContent();
    } else if (path.includes('music.html')) {
        loadMusicPage();
    } else if (path.includes('merch.html')) {
        loadMerchPage();
    } else if (path.includes('gallery.html')) {
        loadGalleryPage();
    } else if (path.includes('player.html')) {
        initializePlayerPage();
    } else if (path.includes('admin.html')) {
        loadAdminLists();
        loadOrders();
        const exportBtn = document.getElementById('export-sales-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportSalesToCsv);
        }
        const editForm = document.getElementById('edit-form');
        if(editForm) editForm.addEventListener('submit', handleUpdate);
    } else if (document.body.id === 'about-page') {
        const emailForm = document.getElementById('email-form');
        if (emailForm) { emailForm.addEventListener('submit', (e) => { e.preventDefault(); alert('Thank you for your message!'); document.getElementById('emailModal').style.display = 'none'; }); }
        const donateForm = document.getElementById('donate-form');
        if (donateForm) { donateForm.addEventListener('submit', (e) => { e.preventDefault(); alert('Thank you for your donation!'); document.getElementById('donateModal').style.display = 'none'; }); }
    }
});

// --- RENDERERS & ADMIN LOGIC ---
function renderNewMerchCard(item) { const sizes = item.sizes || []; const colors = item.colors || []; let sizeSelectorHtml = ''; if (sizes.length > 0) { sizeSelectorHtml = `<select class="size-selector" required><option value="" disabled selected>SIZE</option>${sizes.map(size => `<option value="${size}">${size}</option>`).join('')}</select>`; } let colorSelectorHtml = ''; if (colors.length > 0) { colorSelectorHtml = `<select class="color-selector" required><option value="" disabled selected>COLOR</option>${colors.map(color => `<option value="${color}">${color}</option>`).join('')}</select>`; } return `<div class="merch-card-new-style" data-id="${item.id}" data-name="${item.name}" data-price="${item.price}" data-image="${item.secure_url}"><div class="merch-image-wrapper-new"><img src="${item.secure_url}" alt="${item.name}"></div><div class="merch-info-new"><h3>${item.name}</h3><p class="price">ZMK${item.price.toFixed(2)}</p><div class="merch-variations">${sizeSelectorHtml}${colorSelectorHtml}</div><button class="add-to-cart-btn">Add to Cart</button></div></div>`; }
function renderMusicCards(musicList, container) { if (!container) return; let html = ''; musicList.forEach(track => { const thumbnailUrl = track.thumbnail_url || 'https://via.placeholder.com/300?text=No+Image'; const isCurrentlyPlaying = isPlaying && currentTrackIndex > -1 && persistentPlaylist[currentTrackIndex]?.id === track.id; html += `<div class="music-card ${isCurrentlyPlaying ? 'is-playing' : ''}" data-id="${track.id}"><div class="card-image-wrapper"><img src="${thumbnailUrl}" alt="${track.title}" loading="lazy"><div class="card-image-overlay"></div><button class="card-play-button" data-id="${track.id}" aria-label="Play ${track.title}"><i class="fas fa-play"></i><i class="fas fa-pause"></i></button></div><div class="card-info"><h4>${track.title}</h4><p>${track.artist}</p></div></div>`; }); const emptyMessage = container.id === 'homepage-music-container' ? '<p>No music uploaded yet.</p>' : '<h2 style="color: white; grid-column: 1 / -1;">No matching music found.</h2>'; container.innerHTML = musicList.length === 0 ? emptyMessage : html; }
function loadHomepageContent() { const musicContainer = document.getElementById('homepage-music-container'); const merchContainer = document.getElementById('homepage-merch-container'); if (musicContainer) { renderMusicCards(globalMusicCache.slice(0, 5), musicContainer); } if (merchContainer) { const merchList = globalMerchCache.slice(0, 4); let html = ''; merchList.forEach(item => { html += renderNewMerchCard(item); }); merchContainer.innerHTML = merchList.length === 0 ? '<p>No merchandise available.</p>' : html; } }
function loadMusicPage() { const container = document.getElementById('content-area'); if (!container) return; container.innerHTML = '<h2>Loading Music...</h2>'; renderMusicCards(globalMusicCache, container); const searchInput = document.getElementById('music-search-input'); if (searchInput) { searchInput.addEventListener('keyup', () => { const searchTerm = searchInput.value.toLowerCase().trim(); const filteredMusic = globalMusicCache.filter(track => track.title.toLowerCase().includes(searchTerm) || track.artist.toLowerCase().includes(searchTerm)); renderMusicCards(filteredMusic, container); }); } }
function loadMerchPage() { const container = document.getElementById('content-area'); if (!container) return; container.innerHTML = '<h2>Loading Merch...</h2>'; const renderItems = (items) => { let html = ''; items.forEach(item => { html += renderNewMerchCard(item); }); container.innerHTML = items.length === 0 ? '<h2>No products found.</h2>' : html; }; renderItems(globalMerchCache); const searchInput = document.getElementById('merch-search-input'); if (searchInput) { searchInput.addEventListener('keyup', () => { const searchTerm = searchInput.value.toLowerCase().trim(); const filteredMerch = globalMerchCache.filter(item => item.name.toLowerCase().includes(searchTerm)); renderItems(filteredMerch); }); } }
async function loadGalleryPage() { const container = document.getElementById('content-area'); if (!container) return; container.innerHTML = '<h2>Loading Gallery...</h2>'; try { const snapshot = await db.collection('gallery').orderBy('createdAt', 'desc').get(); let html = ''; snapshot.forEach(doc => { const photo = { id: doc.id, ...doc.data() }; const itemDataString = JSON.stringify(photo).replace(/'/g, "&apos;"); const thumbnailUrl = photo.thumbnail_url || photo.secure_url || (photo.imageUrls && photo.imageUrls[0]); html += `<div class="card gallery-card" data-item='${itemDataString}'><img src="${thumbnailUrl}" alt="${photo.title}"><div class="card-content"><p>${photo.title}</p></div></div>`; }); container.innerHTML = snapshot.empty ? '<h2>No photos in the gallery yet.</h2>' : html; } catch (error) { console.error("Failed to load gallery:", error); container.innerHTML = '<h2>Failed to load gallery. Please try again later.</h2>'; } }
function openProductGalleryModal(item) { const modal = document.getElementById('product-gallery-modal'); if (!modal) return; const mainImageContainer = document.getElementById('carousel-main-image-container'); const thumbnailsContainer = document.getElementById('carousel-thumbnails-container'); const allImages = [item.secure_url, ...(item.galleryImageUrls || [])]; let currentImageIndex = 0; function showImage(index) { mainImageContainer.innerHTML = `<img src="${allImages[index]}" alt="Product image ${index + 1}">`; document.querySelectorAll('#product-gallery-modal .carousel-thumbnail').forEach((thumb, thumbIndex) => { thumb.classList.toggle('active', thumbIndex === index); }); currentImageIndex = index; } thumbnailsContainer.innerHTML = allImages.map((imgUrl, index) => `<img src="${imgUrl}" class="carousel-thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">`).join(''); thumbnailsContainer.addEventListener('click', (e) => { if (e.target.classList.contains('carousel-thumbnail')) { const index = parseInt(e.target.dataset.index, 10); showImage(index); } }); modal.querySelector('.carousel-prev').onclick = () => { const newIndex = (currentImageIndex - 1 + allImages.length) % allImages.length; showImage(newIndex); }; modal.querySelector('.carousel-next').onclick = () => { const newIndex = (currentImageIndex + 1) % allImages.length; showImage(newIndex); }; showImage(0); modal.style.display = 'flex'; }
function loadOrders() {
    const container = document.getElementById('orders-list');
    const badge = document.getElementById('new-order-badge');
    if (!container) return;
    db.collection('orders').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        if (snapshot.empty) { container.innerHTML = '<p>No orders have been placed yet.</p>'; return; }
        const lastViewedTimestamp = parseInt(localStorage.getItem('lastViewedOrderTimestamp'), 10) || 0;
        let newOrderCount = 0;
        if (!snapshot.metadata.hasPendingWrites && snapshot.docs.length > 0) {
            latestOrderTimestamp = snapshot.docs[0].data().createdAt;
            snapshot.forEach(doc => {
                const order = doc.data();
                if (order.createdAt && order.createdAt.toMillis() > lastViewedTimestamp) { newOrderCount++; }
            });
        }
        if (badge && newOrderCount > 0) { badge.textContent = newOrderCount; badge.style.display = 'flex'; } else if (badge) { badge.style.display = 'none'; }
        let html = '';
        snapshot.forEach(doc => {
            const order = doc.data();
            const orderDate = order.createdAt ? order.createdAt.toDate().toLocaleString() : 'N/A';
            const itemsHtml = order.items.map(item => `<li><img src="${item.image}" alt="${item.name}" class="order-item-thumbnail"><span>${item.name} <strong>(x${item.quantity})</strong>${item.size ? ` - ${item.size}`:''}${item.color ? ` - ${item.color}`:''}</span></li>`).join('');
            html += `<div class="order-item"><div class="order-header"><span class="order-date">${orderDate}</span><span class="order-total">Total: ZMK ${order.totalAmount.toFixed(2)}</span></div><div class="order-customer"><strong>Customer:</strong> ${order.customerName} (${order.customerEmail})</div><div class="order-details"><strong>Items:</strong><ul>${itemsHtml}</ul></div></div>`;
        });
        container.innerHTML = html;
    }, error => {
        console.error("Error fetching orders: ", error);
        container.innerHTML = '<p>Error loading orders. Please check console.</p>';
    });
}
async function exportSalesToCsv() {
    console.log('Exporting sales...');
    const button = document.getElementById('export-sales-btn');
    button.disabled = true;
    button.textContent = 'Exporting...';

    try {
        const querySnapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
        if (querySnapshot.empty) {
            alert('No sales data to export.');
            return;
        }

        let csvContent = "Date,Customer Name,Customer Email,Item Name,Size,Color,Quantity,Price,Order Total\n";
        
        const escapeCsvCell = (cell) => {
            const strCell = String(cell === null || cell === undefined ? '' : cell);
            if (strCell.includes(',') || strCell.includes('"') || strCell.includes('\n')) {
                return `"${strCell.replace(/"/g, '""')}"`;
            }
            return strCell;
        };

        querySnapshot.forEach(doc => {
            const order = doc.data();
            const orderDate = order.createdAt ? order.createdAt.toDate().toISOString() : '';
            
            order.items.forEach(item => {
                const itemPrice = typeof item.price === 'number' ? item.price.toFixed(2) : '0.00';
                const orderTotal = typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : '0.00';

                const row = [
                    orderDate,
                    order.customerName,
                    order.customerEmail,
                    item.name,
                    item.size || '',
                    item.color || '',
                    item.quantity,
                    itemPrice,
                    orderTotal
                ];
                csvContent += row.map(escapeCsvCell).join(',') + "\n";
            });
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            const date = new Date().toISOString().split('T')[0];
            link.setAttribute("href", url);
            link.setAttribute("download", `darkxide_sales_${date}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

    } catch (error) {
        console.error('Error exporting sales:', error);
        alert('Could not export sales data. See console for details.');
    } finally {
        button.disabled = false;
        button.textContent = 'Export to CSV';
    }
}
async function uploadToCloudinary(file, resourceType) { const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET); const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`; const response = await fetch(url, { method: 'POST', body: formData }); if (!response.ok) throw new Error('Cloudinary upload failed.'); return await response.json(); }
function loadAdminLists() { const musicContainer = document.getElementById('admin-music-list'); const merchContainer = document.getElementById('admin-merch-list'); const galleryContainer = document.getElementById('admin-gallery-list'); if (musicContainer) { db.collection('music').orderBy('createdAt', 'desc').onSnapshot(snapshot => { let html = ''; snapshot.forEach(doc => { const track = { id: doc.id, ...doc.data() }; const itemData = JSON.stringify(track).replace(/'/g, "&apos;"); html += `<div class="manage-item-detailed"><div class="manage-item-info"><img src="${track.thumbnail_url || 'https://via.placeholder.com/80'}" alt="${track.title}" class="manage-item-thumbnail"><div class="manage-item-details"><strong>${track.title}</strong><span>Artist: ${track.artist}</span></div></div><div class="manage-item-actions"><button class="action-btn edit-btn" data-id="${doc.id}" data-collection="music" data-item='${itemData}'>Edit</button><button class="action-btn delete-btn" onclick="handleDelete('${doc.id}', 'music')">Delete</button></div></div>`; }); musicContainer.innerHTML = snapshot.empty ? '<p>No music.</p>' : html; }); } if (merchContainer) { db.collection('merchandise').orderBy('createdAt', 'desc').onSnapshot(snapshot => { let html = ''; snapshot.forEach(doc => { const item = { id: doc.id, ...doc.data() }; const itemData = JSON.stringify(item).replace(/'/g, "&apos;"); html += `<div class="manage-item-detailed"><div class="manage-item-info"><img src="${item.secure_url || 'https://via.placeholder.com/80'}" alt="${item.name}" class="manage-item-thumbnail"><div class="manage-item-details"><strong>${item.name}</strong><span>Price: ZMK${item.price.toFixed(2)}</span></div></div><div class="manage-item-actions"><button class="action-btn edit-btn" data-id="${doc.id}" data-collection="merchandise" data-item='${itemData}'>Edit</button><button class="action-btn delete-btn" onclick="handleDelete('${doc.id}', 'merchandise')">Delete</button></div></div>`; }); merchContainer.innerHTML = snapshot.empty ? '<p>No merch.</p>' : html; }); } if (galleryContainer) { db.collection('gallery').orderBy('createdAt', 'desc').onSnapshot(snapshot => { let html = ''; snapshot.forEach(doc => { const photo = { id: doc.id, ...doc.data() }; const itemData = JSON.stringify(photo).replace(/'/g, "&apos;"); const thumbnailUrl = photo.thumbnail_url || photo.secure_url || (photo.imageUrls && photo.imageUrls[0]); html += `<div class="manage-item-detailed"><div class="manage-item-info"><img src="${thumbnailUrl}" alt="${photo.title}" class="manage-item-thumbnail"><div class="manage-item-details"><strong>${photo.title}</strong></div></div><div class="manage-item-actions"><button class="action-btn edit-btn" data-id="${doc.id}" data-collection="gallery" data-item='${itemData}'>Edit</button><button class="action-btn delete-btn" onclick="handleDelete('${doc.id}', 'gallery')">Delete</button></div></div>`; }); galleryContainer.innerHTML = snapshot.empty ? '<p>No photos.</p>' : html; }); } }
function handleEdit(id, collection, itemData) { const modal = document.getElementById('editModal'); const fieldsContainer = document.getElementById('edit-fields'); const form = document.getElementById('edit-form'); fieldsContainer.innerHTML = ''; form.dataset.id = id; form.dataset.collection = collection; let contentHtml = ''; if (collection === 'music') { contentHtml = `<div class="edit-section"><h4>Track Details</h4><label for="edit-music-title">Track Title</label><input type="text" id="edit-music-title" value="${itemData.title || ''}" required><label for="edit-music-artist">Artist Name</label><input type="text" id="edit-music-artist" value="${itemData.artist || ''}" required><label for="edit-music-release-date">Release Date</label><input type="date" id="edit-music-release-date" value="${itemData.releaseDate || ''}"><label for="edit-music-producer">Producer(s)</label><input type="text" id="edit-music-producer" value="${itemData.producer || ''}"><label for="edit-music-composers">Composer(s)</label><input type="text" id="edit-music-composers" value="${itemData.composers || ''}"></div><div class="edit-section"><h4>Track Thumbnail</h4><img src="${itemData.thumbnail_url}" alt="Current Thumbnail" class="edit-image-preview"><label for="edit-music-image">Replace Thumbnail (optional)</label><input type="file" id="edit-music-image" accept="image/*"></div><div class="edit-section"><h4>Audio File</h4><audio controls src="${itemData.secure_url}" class="edit-audio-preview"></audio><label for="edit-music-file">Replace Audio File (optional)</label><input type="file" id="edit-music-file" accept="audio/*"></div>`; } else if (collection === 'merchandise') { const galleryImages = itemData.galleryImageUrls || []; const galleryGridHtml = galleryImages.map(url => `<div class="edit-gallery-item" data-url="${url}"><img src="${url}" alt="Gallery image"><button type="button" class="edit-gallery-delete-btn">&times;</button></div>`).join(''); contentHtml = `<div class="edit-section"><h4>Product Details</h4><label for="edit-merch-name">Product Name</label><input type="text" id="edit-merch-name" value="${itemData.name}" required><label for="edit-merch-price">Price</label><input type="number" id="edit-merch-price" value="${itemData.price}" step="0.01" required><label for="edit-merch-sizes">Available Sizes (comma-separated)</label><input type="text" id="edit-merch-sizes" value="${(itemData.sizes || []).join(',')}"><label for="edit-merch-colors">Available Colors (comma-separated)</label><input type="text" id="edit-merch-colors" value="${(itemData.colors || []).join(',')}"></div><div class="edit-section"><h4>Main Image</h4><img src="${itemData.secure_url}" alt="Current Main Image" class="edit-image-preview"><label for="edit-merch-image">Replace Main Image (optional)</label><input type="file" id="edit-merch-image" accept="image/*"></div><div class="edit-section"><h4>Product Gallery</h4><div class="edit-gallery-grid" id="edit-gallery-grid">${galleryGridHtml}</div><label for="edit-merch-gallery-add">Add More Gallery Images (optional)</label><input type="file" id="edit-merch-gallery-add" accept="image/*" multiple></div>`; } else if (collection === 'gallery') { const galleryImages = itemData.imageUrls || []; const galleryGridHtml = galleryImages.map(url => `<div class="edit-gallery-item" data-url="${url}"><img src="${url}" alt="Gallery image"><button type="button" class="edit-gallery-delete-btn">&times;</button></div>`).join(''); contentHtml = `<div class="edit-section"><h4>Gallery Details</h4><label for="edit-gallery-title">Gallery Title</label><input type="text" id="edit-gallery-title" value="${itemData.title || ''}" required></div><div class="edit-section"><h4>Gallery Images</h4><div class="edit-gallery-grid" id="edit-gallery-grid">${galleryGridHtml}</div><label for="edit-gallery-add">Add More Images (optional)</label><input type="file" id="edit-gallery-add" accept="image/*" multiple></div>`; } fieldsContainer.innerHTML = contentHtml; modal.style.display = 'flex'; }
async function handleUpdate(e) { e.preventDefault(); const form = e.target; const id = form.dataset.id; const collection = form.dataset.collection; const button = form.querySelector('button[type="submit"]'); button.disabled = true; button.textContent = 'Saving...'; const dataToUpdate = {}; try { if (collection === 'music') { dataToUpdate.title = document.getElementById('edit-music-title').value; dataToUpdate.artist = document.getElementById('edit-music-artist').value; dataToUpdate.releaseDate = document.getElementById('edit-music-release-date').value; dataToUpdate.producer = document.getElementById('edit-music-producer').value; dataToUpdate.composers = document.getElementById('edit-music-composers').value; const newImageFile = document.getElementById('edit-music-image').files[0]; if (newImageFile) { const imageData = await uploadToCloudinary(newImageFile, 'image'); dataToUpdate.thumbnail_url = imageData.secure_url; } const newAudioFile = document.getElementById('edit-music-file').files[0]; if (newAudioFile) { const audioData = await uploadToCloudinary(newAudioFile, 'video'); dataToUpdate.secure_url = audioData.secure_url; } } else if (collection === 'merchandise') { dataToUpdate.name = document.getElementById('edit-merch-name').value; dataToUpdate.price = parseFloat(document.getElementById('edit-merch-price').value); const sizesString = document.getElementById('edit-merch-sizes').value; dataToUpdate.sizes = sizesString.split(',').map(s => s.trim()).filter(s => s); const colorsString = document.getElementById('edit-merch-colors').value; dataToUpdate.colors = colorsString.split(',').map(c => c.trim()).filter(c => c); const newMainImageFile = document.getElementById('edit-merch-image').files[0]; if (newMainImageFile) { const imageData = await uploadToCloudinary(newMainImageFile, 'image'); dataToUpdate.secure_url = imageData.secure_url; } const existingGalleryItems = document.querySelectorAll('#edit-gallery-grid .edit-gallery-item'); const finalGalleryUrls = []; existingGalleryItems.forEach(item => { if (item.dataset.deleted !== 'true') { finalGalleryUrls.push(item.dataset.url); } }); const newGalleryFiles = document.getElementById('edit-merch-gallery-add').files; if (newGalleryFiles.length > 0) { const uploadPromises = Array.from(newGalleryFiles).map(file => uploadToCloudinary(file, 'image')); const newImageData = await Promise.all(uploadPromises); newImageData.forEach(data => finalGalleryUrls.push(data.secure_url)); } dataToUpdate.galleryImageUrls = finalGalleryUrls; } else if (collection === 'gallery') { dataToUpdate.title = document.getElementById('edit-gallery-title').value; const existingGalleryItems = document.querySelectorAll('#edit-gallery-grid .edit-gallery-item'); let finalImageUrls = []; existingGalleryItems.forEach(item => { if (item.dataset.deleted !== 'true') { finalImageUrls.push(item.dataset.url); } }); const newImageFiles = document.getElementById('edit-gallery-add').files; if (newImageFiles.length > 0) { const uploadPromises = Array.from(newImageFiles).map(file => uploadToCloudinary(file, 'image')); const newImageData = await Promise.all(uploadPromises); newImageData.forEach(data => finalImageUrls.push(data.secure_url)); } if (finalImageUrls.length === 0) { throw new Error("A gallery item must have at least one image."); } dataToUpdate.imageUrls = finalImageUrls; dataToUpdate.secure_url = finalImageUrls[0]; dataToUpdate.thumbnail_url = finalImageUrls[0]; } await db.collection(collection).doc(id).update(dataToUpdate); alert('Item updated successfully!'); if (collection === 'music') globalMusicCache = []; if (collection === 'merchandise') globalMerchCache = []; document.getElementById('editModal').style.display = 'none'; } catch (error) { console.error("Update failed: ", error); alert(`Update failed: ${error.message}`); } finally { button.disabled = false; button.textContent = 'Save Changes'; } }
const musicForm = document.getElementById('music-form'); if (musicForm) { musicForm.addEventListener('submit', async (e) => { e.preventDefault(); const button = e.target.querySelector('button'); button.disabled = true; button.textContent = 'Uploading...'; try { const title = e.target.elements['music-title'].value; const artist = e.target.elements['music-artist'].value; const releaseDate = e.target.elements['music-release-date'].value; const producer = e.target.elements['music-producer'].value; const composers = e.target.elements['music-composers'].value; const audioFile = e.target.elements['music-file'].files[0]; const imageFile = e.target.elements['music-image'].files[0]; const imageCloudinaryData = await uploadToCloudinary(imageFile, 'image'); const audioCloudinaryData = await uploadToCloudinary(audioFile, 'video'); await db.collection('music').add({ title, artist, releaseDate, producer, composers, secure_url: audioCloudinaryData.secure_url, public_id: audioCloudinaryData.public_id, thumbnail_url: imageCloudinaryData.secure_url, thumbnail_public_id: imageCloudinaryData.public_id, createdAt: firebase.firestore.FieldValue.serverTimestamp() }); globalMusicCache = []; alert('Track uploaded successfully!'); musicForm.reset(); } catch (error) { console.error("Upload failed: ", error); alert(`Upload failed: ${error.message}`); } finally { button.disabled = false; button.textContent = 'Upload Track'; } }); }
const merchForm = document.getElementById('merch-form'); if (merchForm) { merchForm.addEventListener('submit', async (e) => { e.preventDefault(); const button = e.target.querySelector('button'); button.disabled = true; button.textContent = 'Uploading...'; try { const name = e.target.elements['merch-name'].value; const price = parseFloat(e.target.elements['merch-price'].value); const mainImageFile = e.target.elements['merch-image'].files[0]; const galleryImageFiles = e.target.elements['merch-gallery-images'].files; const sizesString = e.target.elements['merch-sizes'].value; const sizes = sizesString.split(',').map(s => s.trim()).filter(s => s); const colorsString = e.target.elements['merch-colors'].value; const colors = colorsString.split(',').map(c => c.trim()).filter(c => c); const mainCloudinaryData = await uploadToCloudinary(mainImageFile, 'image'); const galleryUploadPromises = []; for (const file of galleryImageFiles) { galleryUploadPromises.push(uploadToCloudinary(file, 'image')); } const galleryCloudinaryData = await Promise.all(galleryUploadPromises); const galleryImageUrls = galleryCloudinaryData.map(data => data.secure_url); await db.collection('merchandise').add({ name, price, sizes, colors, secure_url: mainCloudinaryData.secure_url, public_id: mainCloudinaryData.public_id, galleryImageUrls: galleryImageUrls, createdAt: firebase.firestore.FieldValue.serverTimestamp() }); globalMerchCache = []; alert('Product added successfully!'); merchForm.reset(); } catch (error) { console.error("Upload failed: ", error); alert(`Upload failed: ${error.message}`); } finally { button.disabled = false; button.textContent = 'Add Product'; } }); }
const galleryForm = document.getElementById('gallery-form'); if (galleryForm) { galleryForm.addEventListener('submit', async (e) => { e.preventDefault(); const button = e.target.querySelector('button'); button.disabled = true; button.textContent = 'Uploading...'; try { const title = e.target.elements['gallery-title'].value; const imageFiles = e.target.elements['gallery-images'].files; if (imageFiles.length === 0) { throw new Error("Please select at least one image."); } const uploadPromises = Array.from(imageFiles).map(file => uploadToCloudinary(file, 'image')); const uploadedImagesData = await Promise.all(uploadPromises); const imageUrls = uploadedImagesData.map(data => data.secure_url); await db.collection('gallery').add({ title, imageUrls: imageUrls, secure_url: imageUrls[0], thumbnail_url: imageUrls[0], createdAt: firebase.firestore.FieldValue.serverTimestamp() }); alert('Photos uploaded successfully!'); galleryForm.reset(); } catch (error) { console.error("Upload failed: ", error); alert(`Upload failed: ${error.message}`); } finally { button.disabled = false; button.textContent = 'Upload Photos'; } }); }
async function handleDelete(docId, collectionName) { if (!confirm(`Are you sure you want to remove this item from the website?`)) return; try { await db.collection(collectionName).doc(docId).delete(); if (collectionName === 'music') globalMusicCache = []; if (collectionName === 'merchandise') globalMerchCache = []; alert('Item removed from the website successfully.'); } catch (error) { console.error("Deletion failed: ", error); alert(`Deletion failed: ${error.message}`); } }