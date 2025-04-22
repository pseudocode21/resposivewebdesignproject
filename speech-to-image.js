document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const voiceBtn = document.getElementById('voice-btn');
    const resetBtn = document.getElementById('reset-btn');
    const promptInput = document.getElementById('prompt-input');
    const generateBtn = document.getElementById('generate-btn');
    const speechStatus = document.getElementById('speech-status');
    const sizeSelect = document.getElementById('size-select');
    const countSelect = document.getElementById('count-select');
    const loader = document.querySelector('.loading-container');
    const resultsSection = document.getElementById('results-section');
    const resultsContainer = document.getElementById('results-container');
    const creativitySlider = document.getElementById('creativity-slider');
    const creativityValue = document.getElementById('creativity-value');

    // API configuration - reusing the same API key from script.js
    const API_TOKEN = "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";
    const MODEL_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";

    // Speech recognition setup
    let recognition = null;
    let isRecording = false;

    // Initialize speech recognition if browser supports it
    function initSpeechRecognition() {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            // Create speech recognition instance
            recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            
            // Configure speech recognition
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US'; // You can change this to support other languages
            
            // Handle speech recognition results
            recognition.onresult = function(event) {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');
                
                promptInput.value = transcript;
                
                // Enable generate button if we have text
                if (transcript.trim() !== '') {
                    generateBtn.disabled = false;
                }
            };
            
            // Handle speech recognition end
            recognition.onend = function() {
                stopRecording();
                speechStatus.textContent = 'Voice input completed. Click generate or speak again.';
            };
            
            // Handle speech recognition errors
            recognition.onerror = function(event) {
                stopRecording();
                
                if (event.error === 'no-speech') {
                    speechStatus.textContent = 'No speech detected. Try speaking again.';
                } else if (event.error === 'audio-capture') {
                    speechStatus.classList.add('error');
                    speechStatus.textContent = 'Microphone not found or not allowed.';
                } else if (event.error === 'not-allowed') {
                    speechStatus.classList.add('error');
                    speechStatus.textContent = 'Microphone access denied. Check browser permissions.';
                } else {
                    speechStatus.classList.add('error');
                    speechStatus.textContent = 'Speech recognition error. Try again.';
                    console.error('Speech recognition error:', event.error);
                }
            };
            
            return true;
        } else {
            speechStatus.classList.add('error');
            speechStatus.textContent = 'Your browser does not support speech recognition.';
            voiceBtn.disabled = true;
            return false;
        }
    }

    // Start recording
    function startRecording() {
        isRecording = true;
        voiceBtn.classList.add('recording');
        speechStatus.classList.add('listening');
        speechStatus.textContent = 'Listening... Speak now';
        
        try {
            recognition.start();
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
            stopRecording();
            speechStatus.classList.add('error');
            speechStatus.textContent = 'Failed to start speech recognition. Try again.';
        }
    }

    // Stop recording
    function stopRecording() {
        isRecording = false;
        voiceBtn.classList.remove('recording');
        speechStatus.classList.remove('listening');
        
        try {
            recognition.stop();
        } catch (error) {
            // Ignore errors when stopping
        }
    }

    // Toggle recording state
    function toggleRecording() {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }

    // Reset input
    function resetInput() {
        promptInput.value = '';
        generateBtn.disabled = true;
        speechStatus.textContent = 'Click the microphone to start speaking';
        speechStatus.classList.remove('error', 'listening');
        stopRecording();
    }

    // Generate images (similar to the function in script.js)
    async function generateImages() {
        const prompt = promptInput.value.trim();
        
        if (!prompt) {
            speechStatus.classList.add('error');
            speechStatus.textContent = 'Please speak or type a prompt first';
            return;
        }
        
        // Get selected size and count
        const size = sizeSelect.value;
        const count = parseInt(countSelect.value);
        
        // Parse width and height from size
        const [width, height] = size.split('x').map(dim => parseInt(dim));
        
        // Get creativity value (guidance_scale is inverse to creativity)
        let guidanceScale = 7.5; // Default value
        if (creativitySlider) {
            const creativity = parseInt(creativitySlider.value);
            guidanceScale = 10 - (creativity / 10); // Map 0-100 to 10-0
        }
        
        // Show loading animation
        loader.style.display = 'flex';
        resultsSection.style.display = 'none';
        
        // Change button text and disable it
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        generateBtn.disabled = true;
        
        // Clear previous results
        resultsContainer.innerHTML = '';
        
        try {
            const generationPromises = [];
            
            // Create a promise for each image to be generated
            for (let i = 0; i < count; i++) {
                generationPromises.push(
                    fetch(MODEL_URL, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${API_TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            inputs: prompt,
                            parameters: {
                                width: width,
                                height: height,
                                guidance_scale: guidanceScale,
                                num_inference_steps: 30
                            },
                            options: {
                                wait_for_model: true
                            }
                        })
                    })
                );
            }
            
            // Wait for all images to be generated
            const responses = await Promise.all(generationPromises);
            
            // Process each response
            for (const response of responses) {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                // Get the image as a blob
                const blob = await response.blob();
                const imageUrl = URL.createObjectURL(blob);
                
                // Create and add image card to results
                const imageCard = createImageCard(imageUrl, prompt);
                resultsContainer.appendChild(imageCard);
            }
            resultsSection.style.display = 'block';
            showNotification('Images generated successfully!', 'info');
            
        } catch (error) {
            console.error('Error generating images:', error);
            speechStatus.classList.add('error');
            speechStatus.textContent = 'Error generating images. Please try again.';
        } finally {
            // Hide loading animation
            loader.style.display = 'none';
            
            // Reset button text and enable it
            generateBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate';
            generateBtn.disabled = false;
        }
    }

    // Create image card
    function createImageCard(imageUrl, promptText) {
        const card = document.createElement('div');
        card.className = 'image-card';
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = promptText;
        img.loading = 'lazy';
        
        const actions = document.createElement('div');
        actions.className = 'card-actions';
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'action-btn';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
        downloadBtn.onclick = () => downloadImage(imageUrl);
        
        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn';
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
        
        actions.appendChild(downloadBtn);
        actions.appendChild(editBtn);
        card.appendChild(img);
        card.appendChild(actions);
        
        return card;
    }
    
    // Download image
    function downloadImage(imageUrl) {
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = `ai-image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Show notification
    function showNotification(message, type) {
        speechStatus.textContent = message;
        speechStatus.className = 'speech-status';
        
        if (type === 'error') {
            speechStatus.classList.add('error');
        }
    }

    // Event listeners
    if (creativitySlider && creativityValue) {
        creativitySlider.addEventListener('input', function() {
            creativityValue.textContent = this.value;
        });
    }
    
    // Initialize speech recognition
    if (initSpeechRecognition()) {
        voiceBtn.addEventListener('click', toggleRecording);
    }
    
    resetBtn.addEventListener('click', resetInput);
    generateBtn.addEventListener('click', generateImages);

    // FAQ toggle functionality
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const icon = question.querySelector('.toggle-icon');
            
            // Toggle answer visibility
            answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
            
            // Toggle icon
            icon.textContent = answer.style.display === 'block' ? '−' : '+';
        });
    });

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const authButtons = document.querySelector('.auth-buttons');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            authButtons.classList.toggle('active');
            
            // Toggle menu icon
            const icon = mobileMenuBtn.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.navbar') && !event.target.closest('.mobile-menu-btn')) {
            navLinks.classList.remove('active');
            authButtons.classList.remove('active');
            
            // Reset menu icon
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    });
}); 